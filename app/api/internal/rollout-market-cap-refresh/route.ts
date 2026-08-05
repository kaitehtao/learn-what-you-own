import { env } from "cloudflare:workers";
import { fetchNasdaqMarketUniverse } from "../../../market-quotes";

export const dynamic = "force-dynamic";

type RolloutMember = { batch_id: string; ticker: string };

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
    const memberResult = await env.DB.prepare(`SELECT m.batch_id,m.ticker
      FROM dossier_expansion_members m
      JOIN dossier_expansion_batches b ON b.id=m.batch_id
      JOIN companies c ON c.ticker=m.ticker
      WHERE b.status IN ('active','in_progress') AND c.is_active=1
      ORDER BY m.batch_id,m.priority_rank`).all<RolloutMember>();
    const members = memberResult.results;
    const activations = members.map((member) => env.DB.prepare(`INSERT INTO company_dossiers(
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

    const progressUpdates = members.map((member) => env.DB.prepare(`UPDATE dossier_expansion_members
      SET workflow_status='machine_enriched',
          source_count=(SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=dossier_expansion_members.ticker),
          updated_at=CURRENT_TIMESTAMP
      WHERE batch_id=? AND ticker=?`).bind(member.batch_id, member.ticker));
    await runStatements(progressUpdates);

    const marketUniverse = await fetchNasdaqMarketUniverse();
    const updates = members.flatMap((member) => {
      const snapshot = marketUniverse.get(member.ticker);
      if (!snapshot || snapshot.marketCap === null) return [];
      return [env.DB.prepare("UPDATE companies SET market_cap=?,updated_at=CURRENT_TIMESTAMP WHERE ticker=?")
        .bind(snapshot.marketCap, member.ticker)];
    });
    await runStatements(updates);

    const batchIds = [...new Set(members.map((member) => member.batch_id))];
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
      ORDER BY m.batch_id,m.priority_rank`).all();
    return Response.json({
      provider: "Nasdaq market activity",
      activated: activations.length,
      refreshed: updates.length,
      unavailable: members.length - updates.length,
      ranked: ranked.results,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : "Market-cap rollout refresh failed." }, { status: 500 });
  }
}
