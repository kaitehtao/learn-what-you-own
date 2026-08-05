import { env } from "cloudflare:workers";
import { fetchNasdaqMarketUniverse } from "../../../market-quotes";

export const dynamic = "force-dynamic";

type RolloutMember = { batch_id: string; ticker: string };
type RolloutBatch = { id: string; universe_name: string };

const ACTIVATION_LIMIT = 75;

function cronSecret() {
  const bindings = env as unknown as Record<string, unknown>;
  const value = bindings.NOTIFICATION_CRON_SECRET || bindings.SCHEDULED_TASK_SECRET;
  return typeof value === "string" && value ? value : process.env.NOTIFICATION_CRON_SECRET || process.env.SCHEDULED_TASK_SECRET;
}

async function runStatements(statements: D1PreparedStatement[]) {
  for (let index = 0; index < statements.length; index += 75) {
    await env.DB.batch(statements.slice(index, index + 75));
  }
}

export async function POST(request: Request) {
  const secret = cronSecret();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const batchResult = await env.DB.prepare(`SELECT id,universe_name
      FROM dossier_expansion_batches
      WHERE status IN ('active','in_progress') AND universe_name='Russell 2000'
      ORDER BY updated_at DESC LIMIT 1`).first<RolloutBatch>();
    if (!batchResult) return Response.json({ error: "No active Russell 2000 rollout batch is configured." }, { status: 409 });

    // Keep the rollout tied to the current database membership rather than a
    // hard-coded ticker snapshot. Existing ranks move outside the live range
    // before the upsert so the unique batch/rank index cannot collide.
    await env.DB.prepare("UPDATE dossier_expansion_members SET priority_rank=priority_rank+1000000 WHERE batch_id=?")
      .bind(batchResult.id).run();
    await env.DB.prepare(`INSERT INTO dossier_expansion_members(
        batch_id,ticker,priority_rank,workflow_status,source_count,updated_at
      )
      SELECT ?,c.ticker,
        ROW_NUMBER() OVER (ORDER BY c.market_cap IS NULL,c.market_cap DESC,c.ticker ASC),
        CASE
          WHEN COALESCE(d.quality_tier,'starting_point')='benchmark_complete' THEN 'benchmark_complete'
          WHEN COALESCE(s.source_count,0)>=5 THEN 'evidence_ready'
          WHEN COALESCE(d.quality_tier,'starting_point')='machine_enriched' THEN 'evidence_ingestion'
          ELSE 'research_backlog'
        END,
        COALESCE(s.source_count,0),CURRENT_TIMESTAMP
      FROM companies c
      LEFT JOIN company_dossiers d ON d.ticker=c.ticker
      LEFT JOIN (SELECT ticker,COUNT(*) AS source_count FROM dossier_sources GROUP BY ticker) s ON s.ticker=c.ticker
      WHERE c.is_active=1 AND c.listing_scope='listed'
        AND c.memberships_json LIKE '%Russell 2000%'
      ON CONFLICT(batch_id,ticker) DO UPDATE SET
        priority_rank=excluded.priority_rank,
        workflow_status=excluded.workflow_status,
        source_count=excluded.source_count,
        updated_at=CURRENT_TIMESTAMP`).bind(batchResult.id).run();
    await env.DB.prepare(`DELETE FROM dossier_expansion_members
      WHERE batch_id=? AND ticker NOT IN (
        SELECT ticker FROM companies
        WHERE is_active=1 AND listing_scope='listed' AND memberships_json LIKE '%Russell 2000%'
      )`).bind(batchResult.id).run();
    await env.DB.prepare(`UPDATE dossier_expansion_batches
      SET target_count=(SELECT COUNT(*) FROM dossier_expansion_members WHERE batch_id=?),
        selection_rule='All active Russell 2000-tagged constituents ranked by the latest available market capitalization; null values sort last. Evidence is ingested in controlled batches and completion requires editorial quality review.',
        status='in_progress',updated_at=CURRENT_TIMESTAMP
      WHERE id=?`).bind(batchResult.id, batchResult.id).run();

    const memberResult = await env.DB.prepare(`SELECT m.batch_id,m.ticker
      FROM dossier_expansion_members m
      JOIN dossier_expansion_batches b ON b.id=m.batch_id
      JOIN companies c ON c.ticker=m.ticker
      LEFT JOIN company_dossiers d ON d.ticker=m.ticker
      WHERE b.status IN ('active','in_progress') AND c.is_active=1
        AND COALESCE(d.quality_tier,'starting_point')='starting_point'
      ORDER BY m.batch_id,m.priority_rank LIMIT ?`).bind(ACTIVATION_LIMIT).all<RolloutMember>();
    const activationMembers = memberResult.results;
    const activations = activationMembers.map((member) => env.DB.prepare(`INSERT INTO company_dossiers(
        ticker,status,quality_tier,quality_run_id,published_at,updated_at
      ) VALUES(?,'published','machine_enriched',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(ticker) DO UPDATE SET
        status='published',
        quality_tier=CASE
          WHEN company_dossiers.quality_tier IN ('benchmark_complete','editorial_review') THEN company_dossiers.quality_tier
          ELSE 'machine_enriched'
        END,
        quality_run_id=COALESCE(company_dossiers.quality_run_id,excluded.quality_run_id),
        published_at=COALESCE(company_dossiers.published_at,CURRENT_TIMESTAMP),
        updated_at=CURRENT_TIMESTAMP`).bind(member.ticker, member.batch_id));
    await runStatements(activations);

    await env.DB.prepare(`UPDATE dossier_expansion_members
      SET source_count=(SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=dossier_expansion_members.ticker),
        workflow_status=CASE
          WHEN (SELECT COALESCE(d.quality_tier,'starting_point') FROM company_dossiers d WHERE d.ticker=dossier_expansion_members.ticker)='benchmark_complete' THEN 'benchmark_complete'
          WHEN (SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=dossier_expansion_members.ticker)>=5 THEN 'evidence_ready'
          WHEN EXISTS(SELECT 1 FROM company_dossiers d WHERE d.ticker=dossier_expansion_members.ticker AND d.quality_tier<>'starting_point') THEN 'evidence_ingestion'
          ELSE 'research_backlog'
        END,
        updated_at=CURRENT_TIMESTAMP
      WHERE batch_id=?`).bind(batchResult.id).run();

    const marketUniverse = await fetchNasdaqMarketUniverse();
    const allMembers = await env.DB.prepare(`SELECT m.batch_id,m.ticker
      FROM dossier_expansion_members m WHERE m.batch_id=? ORDER BY m.priority_rank`)
      .bind(batchResult.id).all<RolloutMember>();
    const updates = allMembers.results.flatMap((member) => {
      const snapshot = marketUniverse.get(member.ticker);
      if (!snapshot || snapshot.marketCap === null) return [];
      return [env.DB.prepare("UPDATE companies SET market_cap=?,updated_at=CURRENT_TIMESTAMP WHERE ticker=?")
        .bind(snapshot.marketCap, member.ticker)];
    });
    await runStatements(updates);

    const batchIds = [batchResult.id];
    for (const batchId of batchIds) {
      // Move the old ranks out of the unique-index range before assigning the
      // current order. Null market caps sort last; ticker is the stable tie-break.
      await env.DB.prepare("UPDATE dossier_expansion_members SET priority_rank=priority_rank+1000000 WHERE batch_id=?")
        .bind(batchId).run();
      await env.DB.prepare(`UPDATE dossier_expansion_members AS target
        SET priority_rank=1+(
          SELECT COUNT(*)
          FROM dossier_expansion_members peer
          JOIN companies peer_company ON peer_company.ticker=peer.ticker
          JOIN companies target_company ON target_company.ticker=target.ticker
          WHERE peer.batch_id=target.batch_id AND (
            (peer_company.market_cap IS NOT NULL AND target_company.market_cap IS NULL)
            OR (peer_company.market_cap IS NOT NULL AND target_company.market_cap IS NOT NULL AND peer_company.market_cap>target_company.market_cap)
            OR (((peer_company.market_cap=target_company.market_cap) OR (peer_company.market_cap IS NULL AND target_company.market_cap IS NULL)) AND peer.ticker<target.ticker)
          )
        ),updated_at=CURRENT_TIMESTAMP
        WHERE target.batch_id=?`).bind(batchId).run();
      await env.DB.prepare("UPDATE dossier_expansion_batches SET updated_at=CURRENT_TIMESTAMP WHERE id=?")
        .bind(batchId).run();
    }

    const ranked = await env.DB.prepare(`SELECT m.batch_id,m.priority_rank,m.ticker,c.name,c.market_cap,m.workflow_status
      FROM dossier_expansion_members m JOIN companies c ON c.ticker=m.ticker
      JOIN dossier_expansion_batches b ON b.id=m.batch_id
      WHERE b.status IN ('active','in_progress')
      ORDER BY m.batch_id,m.priority_rank LIMIT 100`).all();
    const progress = await env.DB.prepare(`SELECT COUNT(*) AS total,
      SUM(CASE WHEN workflow_status='benchmark_complete' THEN 1 ELSE 0 END) AS benchmarkComplete,
      SUM(CASE WHEN workflow_status='evidence_ready' THEN 1 ELSE 0 END) AS evidenceReady,
      SUM(CASE WHEN workflow_status='evidence_ingestion' THEN 1 ELSE 0 END) AS evidenceIngestion,
      SUM(CASE WHEN workflow_status='research_backlog' THEN 1 ELSE 0 END) AS researchBacklog
      FROM dossier_expansion_members WHERE batch_id=?`).bind(batchResult.id).first();
    return Response.json({
      provider: "Nasdaq market activity",
      universeMembers: allMembers.results.length,
      activated: activations.length,
      refreshed: updates.length,
      unavailable: allMembers.results.length - updates.length,
      progress,
      ranked: ranked.results,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : "Market-cap rollout refresh failed." }, { status: 500 });
  }
}
