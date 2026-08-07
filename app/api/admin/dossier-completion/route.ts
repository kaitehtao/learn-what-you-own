import { env } from "cloudflare:workers";
import { ensureDossierCompletionSchema } from "../../../../db/runtimeSchema";
import { activeDossierQualityRule, reconcileDossierQuality } from "../../../data/dossierQuality";
import {
  buildCompletionClaims,
  completionClaimMetrics,
  type CompletionClaim,
  type CompletionNarrative,
  type CompletionSource,
} from "../../../data/dossierCompletionClaims";
import { apiError, requireEditor } from "../../../supabase-server";

export const dynamic = "force-dynamic";

type EligibleDossier = {
  ticker: string;
  name: string;
  market_cap: number | null;
  lede: string;
  sells: string;
  revenue_model: string;
  opportunity: string;
  must_go_right: string;
  thesis_breaker: string;
  bull_json: string;
  bear_json: string;
  financial_drivers_json: string;
  risks_json: string;
  source_count: number;
};

type StoredSource = {
  title: string;
  url: string;
  evidence_date: string | null;
  excerpt: string | null;
  source_type: string;
};

function parseArray<T>(value: string): T[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) throw new Error("A structured dossier section is not an array.");
  return parsed as T[];
}

function narrativeFromRow(row: EligibleDossier): CompletionNarrative {
  return {
    lede: row.lede,
    sells: row.sells,
    revenueModel: row.revenue_model,
    opportunity: row.opportunity,
    mustGoRight: row.must_go_right,
    thesisBreaker: row.thesis_breaker,
    bull: parseArray<string>(row.bull_json),
    bear: parseArray<string>(row.bear_json),
    financialDrivers: parseArray<CompletionNarrative["financialDrivers"][number]>(row.financial_drivers_json),
    risks: parseArray<CompletionNarrative["risks"][number]>(row.risks_json),
  };
}

function sourceFromRow(row: StoredSource): CompletionSource {
  return {
    title: row.title,
    url: row.url,
    evidenceDate: row.evidence_date || new Date().toISOString().slice(0, 10),
    excerpt: row.excerpt || `Open ${row.title} to verify the cited claim in the original source.`,
    sourceType: row.source_type,
  };
}

async function dashboardData() {
  await ensureDossierCompletionSchema();
  const [summary, batches, candidates] = await Promise.all([
    env.DB.prepare(`SELECT
      SUM(CASE WHEN quality_tier='benchmark_complete' THEN 1 ELSE 0 END) AS benchmark_complete,
      SUM(CASE WHEN quality_tier='machine_enriched' THEN 1 ELSE 0 END) AS machine_enriched,
      SUM(CASE WHEN quality_tier='machine_enriched' AND validated_at IS NOT NULL
        AND NULLIF(TRIM(description),'') IS NOT NULL AND NULLIF(TRIM(lede),'') IS NOT NULL
        AND NULLIF(TRIM(sells),'') IS NOT NULL AND NULLIF(TRIM(revenue_model),'') IS NOT NULL
        AND NULLIF(TRIM(opportunity),'') IS NOT NULL AND NULLIF(TRIM(must_go_right),'') IS NOT NULL
        AND NULLIF(TRIM(editor_note),'') IS NOT NULL AND NULLIF(TRIM(bull_title),'') IS NOT NULL
        AND NULLIF(TRIM(bear_title),'') IS NOT NULL AND NULLIF(TRIM(thesis_breaker),'') IS NOT NULL
        AND NULLIF(TRIM(competitors),'') IS NOT NULL AND json_valid(bull_json) AND json_valid(bear_json)
        AND json_valid(financial_drivers_json) AND json_valid(risks_json)
        AND json_valid(monitor_json) AND json_valid(questions_json)
        THEN 1 ELSE 0 END) AS narrative_ready,
      SUM(CASE WHEN quality_tier='starting_point' THEN 1 ELSE 0 END) AS starting_point
      FROM company_dossiers`).first(),
    env.DB.prepare(`SELECT id,universe_name,selection_rule,requested_count,selected_count,
      approved_count,needs_revision_count,status,created_by,created_at,completed_at
      FROM dossier_completion_batches ORDER BY created_at DESC LIMIT 12`).all(),
    env.DB.prepare(`SELECT cc.batch_id,cc.ticker,cc.priority_rank,cc.status,cc.source_count,
      cc.claim_preview_json,cc.validation_json,cc.review_note,cc.reviewed_by,cc.reviewed_at,cc.approved_at,
      c.name,c.market_cap,d.quality_tier,d.evidence_date
      FROM dossier_completion_candidates cc
      JOIN companies c ON c.ticker=cc.ticker
      JOIN company_dossiers d ON d.ticker=cc.ticker
      WHERE cc.batch_id IN (SELECT id FROM dossier_completion_batches ORDER BY created_at DESC LIMIT 4)
      ORDER BY cc.batch_id DESC,cc.priority_rank LIMIT 120`).all(),
  ]);
  return { summary, batches: batches.results, candidates: candidates.results };
}

async function createBatch(count: number, username: string) {
  await ensureDossierCompletionSchema();
  const rule = await activeDossierQualityRule();
  const limit = Math.max(1, Math.min(50, Math.floor(count)));
  const eligible = await env.DB.prepare(`SELECT d.ticker,c.name,c.market_cap,d.lede,d.sells,d.revenue_model,
    d.opportunity,d.must_go_right,d.thesis_breaker,d.bull_json,d.bear_json,d.financial_drivers_json,d.risks_json,
    (SELECT COUNT(DISTINCT s.url) FROM dossier_sources s WHERE s.ticker=d.ticker AND s.url LIKE 'https://%') AS source_count
    FROM company_dossiers d JOIN companies c ON c.ticker=d.ticker
    WHERE d.quality_tier='machine_enriched' AND d.validated_at IS NOT NULL
      AND NULLIF(TRIM(d.description),'') IS NOT NULL AND NULLIF(TRIM(d.lede),'') IS NOT NULL
      AND NULLIF(TRIM(d.sells),'') IS NOT NULL AND NULLIF(TRIM(d.revenue_model),'') IS NOT NULL
      AND NULLIF(TRIM(d.opportunity),'') IS NOT NULL AND NULLIF(TRIM(d.must_go_right),'') IS NOT NULL
      AND NULLIF(TRIM(d.editor_note),'') IS NOT NULL AND NULLIF(TRIM(d.bull_title),'') IS NOT NULL
      AND NULLIF(TRIM(d.bear_title),'') IS NOT NULL AND NULLIF(TRIM(d.thesis_breaker),'') IS NOT NULL
      AND NULLIF(TRIM(d.competitors),'') IS NOT NULL
      AND json_valid(d.bull_json) AND json_valid(d.bear_json)
      AND json_valid(d.financial_drivers_json) AND json_valid(d.risks_json)
      AND json_valid(d.monitor_json) AND json_valid(d.questions_json)
      AND (SELECT COUNT(DISTINCT s.url) FROM dossier_sources s WHERE s.ticker=d.ticker AND s.url LIKE 'https://%')>=?
      AND NOT EXISTS (SELECT 1 FROM dossier_completion_candidates cc WHERE cc.ticker=d.ticker)
    ORDER BY c.market_cap IS NULL,c.market_cap DESC,c.ticker LIMIT ?`).bind(rule.min_source_count, limit).all<EligibleDossier>();

  const prepared: { row: EligibleDossier; claims: CompletionClaim[] }[] = [];
  for (const row of eligible.results) {
    const sources = await env.DB.prepare(`SELECT title,url,evidence_date,excerpt,source_type
      FROM dossier_sources WHERE ticker=? AND url LIKE 'https://%'
      ORDER BY CASE WHEN source_type LIKE '%sec%' THEN 0 ELSE 1 END,evidence_date DESC,url LIMIT 12`)
      .bind(row.ticker).all<StoredSource>();
    try {
      prepared.push({ row, claims: buildCompletionClaims(narrativeFromRow(row), sources.results.map(sourceFromRow)) });
    } catch (error) {
      console.error(`Unable to prepare completion packet for ${row.ticker}.`, error);
    }
  }
  if (!prepared.length) return { created: false, reason: "no_eligible_narrative_ready_dossiers" };

  const id = `benchmark-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${crypto.randomUUID().slice(0, 8)}`;
  const selectionRule = `Validated machine-enriched dossiers with at least ${rule.min_source_count} exact sources; current market capitalization descending.`;
  const statements = [env.DB.prepare(`INSERT INTO dossier_completion_batches
    (id,universe_name,selection_rule,requested_count,selected_count,status,created_by)
    VALUES (?,'All covered U.S. equities',?,?,?,'editorial_review',?)`)
    .bind(id, selectionRule, limit, prepared.length, username)];
  prepared.forEach(({ row, claims }, index) => statements.push(env.DB.prepare(`INSERT INTO dossier_completion_candidates
    (batch_id,ticker,priority_rank,status,source_count,claim_preview_json,validation_json)
    VALUES (?,?,?,'evidence_packet_ready',?,?,?)`).bind(
      id,
      row.ticker,
      index + 1,
      row.source_count,
      JSON.stringify(claims),
      JSON.stringify({ metrics: completionClaimMetrics(claims), activeRule: rule.id, preparedAt: new Date().toISOString() }),
    )));
  await env.DB.batch(statements);
  return { created: true, batchId: id, selected: prepared.length, tickers: prepared.map(({ row }) => row.ticker), rule };
}

async function updateBatchCounts(batchId: string) {
  await env.DB.prepare(`UPDATE dossier_completion_batches SET
    approved_count=(SELECT COUNT(*) FROM dossier_completion_candidates WHERE batch_id=? AND status='approved'),
    needs_revision_count=(SELECT COUNT(*) FROM dossier_completion_candidates WHERE batch_id=? AND status='needs_revision'),
    status=CASE WHEN NOT EXISTS (
      SELECT 1 FROM dossier_completion_candidates WHERE batch_id=? AND status IN ('evidence_packet_ready','editorial_review')
    ) THEN 'completed' ELSE 'editorial_review' END,
    completed_at=CASE WHEN NOT EXISTS (
      SELECT 1 FROM dossier_completion_candidates WHERE batch_id=? AND status IN ('evidence_packet_ready','editorial_review')
    ) THEN CURRENT_TIMESTAMP ELSE NULL END
    WHERE id=?`).bind(batchId, batchId, batchId, batchId, batchId).run();
}

export async function GET(request: Request) {
  try {
    await requireEditor(request);
    return Response.json(await dashboardData(), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireEditor(request);
    const payload = await request.json().catch(() => ({})) as { count?: number };
    const result = await createBatch(Number(payload.count) || 30, profile.username);
    return Response.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireEditor(request);
    await ensureDossierCompletionSchema();
    const payload = await request.json() as { batchId?: string; ticker?: string; action?: "approve" | "needs_revision"; note?: string };
    const batchId = String(payload.batchId ?? "").trim();
    const ticker = String(payload.ticker ?? "").trim().toUpperCase();
    if (!batchId || !ticker) return Response.json({ error: "Batch and ticker are required." }, { status: 400 });
    const candidate = await env.DB.prepare(`SELECT batch_id,ticker,status,claim_preview_json
      FROM dossier_completion_candidates WHERE batch_id=? AND ticker=?`).bind(batchId, ticker)
      .first<{ batch_id: string; ticker: string; status: string; claim_preview_json: string }>();
    if (!candidate) return Response.json({ error: "Completion candidate was not found." }, { status: 404 });

    if (payload.action === "needs_revision") {
      const note = String(payload.note ?? "").trim();
      if (note.length < 10) return Response.json({ error: "Explain what evidence or analysis needs revision." }, { status: 400 });
      await env.DB.prepare(`UPDATE dossier_completion_candidates SET status='needs_revision',review_note=?,reviewed_by=?,
        reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE batch_id=? AND ticker=?`)
        .bind(note, profile.username, batchId, ticker).run();
      await updateBatchCounts(batchId);
      return Response.json({ updated: true, status: "needs_revision" });
    }
    if (payload.action !== "approve") return Response.json({ error: "Choose approve or needs_revision." }, { status: 400 });
    if (!['evidence_packet_ready', 'editorial_review', 'needs_revision'].includes(candidate.status)) {
      return Response.json({ error: "This candidate has already been finalized." }, { status: 409 });
    }

    const claims = parseArray<CompletionClaim>(candidate.claim_preview_json);
    const rule = await activeDossierQualityRule();
    const metrics = completionClaimMetrics(claims);
    if (metrics.claims < rule.min_verified_claim_count || metrics.sections < rule.min_distinct_section_count || metrics.claimTypes < rule.min_distinct_claim_type_count) {
      return Response.json({ error: "The claim preview does not pass the active evidence rule.", metrics, rule }, { status: 409 });
    }
    const available = await env.DB.prepare("SELECT url FROM dossier_sources WHERE ticker=? AND url LIKE 'https://%'").bind(ticker).all<{ url: string }>();
    const sourceUrls = new Set(available.results.map((source) => source.url));
    const missing = claims.filter((item) => !sourceUrls.has(item.sourceUrl)).map((item) => item.sourceUrl);
    if (missing.length || sourceUrls.size < rule.min_source_count) {
      return Response.json({ error: "One or more preview citations no longer match an exact stored source.", missing }, { status: 409 });
    }

    const statements = claims.map((item) => env.DB.prepare(`INSERT INTO dossier_claims
      (ticker,section,claim_type,claim,why_it_matters,source_title,source_url,source_excerpt,evidence_date,status,verified_by,verified_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,'published',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(ticker,claim,source_url) DO UPDATE SET section=excluded.section,claim_type=excluded.claim_type,
        why_it_matters=excluded.why_it_matters,source_title=excluded.source_title,source_excerpt=excluded.source_excerpt,
        evidence_date=excluded.evidence_date,status='published',verified_by=excluded.verified_by,verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`)
      .bind(ticker, item.section, item.claimType, item.claim, item.whyItMatters, item.sourceTitle, item.sourceUrl, item.sourceExcerpt, item.evidenceDate, profile.username));
    await env.DB.batch(statements);
    await reconcileDossierQuality();
    const dossier = await env.DB.prepare("SELECT quality_tier FROM company_dossiers WHERE ticker=?").bind(ticker).first<{ quality_tier: string }>();
    const approved = dossier?.quality_tier === "benchmark_complete";
    await env.DB.prepare(`UPDATE dossier_completion_candidates SET status=?,validation_json=?,review_note=?,reviewed_by=?,
      reviewed_at=CURRENT_TIMESTAMP,approved_at=?,updated_at=CURRENT_TIMESTAMP WHERE batch_id=? AND ticker=?`).bind(
        approved ? "approved" : "needs_revision",
        JSON.stringify({ metrics, activeRule: rule.id, qualityTier: dossier?.quality_tier ?? "missing", checkedAt: new Date().toISOString() }),
        approved ? "" : "The active database quality rule did not classify this dossier as benchmark complete.",
        profile.username,
        approved ? new Date().toISOString() : null,
        batchId,
        ticker,
      ).run();
    await updateBatchCounts(batchId);
    if (!approved) return Response.json({ error: "Claims were saved, but the active quality rule still requires revision.", qualityTier: dossier?.quality_tier }, { status: 409 });
    return Response.json({ updated: true, status: "approved", qualityTier: dossier.quality_tier });
  } catch (error) {
    return apiError(error);
  }
}
