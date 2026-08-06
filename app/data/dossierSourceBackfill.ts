import { env } from "cloudflare:workers";
import { ensureDossierFreshnessSchema, ensureDossierSourceBackfillSchema } from "../../db/runtimeSchema";
import { reconcileDossierQuality } from "./dossierQuality";
import type { SecSubmissionFeed } from "./dossierFreshnessClassification";
import { importSecFilingFacts } from "./secFactsRepository";
import { selectSecSourcePack } from "./secSourcePack";

const SEC_AGENT = "LearnWhatYouOwn/1.0 research@learnwhatyouown.com";
const DEFAULT_BATCH_LIMIT = 12;
const MAX_BATCH_LIMIT = 25;
const SELECTION_RULE = "Active Russell 3000 constituents with zero dossier sources, ordered by current market capitalization descending; Russell 2000 membership is retained on each deduplicated batch item.";

type Candidate = {
  ticker: string;
  name: string;
  cik: string | null;
  memberships_json: string;
  priority_rank: number;
  source_count: number;
};

function batchId() {
  return `sec-r3000-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${crypto.randomUUID().slice(0, 8)}`;
}

async function sourceCount(ticker: string) {
  const result = await env.DB.prepare("SELECT COUNT(*) AS count FROM dossier_sources WHERE ticker=?").bind(ticker).first<{ count: number }>();
  return Number(result?.count ?? 0);
}

async function updateBatchItem(batch: string, ticker: string, values: {
  status: string;
  sourceCountAfter: number;
  factsStatus?: string;
  factsDetail?: string;
  error?: string;
}) {
  await env.DB.prepare(`UPDATE dossier_source_backfill_items
    SET status=?,source_count_after=?,facts_import_status=?,facts_import_detail=?,error_message=?,completed_at=CURRENT_TIMESTAMP
    WHERE batch_id=? AND ticker=?`).bind(
      values.status,
      values.sourceCountAfter,
      values.factsStatus ?? "not_attempted",
      (values.factsDetail ?? "").slice(0, 500),
      (values.error ?? "").slice(0, 500),
      batch,
      ticker,
    ).run();
}

async function processCandidate(batch: string, candidate: Candidate) {
  await env.DB.prepare(`INSERT INTO company_dossiers(ticker,status,quality_tier,published_at,updated_at)
    VALUES(?,'published','machine_enriched',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(ticker) DO UPDATE SET
      status='published',
      quality_tier=CASE WHEN company_dossiers.quality_tier='starting_point' THEN 'machine_enriched' ELSE company_dossiers.quality_tier END,
      published_at=COALESCE(company_dossiers.published_at,CURRENT_TIMESTAMP),
      updated_at=CURRENT_TIMESTAMP`).bind(candidate.ticker).run();

  if (!candidate.cik) {
    await updateBatchItem(batch, candidate.ticker, { status: "no_sec_match", sourceCountAfter: candidate.source_count, error: "No verified CIK is stored for this security." });
    return { ticker: candidate.ticker, status: "no_sec_match", sourcesAdded: 0 };
  }

  const paddedCik = candidate.cik.padStart(10, "0");
  const submissionsUrl = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;
  const response = await fetch(submissionsUrl, { headers: { accept: "application/json", "user-agent": SEC_AGENT } });
  if (!response.ok) throw new Error(`SEC submissions returned ${response.status}.`);
  const pack = selectSecSourcePack(candidate.cik, await response.json() as SecSubmissionFeed);
  if (!pack.length) {
    await updateBatchItem(batch, candidate.ticker, { status: "no_supported_filings", sourceCountAfter: candidate.source_count, error: "No supported filings were present in the recent SEC submissions feed." });
    return { ticker: candidate.ticker, status: "no_supported_filings", sourcesAdded: 0 };
  }

  for (const source of pack) {
    await env.DB.prepare(`INSERT OR IGNORE INTO dossier_sources
      (ticker,source_type,title,url,filing_type,filed_at,accessed_at,created_at)
      VALUES (?,'sec',?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(
        candidate.ticker,
        `${source.form} filed ${source.filingDate}`,
        source.sourceUrl,
        source.form,
        source.filingDate,
      ).run();
  }

  const latestFilingDate = pack[0]?.filingDate ?? null;
  await env.DB.prepare(`INSERT OR IGNORE INTO dossier_freshness_checks
    (ticker,last_attempted_at,last_success_at,latest_filing_date,detected_count,error_message)
    VALUES (?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?,0,NULL)`).bind(candidate.ticker, latestFilingDate).run();

  let factsStatus = "not_attempted";
  let factsDetail = "";
  try {
    const facts = await importSecFilingFacts(candidate.ticker);
    factsStatus = facts.status;
    factsDetail = `${facts.imported} normalized facts across ${facts.metrics} metrics.`;
  } catch (error) {
    factsStatus = "error";
    factsDetail = error instanceof Error ? error.message : "SEC Company Facts import failed.";
  }

  const after = await sourceCount(candidate.ticker);
  await updateBatchItem(batch, candidate.ticker, {
    status: "source_foundation_complete",
    sourceCountAfter: after,
    factsStatus,
    factsDetail,
  });
  return { ticker: candidate.ticker, status: "source_foundation_complete", sourcesAdded: Math.max(0, after - candidate.source_count), sourceCount: after, factsStatus };
}

export async function processDossierSourceBackfillBatch(requestedLimit = DEFAULT_BATCH_LIMIT) {
  await Promise.all([ensureDossierSourceBackfillSchema(), ensureDossierFreshnessSchema()]);
  const limit = Math.max(1, Math.min(MAX_BATCH_LIMIT, Math.floor(requestedLimit) || DEFAULT_BATCH_LIMIT));
  const candidateResult = await env.DB.prepare(`SELECT c.ticker,c.name,c.cik,c.memberships_json,
      ROW_NUMBER() OVER (ORDER BY c.market_cap IS NULL,c.market_cap DESC,c.ticker ASC) AS priority_rank,
      COALESCE((SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=c.ticker),0) AS source_count
    FROM companies c
    WHERE c.is_active=1 AND c.listing_scope='listed' AND c.memberships_json LIKE '%Russell 3000%'
      AND NOT EXISTS (SELECT 1 FROM dossier_sources ds WHERE ds.ticker=c.ticker)
      AND NOT EXISTS (
        SELECT 1 FROM dossier_source_backfill_items prior
        WHERE prior.ticker=c.ticker AND (
          prior.status='running'
          OR (prior.status='error' AND prior.completed_at>=datetime('now','-6 hours'))
          OR (prior.status IN ('no_sec_match','no_supported_filings') AND prior.completed_at>=datetime('now','-30 days'))
        )
      )
    ORDER BY c.market_cap IS NULL,c.market_cap DESC,c.ticker ASC LIMIT ?`).bind(limit).all<Candidate>();
  if (!candidateResult.results.length) return { batchId: null, selected: 0, completed: 0, skipped: 0, errors: 0, sourcesAdded: 0, tickers: [], qualityReconciliation: null };

  const id = batchId();
  await env.DB.prepare(`INSERT INTO dossier_source_backfill_batches
    (id,universe_name,selection_rule,requested_limit,selected_count,status)
    VALUES (?,'Russell 3000',?,?,?,'running')`).bind(id, SELECTION_RULE, limit, candidateResult.results.length).run();
  for (const candidate of candidateResult.results) {
    await env.DB.prepare(`INSERT INTO dossier_source_backfill_items
      (batch_id,ticker,priority_rank,memberships_json,status,source_count_before,source_count_after)
      VALUES (?,?,?,?, 'running',?,?)`).bind(
        id,
        candidate.ticker,
        candidate.priority_rank,
        candidate.memberships_json,
        candidate.source_count,
        candidate.source_count,
      ).run();
  }

  const results: Array<Record<string, unknown>> = [];
  for (const candidate of candidateResult.results) {
    try {
      results.push(await processCandidate(id, candidate));
    } catch (error) {
      const message = error instanceof Error ? error.message : "SEC source backfill failed.";
      await updateBatchItem(id, candidate.ticker, { status: "error", sourceCountAfter: await sourceCount(candidate.ticker), error: message });
      results.push({ ticker: candidate.ticker, status: "error", error: message });
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  const counts = await env.DB.prepare(`SELECT COUNT(*) AS selected,
      SUM(CASE WHEN status='source_foundation_complete' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status IN ('no_sec_match','no_supported_filings') THEN 1 ELSE 0 END) AS skipped,
      SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) AS errors,
      SUM(MAX(0,source_count_after-source_count_before)) AS sources_added
    FROM dossier_source_backfill_items WHERE batch_id=?`).bind(id).first<{ selected:number;completed:number;skipped:number;errors:number;sources_added:number }>();
  const completed = Number(counts?.completed ?? 0);
  const skipped = Number(counts?.skipped ?? 0);
  const errors = Number(counts?.errors ?? 0);
  const finalStatus = errors || skipped ? (completed ? "partial" : "failed") : "completed";
  await env.DB.prepare(`UPDATE dossier_source_backfill_batches SET
    success_count=?,skipped_count=?,error_count=?,source_count_added=?,status=?,completed_at=CURRENT_TIMESTAMP
    WHERE id=?`).bind(completed, skipped, errors, Number(counts?.sources_added ?? 0), finalStatus, id).run();

  await env.DB.prepare(`UPDATE dossier_expansion_members SET
    source_count=(SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=dossier_expansion_members.ticker),
    workflow_status=CASE
      WHEN (SELECT COALESCE(d.quality_tier,'starting_point') FROM company_dossiers d WHERE d.ticker=dossier_expansion_members.ticker)='benchmark_complete' THEN 'benchmark_complete'
      WHEN (SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=dossier_expansion_members.ticker)>=5 THEN 'evidence_ready'
      WHEN EXISTS(SELECT 1 FROM dossier_sources ds WHERE ds.ticker=dossier_expansion_members.ticker) THEN 'evidence_ingestion'
      ELSE workflow_status
    END,updated_at=CURRENT_TIMESTAMP
    WHERE ticker IN (SELECT ticker FROM dossier_source_backfill_items WHERE batch_id=?)`).bind(id).run();
  const qualityReconciliation = await reconcileDossierQuality();
  return {
    batchId: id,
    status: finalStatus,
    selected: Number(counts?.selected ?? 0),
    completed,
    skipped,
    errors,
    sourcesAdded: Number(counts?.sources_added ?? 0),
    tickers: results,
    qualityReconciliation,
  };
}
