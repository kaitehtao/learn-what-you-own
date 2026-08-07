import { env } from "cloudflare:workers";
import { ensureDossierFreshnessSchema, ensureDossierSourceBackfillSchema } from "../../db/runtimeSchema";
import { reconcileDossierQuality } from "./dossierQuality";
import type { SecSubmissionFeed } from "./dossierFreshnessClassification";
import { importSecFilingFacts } from "./secFactsRepository";
import { fetchSecJson } from "./secRequest";
import { selectSecSourcePack } from "./secSourcePack";

const SEC_AGENT = "LearnWhatYouOwn/1.0 research@learnwhatyouown.com";
const DEFAULT_BATCH_LIMIT = 12;
const MAX_BATCH_LIMIT = 25;
const STALE_LEASE_MINUTES = 20;
const SELECTION_LEASE_SECONDS = 90;
const SOURCE_FOUNDATION_MINIMUM = 5;
const SELECTION_LOCK = "russell-3000-source-backfill-selection";
const SELECTION_RULE = "Active Russell 3000 constituents with fewer than five dossier sources, ordered by current market capitalization descending; Russell 2000 membership is retained on each deduplicated batch item.";

export type DossierSourceBackfillMessage = {
  kind: "source_backfill";
  batchId: string;
  ticker: string;
  enqueuedAt: string;
};

type QueueBinding = {
  sendBatch(messages: Array<{ body: DossierSourceBackfillMessage }>): Promise<void>;
};

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

function ingestionQueue() {
  const queue = (env as unknown as { DOSSIER_INGESTION_QUEUE?: QueueBinding }).DOSSIER_INGESTION_QUEUE;
  if (!queue) throw new Error("Cloudflare Queue binding `DOSSIER_INGESTION_QUEUE` is unavailable.");
  return queue;
}

async function acquireSelectionLease(ownerId: string) {
  const result = await env.DB.prepare(`INSERT INTO dossier_ingestion_locks(lock_name,owner_id,lease_until,updated_at)
    VALUES (?,?,datetime('now',?),CURRENT_TIMESTAMP)
    ON CONFLICT(lock_name) DO UPDATE SET owner_id=excluded.owner_id,lease_until=excluded.lease_until,updated_at=CURRENT_TIMESTAMP
    WHERE dossier_ingestion_locks.lease_until<=CURRENT_TIMESTAMP`).bind(SELECTION_LOCK, ownerId, `+${SELECTION_LEASE_SECONDS} seconds`).run();
  return Number(result.meta.changes ?? 0) > 0;
}

async function releaseSelectionLease(ownerId: string) {
  await env.DB.prepare("DELETE FROM dossier_ingestion_locks WHERE lock_name=? AND owner_id=?").bind(SELECTION_LOCK, ownerId).run();
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

// Scheduled Workers can be interrupted after some source rows are written but
// before the batch ledger is finalized. Reconcile leases conservatively: a
// ticker with a full source pack is preserved as complete; an unfinished item
// is marked retryable immediately rather than blocking the universe forever.
export async function recoverStaleDossierSourceBackfills(staleMinutes = STALE_LEASE_MINUTES) {
  const safeMinutes = Math.max(10, Math.min(120, Math.floor(staleMinutes) || STALE_LEASE_MINUTES));
  const modifier = `-${safeMinutes} minutes`;
  const stale = await env.DB.prepare(`SELECT id FROM dossier_source_backfill_batches
    WHERE status IN ('queued','running') AND started_at<datetime('now',?) ORDER BY started_at ASC LIMIT 50`).bind(modifier).all<{ id: string }>();
  if (!stale.results.length) return { recoveredBatches: 0, completedItems: 0, retryableItems: 0, batchIds: [] as string[] };
  const ids = stale.results.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(",");

  await env.DB.prepare(`UPDATE dossier_source_backfill_items SET
    source_count_after=(SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=dossier_source_backfill_items.ticker),
    status=CASE WHEN (SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=dossier_source_backfill_items.ticker)>=5
      THEN 'source_foundation_complete' ELSE 'error' END,
    facts_import_status=CASE WHEN (SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=dossier_source_backfill_items.ticker)>=5
      THEN CASE WHEN facts_import_status='not_attempted' THEN 'lease_recovered' ELSE facts_import_status END ELSE facts_import_status END,
    facts_import_detail=CASE WHEN (SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=dossier_source_backfill_items.ticker)>=5
      THEN CASE WHEN facts_import_detail='' THEN 'Source pack preserved after an interrupted batch; Company Facts can refresh on the normal cycle.' ELSE facts_import_detail END ELSE facts_import_detail END,
    error_message=CASE WHEN (SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=dossier_source_backfill_items.ticker)>=5
      THEN '' ELSE 'Lease expired before a complete source pack; ticker released for immediate retry.' END,
    completed_at=CURRENT_TIMESTAMP
    WHERE status IN ('queued','running') AND batch_id IN (${placeholders})`).bind(...ids).run();
  await env.DB.prepare(`UPDATE company_dossiers SET
    status='published',
    quality_tier=CASE WHEN quality_tier='starting_point' THEN 'machine_enriched' ELSE quality_tier END,
    published_at=COALESCE(published_at,CURRENT_TIMESTAMP),
    updated_at=CURRENT_TIMESTAMP
    WHERE ticker IN (
      SELECT i.ticker FROM dossier_source_backfill_items i
      WHERE i.batch_id IN (${placeholders}) AND i.status='source_foundation_complete'
    )`).bind(...ids).run();

  for (const id of ids) {
    await env.DB.prepare(`UPDATE dossier_source_backfill_batches SET
      success_count=(SELECT COUNT(*) FROM dossier_source_backfill_items i WHERE i.batch_id=dossier_source_backfill_batches.id AND i.status='source_foundation_complete'),
      skipped_count=(SELECT COUNT(*) FROM dossier_source_backfill_items i WHERE i.batch_id=dossier_source_backfill_batches.id AND i.status IN ('no_sec_match','no_supported_filings','partial_evidence')),
      error_count=(SELECT COUNT(*) FROM dossier_source_backfill_items i WHERE i.batch_id=dossier_source_backfill_batches.id AND i.status='error'),
      source_count_added=(SELECT COALESCE(SUM(MAX(0,source_count_after-source_count_before)),0) FROM dossier_source_backfill_items i WHERE i.batch_id=dossier_source_backfill_batches.id),
      status=CASE
        WHEN EXISTS(SELECT 1 FROM dossier_source_backfill_items i WHERE i.batch_id=dossier_source_backfill_batches.id AND i.status='error')
          AND EXISTS(SELECT 1 FROM dossier_source_backfill_items i WHERE i.batch_id=dossier_source_backfill_batches.id AND i.status='source_foundation_complete') THEN 'partial'
        WHEN EXISTS(SELECT 1 FROM dossier_source_backfill_items i WHERE i.batch_id=dossier_source_backfill_batches.id AND i.status='error') THEN 'failed'
        WHEN EXISTS(SELECT 1 FROM dossier_source_backfill_items i WHERE i.batch_id=dossier_source_backfill_batches.id AND i.status IN ('no_sec_match','no_supported_filings','partial_evidence')) THEN 'partial'
        ELSE 'completed' END,
      completed_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('queued','running')`).bind(id).run();
  }
  const recoveryCounts = await env.DB.prepare(`SELECT
    SUM(CASE WHEN status='source_foundation_complete' THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN status='error' AND error_message LIKE 'Lease expired%' THEN 1 ELSE 0 END) AS retryable
    FROM dossier_source_backfill_items WHERE batch_id IN (${placeholders})`).bind(...ids).first<{ completed: number; retryable: number }>();
  return {
    recoveredBatches: ids.length,
    completedItems: Number(recoveryCounts?.completed ?? 0),
    retryableItems: Number(recoveryCounts?.retryable ?? 0),
    batchIds: ids,
  };
}

async function processCandidate(batch: string, candidate: Candidate) {
  // Register an unpublished starting point before doing network work. A route
  // becomes public only after the minimum source foundation exists.
  await env.DB.prepare(`INSERT INTO company_dossiers(ticker,status,quality_tier,updated_at)
    VALUES(?,'queued','starting_point',CURRENT_TIMESTAMP)
    ON CONFLICT(ticker) DO UPDATE SET updated_at=CURRENT_TIMESTAMP`).bind(candidate.ticker).run();
  await env.DB.prepare(`UPDATE company_dossiers SET status='queued',published_at=NULL,updated_at=CURRENT_TIMESTAMP
    WHERE ticker=? AND quality_tier IN ('starting_point','machine_enriched')
      AND (SELECT COUNT(*) FROM dossier_sources WHERE ticker=?)<?`).bind(
        candidate.ticker,
        candidate.ticker,
        SOURCE_FOUNDATION_MINIMUM,
      ).run();

  if (!candidate.cik) {
    await updateBatchItem(batch, candidate.ticker, { status: "no_sec_match", sourceCountAfter: candidate.source_count, error: "No verified CIK is stored for this security." });
    return { ticker: candidate.ticker, status: "no_sec_match", sourcesAdded: 0 };
  }

  const paddedCik = candidate.cik.padStart(10, "0");
  const submissionsUrl = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;
  const submissions = await fetchSecJson<SecSubmissionFeed>(submissionsUrl, SEC_AGENT);
  const pack = selectSecSourcePack(candidate.cik, submissions);
  if (!pack.length) {
    await updateBatchItem(batch, candidate.ticker, { status: "no_supported_filings", sourceCountAfter: candidate.source_count, error: "No supported filings were present in the recent SEC submissions feed." });
    return { ticker: candidate.ticker, status: "no_supported_filings", sourcesAdded: 0 };
  }

  for (const source of pack) {
    await env.DB.prepare(`INSERT OR IGNORE INTO dossier_sources
      (ticker,source_type,title,url,evidence_date,excerpt,verified_at,created_at)
      VALUES (?,'sec_filing',?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(
        candidate.ticker,
        `${source.form} filed ${source.filingDate}`,
        source.sourceUrl,
        source.filingDate,
        `Official SEC ${source.form} filing selected for the automated research foundation.`,
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
  if (after < SOURCE_FOUNDATION_MINIMUM) {
    await updateBatchItem(batch, candidate.ticker, {
      status: "partial_evidence",
      sourceCountAfter: after,
      factsStatus,
      factsDetail,
      error: `Only ${after} distinct supported SEC sources are available; ${SOURCE_FOUNDATION_MINIMUM} are required for publication.`,
    });
    return { ticker: candidate.ticker, status: "partial_evidence", sourcesAdded: Math.max(0, after - candidate.source_count), sourceCount: after, factsStatus };
  }

  await env.DB.prepare(`UPDATE company_dossiers SET
    status='published',
    quality_tier=CASE WHEN quality_tier='starting_point' THEN 'machine_enriched' ELSE quality_tier END,
    published_at=COALESCE(published_at,CURRENT_TIMESTAMP),
    updated_at=CURRENT_TIMESTAMP
    WHERE ticker=?`).bind(candidate.ticker).run();
  await updateBatchItem(batch, candidate.ticker, {
    status: "source_foundation_complete",
    sourceCountAfter: after,
    factsStatus,
    factsDetail,
  });
  return { ticker: candidate.ticker, status: "source_foundation_complete", sourcesAdded: Math.max(0, after - candidate.source_count), sourceCount: after, factsStatus };
}

async function finalizeDossierSourceBackfillBatch(id: string) {
  const counts = await env.DB.prepare(`SELECT COUNT(*) AS selected,
      SUM(CASE WHEN status='source_foundation_complete' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status IN ('no_sec_match','no_supported_filings','partial_evidence') THEN 1 ELSE 0 END) AS skipped,
      SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) AS errors,
      SUM(CASE WHEN status IN ('queued','running') THEN 1 ELSE 0 END) AS pending,
      SUM(MAX(0,source_count_after-source_count_before)) AS sources_added
    FROM dossier_source_backfill_items WHERE batch_id=?`).bind(id).first<{ selected:number;completed:number;skipped:number;errors:number;pending:number;sources_added:number }>();
  const pending = Number(counts?.pending ?? 0);
  if (pending > 0) return { finalized: false, pending };
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
    finalized: true,
    batchId: id,
    status: finalStatus,
    selected: Number(counts?.selected ?? 0),
    completed,
    skipped,
    errors,
    sourcesAdded: Number(counts?.sources_added ?? 0),
    qualityReconciliation,
  };
}

export async function processDossierSourceBackfillMessage(message: DossierSourceBackfillMessage) {
  await Promise.all([ensureDossierSourceBackfillSchema(), ensureDossierFreshnessSchema()]);
  if (message.kind !== "source_backfill") throw new Error("Unsupported dossier ingestion message.");
  const candidate = await env.DB.prepare(`SELECT c.ticker,c.name,c.cik,c.memberships_json,i.priority_rank,
      i.source_count_before AS source_count,i.status
    FROM dossier_source_backfill_items i JOIN companies c ON c.ticker=i.ticker
    WHERE i.batch_id=? AND i.ticker=?`).bind(message.batchId, message.ticker).first<Candidate & { status: string }>();
  if (!candidate) throw new Error(`Backfill ledger item ${message.batchId}/${message.ticker} was not found.`);
  if (!["queued", "running"].includes(candidate.status)) {
    return { ticker: candidate.ticker, status: candidate.status, duplicateDelivery: true };
  }

  await env.DB.batch([
    env.DB.prepare("UPDATE dossier_source_backfill_batches SET status='running' WHERE id=? AND status='queued'").bind(message.batchId),
    env.DB.prepare("UPDATE dossier_source_backfill_items SET status='running',error_message='',completed_at=NULL WHERE batch_id=? AND ticker=?").bind(message.batchId, message.ticker),
  ]);
  const result = await processCandidate(message.batchId, candidate);
  const batch = await finalizeDossierSourceBackfillBatch(message.batchId);
  return { ...result, batch };
}

export async function recordDossierSourceBackfillFailure(message: DossierSourceBackfillMessage, error: unknown, terminal: boolean) {
  const detail = error instanceof Error ? error.message : "SEC source backfill failed.";
  if (!terminal) {
    await env.DB.prepare(`UPDATE dossier_source_backfill_items SET status='queued',error_message=?,completed_at=NULL
      WHERE batch_id=? AND ticker=? AND status IN ('queued','running')`).bind(detail.slice(0, 500), message.batchId, message.ticker).run();
    return { terminal: false };
  }
  await updateBatchItem(message.batchId, message.ticker, {
    status: "error",
    sourceCountAfter: await sourceCount(message.ticker),
    error: detail,
  });
  return { terminal: true, batch: await finalizeDossierSourceBackfillBatch(message.batchId) };
}

export async function processDossierSourceBackfillBatch(requestedLimit = DEFAULT_BATCH_LIMIT) {
  await Promise.all([ensureDossierSourceBackfillSchema(), ensureDossierFreshnessSchema()]);
  const leaseRecovery = await recoverStaleDossierSourceBackfills();
  const limit = Math.max(1, Math.min(MAX_BATCH_LIMIT, Math.floor(requestedLimit) || DEFAULT_BATCH_LIMIT));
  const ownerId = crypto.randomUUID();
  if (!await acquireSelectionLease(ownerId)) {
    return { batchId: null, selected: 0, queued: 0, reason: "selection_lease_active", leaseRecovery };
  }

  try {
    const candidateResult = await env.DB.prepare(`SELECT c.ticker,c.name,c.cik,c.memberships_json,
        ROW_NUMBER() OVER (ORDER BY c.market_cap IS NULL,c.market_cap DESC,c.ticker ASC) AS priority_rank,
        COALESCE((SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=c.ticker),0) AS source_count
      FROM companies c
      WHERE c.is_active=1 AND c.listing_scope='listed' AND c.memberships_json LIKE '%Russell 3000%'
        AND (SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=c.ticker)<?
        AND NOT EXISTS (
          SELECT 1 FROM dossier_source_backfill_items prior
          WHERE prior.ticker=c.ticker AND (
            prior.status IN ('queued','running')
            OR (prior.status='error' AND prior.error_message NOT LIKE 'Lease expired%' AND prior.completed_at>=datetime('now','-6 hours'))
            OR (prior.status IN ('no_sec_match','no_supported_filings','partial_evidence') AND prior.completed_at>=datetime('now','-30 days'))
          )
        )
      ORDER BY c.market_cap IS NULL,c.market_cap DESC,c.ticker ASC LIMIT ?`).bind(SOURCE_FOUNDATION_MINIMUM, limit).all<Candidate>();
    if (!candidateResult.results.length) return { batchId: null, selected: 0, queued: 0, leaseRecovery };

    const id = batchId();
    await env.DB.prepare(`INSERT INTO dossier_source_backfill_batches
      (id,universe_name,selection_rule,requested_limit,selected_count,status)
      VALUES (?,'Russell 3000',?,?,?,'queued')`).bind(id, SELECTION_RULE, limit, candidateResult.results.length).run();
    for (const candidate of candidateResult.results) {
      await env.DB.prepare(`INSERT INTO dossier_source_backfill_items
        (batch_id,ticker,priority_rank,memberships_json,status,source_count_before,source_count_after)
        VALUES (?,?,?,?, 'queued',?,?)`).bind(
          id,
          candidate.ticker,
          candidate.priority_rank,
          candidate.memberships_json,
          candidate.source_count,
          candidate.source_count,
        ).run();
    }

    const enqueuedAt = new Date().toISOString();
    const messages = candidateResult.results.map((candidate) => ({
      body: { kind: "source_backfill" as const, batchId: id, ticker: candidate.ticker, enqueuedAt },
    }));
    try {
      await ingestionQueue().sendBatch(messages);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Cloudflare Queue publish failed.";
      await env.DB.batch([
        env.DB.prepare("UPDATE dossier_source_backfill_items SET status='error',error_message=?,completed_at=CURRENT_TIMESTAMP WHERE batch_id=?").bind(detail.slice(0, 500), id),
        env.DB.prepare("UPDATE dossier_source_backfill_batches SET status='failed',error_count=selected_count,completed_at=CURRENT_TIMESTAMP WHERE id=?").bind(id),
      ]);
      throw error;
    }

    return {
      batchId: id,
      status: "queued",
      selected: candidateResult.results.length,
      queued: candidateResult.results.length,
      tickers: candidateResult.results.map((candidate) => candidate.ticker),
      leaseRecovery,
    };
  } finally {
    await releaseSelectionLease(ownerId);
  }
}
