import { env } from "cloudflare:workers";
import { ensureDossierCompletionSchema } from "../../db/runtimeSchema";
import { activeDossierQualityRule, reconcileDossierQuality, type DossierQualityRule } from "./dossierQuality";
import {
  buildCompletionClaims,
  completionClaimMetrics,
  type CompletionClaim,
  type CompletionNarrative,
  type CompletionSource,
} from "./dossierCompletionClaims";
import { enrichNextDossierNarrative, latestEnrichmentClaims } from "./dossierNarrativeEnrichment";

const SYSTEM_REVIEWER = "system:evidence-benchmark";
const COMPLETION_LOCK = "automatic-benchmark-completion";
const COMPLETION_LEASE_SECONDS = 240;

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

type Candidate = {
  batchId: string;
  ticker: string;
  claims: CompletionClaim[];
  sourceCount: number;
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

function passesMetrics(claims: CompletionClaim[], rule: DossierQualityRule) {
  const metrics = completionClaimMetrics(claims);
  return {
    metrics,
    passes: metrics.claims >= rule.min_verified_claim_count
      && metrics.sections >= rule.min_distinct_section_count
      && metrics.claimTypes >= rule.min_distinct_claim_type_count,
  };
}

async function acquireCompletionLease(ownerId: string) {
  const result = await env.DB.prepare(`INSERT INTO dossier_ingestion_locks(lock_name,owner_id,lease_until,updated_at)
    VALUES (?,?,datetime('now',?),CURRENT_TIMESTAMP)
    ON CONFLICT(lock_name) DO UPDATE SET owner_id=excluded.owner_id,lease_until=excluded.lease_until,updated_at=CURRENT_TIMESTAMP
    WHERE dossier_ingestion_locks.lease_until<=CURRENT_TIMESTAMP`).bind(
      COMPLETION_LOCK,
      ownerId,
      `+${COMPLETION_LEASE_SECONDS} seconds`,
    ).run();
  return Number(result.meta.changes ?? 0) > 0;
}

async function releaseCompletionLease(ownerId: string) {
  await env.DB.prepare("DELETE FROM dossier_ingestion_locks WHERE lock_name=? AND owner_id=?")
    .bind(COMPLETION_LOCK, ownerId).run();
}

async function updateBatchCounts(batchId: string) {
  await env.DB.prepare(`UPDATE dossier_completion_batches SET
    approved_count=(SELECT COUNT(*) FROM dossier_completion_candidates WHERE batch_id=? AND status='approved'),
    needs_revision_count=(SELECT COUNT(*) FROM dossier_completion_candidates WHERE batch_id=? AND status='needs_revision'),
    status=CASE WHEN NOT EXISTS (
      SELECT 1 FROM dossier_completion_candidates WHERE batch_id=? AND status IN ('evidence_packet_ready','editorial_review')
    ) THEN 'completed' ELSE 'automatic_validation' END,
    completed_at=CASE WHEN NOT EXISTS (
      SELECT 1 FROM dossier_completion_candidates WHERE batch_id=? AND status IN ('evidence_packet_ready','editorial_review')
    ) THEN CURRENT_TIMESTAMP ELSE NULL END
    WHERE id=?`).bind(batchId, batchId, batchId, batchId, batchId).run();
}

async function prepareNewBatch(count: number, actor: string) {
  const rule = await activeDossierQualityRule();
  const limit = Math.max(1, Math.min(50, Math.floor(count)));
  const eligible = await env.DB.prepare(`SELECT d.ticker,c.name,c.market_cap,d.lede,d.sells,d.revenue_model,
    d.opportunity,d.must_go_right,d.thesis_breaker,d.bull_json,d.bear_json,d.financial_drivers_json,d.risks_json,
    (SELECT COUNT(DISTINCT s.url) FROM dossier_sources s WHERE s.ticker=d.ticker AND s.url LIKE 'https://%') AS source_count
    FROM company_dossiers d JOIN companies c ON c.ticker=d.ticker
    WHERE d.quality_tier IN ('machine_enriched','editorial_review') AND d.validated_at IS NOT NULL
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
      AND NOT EXISTS (SELECT 1 FROM dossier_completion_candidates cc WHERE cc.ticker=d.ticker
        AND (cc.status IN ('approved','evidence_packet_ready','editorial_review')
          OR (cc.status='needs_revision' AND cc.reviewed_at>=datetime('now','-1 hour'))))
    ORDER BY c.market_cap IS NULL,c.market_cap DESC,c.ticker LIMIT ?`).bind(rule.min_source_count, limit).all<EligibleDossier>();

  const prepared: Candidate[] = [];
  for (const row of eligible.results) {
    const sources = await env.DB.prepare(`SELECT title,url,evidence_date,excerpt,source_type
      FROM dossier_sources WHERE ticker=? AND url LIKE 'https://%'
      ORDER BY CASE WHEN source_type LIKE '%sec%' THEN 0 ELSE 1 END,evidence_date DESC,url LIMIT 12`)
      .bind(row.ticker).all<StoredSource>();
    try {
      const enrichedClaims = await latestEnrichmentClaims(row.ticker);
      prepared.push({ batchId: "", ticker: row.ticker, sourceCount: row.source_count, claims: enrichedClaims ?? buildCompletionClaims(narrativeFromRow(row), sources.results.map(sourceFromRow)) });
    } catch (error) {
      console.error(`Unable to prepare automatic completion packet for ${row.ticker}.`, error);
    }
  }
  if (!prepared.length) return null;

  const batchId = `benchmark-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${crypto.randomUUID().slice(0, 8)}`;
  const selectionRule = `Automatic validation of machine-enriched dossiers with at least ${rule.min_source_count} exact sources; current market capitalization descending.`;
  const statements = [env.DB.prepare(`INSERT INTO dossier_completion_batches
    (id,universe_name,selection_rule,requested_count,selected_count,status,created_by)
    VALUES (?,'All covered U.S. equities',?,?,?,'automatic_validation',?)`)
    .bind(batchId, selectionRule, limit, prepared.length, actor)];
  prepared.forEach((candidate, index) => statements.push(env.DB.prepare(`INSERT INTO dossier_completion_candidates
    (batch_id,ticker,priority_rank,status,source_count,claim_preview_json,validation_json)
    VALUES (?,?,?,'evidence_packet_ready',?,?,?)`).bind(
      batchId,
      candidate.ticker,
      index + 1,
      candidate.sourceCount,
      JSON.stringify(candidate.claims),
      JSON.stringify({ metrics: completionClaimMetrics(candidate.claims), activeRule: rule.id, preparedAt: new Date().toISOString(), mode: "automatic" }),
    )));
  await env.DB.batch(statements);
  return prepared.map((candidate) => ({ ...candidate, batchId }));
}

async function pendingCandidates(limit: number) {
  const rows = await env.DB.prepare(`SELECT batch_id,ticker,source_count,claim_preview_json
    FROM dossier_completion_candidates
    WHERE status IN ('evidence_packet_ready','editorial_review')
      AND batch_id=(SELECT id FROM dossier_completion_batches WHERE status<>'completed' ORDER BY created_at LIMIT 1)
    ORDER BY priority_rank LIMIT ?`).bind(limit).all<{ batch_id: string; ticker: string; source_count: number; claim_preview_json: string }>();
  return rows.results.map((row) => ({
    batchId: row.batch_id,
    ticker: row.ticker,
    sourceCount: row.source_count,
    claims: parseArray<CompletionClaim>(row.claim_preview_json),
  }));
}

async function automaticallyPublish(candidates: Candidate[]) {
  if (!candidates.length) return { approved: 0, needsRevision: 0, tickers: [] as string[] };
  const rule = await activeDossierQualityRule();
  const eligible: Array<Candidate & { metrics: ReturnType<typeof completionClaimMetrics> }> = [];
  let needsRevision = 0;

  for (const candidate of candidates) {
    const { metrics, passes } = passesMetrics(candidate.claims, rule);
    const available = await env.DB.prepare("SELECT url FROM dossier_sources WHERE ticker=? AND url LIKE 'https://%'").bind(candidate.ticker).all<{ url: string }>();
    const sourceUrls = new Set(available.results.map((source) => source.url));
    const missing = candidate.claims.filter((item) => !sourceUrls.has(item.sourceUrl)).map((item) => item.sourceUrl);
    if (!passes || missing.length || sourceUrls.size < rule.min_source_count) {
      needsRevision += 1;
      await env.DB.prepare(`UPDATE dossier_completion_candidates SET status='needs_revision',validation_json=?,review_note=?,reviewed_by=?,
        reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE batch_id=? AND ticker=?`).bind(
          JSON.stringify({ metrics, activeRule: rule.id, missing, sourceCount: sourceUrls.size, checkedAt: new Date().toISOString(), mode: "automatic" }),
          "Automatic evidence validation failed; the dossier remains unpublished at benchmark status.",
          SYSTEM_REVIEWER,
          candidate.batchId,
          candidate.ticker,
        ).run();
      continue;
    }
    const statements = candidate.claims.map((item) => env.DB.prepare(`INSERT INTO dossier_claims
      (ticker,section,claim_type,claim,why_it_matters,source_title,source_url,source_excerpt,evidence_date,status,verified_by,verified_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,'published',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(ticker,claim,source_url) DO UPDATE SET section=excluded.section,claim_type=excluded.claim_type,
        why_it_matters=excluded.why_it_matters,source_title=excluded.source_title,source_excerpt=excluded.source_excerpt,
        evidence_date=excluded.evidence_date,status='published',verified_by=excluded.verified_by,verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`)
      .bind(candidate.ticker, item.section, item.claimType, item.claim, item.whyItMatters, item.sourceTitle, item.sourceUrl, item.sourceExcerpt, item.evidenceDate, SYSTEM_REVIEWER));
    await env.DB.batch(statements);
    eligible.push({ ...candidate, metrics });
  }

  if (eligible.length) await reconcileDossierQuality();
  let approved = 0;
  for (const candidate of eligible) {
    const dossier = await env.DB.prepare("SELECT quality_tier FROM company_dossiers WHERE ticker=?").bind(candidate.ticker).first<{ quality_tier: string }>();
    const completed = dossier?.quality_tier === "benchmark_complete";
    if (completed) approved += 1;
    else needsRevision += 1;
    await env.DB.prepare(`UPDATE dossier_completion_candidates SET status=?,validation_json=?,review_note=?,reviewed_by=?,
      reviewed_at=CURRENT_TIMESTAMP,approved_at=?,updated_at=CURRENT_TIMESTAMP WHERE batch_id=? AND ticker=?`).bind(
        completed ? "approved" : "needs_revision",
        JSON.stringify({ metrics: candidate.metrics, activeRule: rule.id, qualityTier: dossier?.quality_tier ?? "missing", checkedAt: new Date().toISOString(), mode: "automatic" }),
        completed ? "Automatically passed every active evidence and completeness requirement." : "The active database quality rule did not classify this dossier as benchmark complete.",
        SYSTEM_REVIEWER,
        completed ? new Date().toISOString() : null,
        candidate.batchId,
        candidate.ticker,
      ).run();
  }

  for (const batchId of new Set(candidates.map((candidate) => candidate.batchId))) await updateBatchCounts(batchId);
  return { approved, needsRevision, tickers: eligible.map((candidate) => candidate.ticker) };
}

export async function processAutomaticBenchmarkBatch(count = 10, actor = SYSTEM_REVIEWER) {
  await ensureDossierCompletionSchema();
  const limit = Math.max(1, Math.min(50, Math.floor(count)));
  const ownerId = crypto.randomUUID();
  if (!await acquireCompletionLease(ownerId)) {
    return { created: false, reason: "automatic_validation_already_running", selected: 0, approved: 0, needsRevision: 0, tickers: [] as string[] };
  }
  try {
    let candidates = await pendingCandidates(limit);
    let created = false;
    if (!candidates.length) {
      candidates = await prepareNewBatch(limit, actor) ?? [];
      created = candidates.length > 0;
    }
    let enrichment: Awaited<ReturnType<typeof enrichNextDossierNarrative>> | null = null;
    if (!candidates.length) {
      enrichment = await enrichNextDossierNarrative();
      if (enrichment.enriched) {
        candidates = await prepareNewBatch(1, actor) ?? [];
        created = candidates.length > 0;
      }
    }
    if (!candidates.length) return { created: false, reason: enrichment?.reason ?? "no_eligible_narrative_ready_dossiers", enrichment, selected: 0, approved: 0, needsRevision: 0, tickers: [] as string[] };
    const result = await automaticallyPublish(candidates);
    return { created, enrichment, batchId: candidates[0].batchId, selected: candidates.length, ...result };
  } finally {
    await releaseCompletionLease(ownerId);
  }
}
