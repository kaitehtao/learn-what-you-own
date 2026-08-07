import { env } from "cloudflare:workers";
import { ensureDossierFreshnessSchema } from "../../db/runtimeSchema";
import { importSecFilingFacts } from "./secFactsRepository";
import { fetchSecJson } from "./secRequest";
import { relevantSecFilings, type ClassifiedSecFiling, type FreshnessEventType, type SecSubmissionFeed } from "./dossierFreshnessClassification";

const SEC_AGENT = "LearnWhatYouOwn/1.0 research@learnwhatyouown.com";

function bootstrapFilings(rows: ClassifiedSecFiling[]) {
  const latest = new Map<FreshnessEventType, ClassifiedSecFiling>();
  for (const row of rows) if (!latest.has(row.eventType)) latest.set(row.eventType, row);
  return [...latest.values()];
}

type Candidate = { ticker: string; cik: string; name: string; last_success_at: string | null };

async function scanCandidate(candidate: Candidate) {
  const database = env.DB;
  const paddedCik = candidate.cik.padStart(10, "0");
  const submissionsUrl = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;
  try {
    const submissions = await fetchSecJson<SecSubmissionFeed>(submissionsUrl, SEC_AGENT);
    const allRelevant = relevantSecFilings(candidate.cik, submissions, candidate.last_success_at?.slice(0, 10));
    const selected = candidate.last_success_at ? allRelevant.slice(0, 30) : bootstrapFilings(allRelevant);
    const inserted: ClassifiedSecFiling[] = [];
    for (const filing of selected) {
      const result = await database.prepare(`INSERT OR IGNORE INTO dossier_freshness_events
        (ticker,accession_number,form,filing_date,report_date,primary_document,source_url,event_type,sec_items_json,materiality_reason,review_focus_json,facts_refresh_status,status,editorial_summary,reviewed_by,reviewed_at,published_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'published','','system:sec-freshness',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(
          candidate.ticker, filing.accessionNumber, filing.form, filing.filingDate, filing.reportDate,
          filing.primaryDocument, filing.sourceUrl, filing.eventType, JSON.stringify(filing.items),
          filing.materialityReason, JSON.stringify(filing.reviewFocus), filing.refreshFacts ? "pending" : "not_applicable",
        ).run();
      if ((result.meta.changes ?? 0) > 0) inserted.push(filing);
      // The permanent dossier source ledger must point to the exact filing,
      // not merely the SEC company search page. This also lets the rollout
      // measure evidence depth without inventing editorial conclusions.
      await database.prepare(`INSERT INTO dossier_sources
        (ticker,source_type,title,url,evidence_date,excerpt,verified_at,created_at)
        VALUES (?,'sec_filing',?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT(ticker,url) DO UPDATE SET source_type=excluded.source_type,title=excluded.title,
          evidence_date=excluded.evidence_date,excerpt=excluded.excerpt,verified_at=CURRENT_TIMESTAMP`).bind(
          candidate.ticker,
          `${filing.form} filed ${filing.filingDate}`,
          filing.sourceUrl,
          filing.filingDate,
          `Official SEC ${filing.form} filing detected automatically by the dossier freshness monitor.`,
        ).run();
    }

    if (inserted.length) {
      await database.prepare("UPDATE company_dossiers SET updated_at=CURRENT_TIMESTAMP WHERE ticker=?")
        .bind(candidate.ticker).run();
    }

    const factEvents = inserted.filter((filing) => filing.refreshFacts);
    if (factEvents.length) {
      try {
        const refresh = await importSecFilingFacts(candidate.ticker);
        for (const filing of factEvents) await database.prepare(`UPDATE dossier_freshness_events SET facts_refresh_status='refreshed',facts_refresh_detail=?,updated_at=CURRENT_TIMESTAMP WHERE ticker=? AND accession_number=?`)
          .bind(`${refresh.imported} facts across ${refresh.metrics} metrics; ${refresh.status}.`, candidate.ticker, filing.accessionNumber).run();
      } catch (error) {
        const message = (error instanceof Error ? error.message : "SEC facts refresh failed.").slice(0, 500);
        for (const filing of factEvents) await database.prepare(`UPDATE dossier_freshness_events SET facts_refresh_status='failed',facts_refresh_detail=?,updated_at=CURRENT_TIMESTAMP WHERE ticker=? AND accession_number=?`)
          .bind(message, candidate.ticker, filing.accessionNumber).run();
      }
    }

    const latestFilingDate = allRelevant[0]?.filingDate ?? null;
    await database.prepare(`INSERT INTO dossier_freshness_checks (ticker,last_attempted_at,last_success_at,latest_filing_date,detected_count,error_message)
      VALUES (?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?,?,NULL)
      ON CONFLICT(ticker) DO UPDATE SET last_attempted_at=CURRENT_TIMESTAMP,last_success_at=CURRENT_TIMESTAMP,latest_filing_date=excluded.latest_filing_date,detected_count=dossier_freshness_checks.detected_count+excluded.detected_count,error_message=NULL`)
      .bind(candidate.ticker, latestFilingDate, inserted.length).run();
    return { ticker: candidate.ticker, detected: inserted.length, latestFilingDate, events: inserted.map((event) => ({ accessionNumber: event.accessionNumber, eventType: event.eventType, form: event.form })) };
  } catch (error) {
    const message = (error instanceof Error ? error.message : "Dossier freshness scan failed.").slice(0, 500);
    await database.prepare(`INSERT INTO dossier_freshness_checks (ticker,last_attempted_at,detected_count,error_message) VALUES (?,CURRENT_TIMESTAMP,0,?)
      ON CONFLICT(ticker) DO UPDATE SET last_attempted_at=CURRENT_TIMESTAMP,error_message=excluded.error_message`).bind(candidate.ticker, message).run();
    return { ticker: candidate.ticker, detected: 0, latestFilingDate: null, events: [], error: message };
  }
}

export async function processDossierFreshnessBatch(limit = 25) {
  await ensureDossierFreshnessSchema();
  const database = env.DB;
  const result = await database.prepare(`SELECT d.ticker,c.cik,c.name,f.last_success_at
    FROM company_dossiers d JOIN companies c ON c.ticker=d.ticker
    LEFT JOIN dossier_freshness_checks f ON f.ticker=d.ticker
    WHERE d.status='published' AND c.cik IS NOT NULL AND c.cik<>''
    ORDER BY CASE WHEN f.error_message IS NOT NULL THEN 0 ELSE 1 END,
      COALESCE(f.last_attempted_at,'') ASC,d.ticker ASC LIMIT ?`).bind(Math.max(1, Math.min(limit, 50))).all<Candidate>();
  const scans = [];
  for (const candidate of result.results) {
    scans.push(await scanCandidate(candidate));
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  return { processed: scans.length, detected: scans.reduce((total, scan) => total + scan.detected, 0), errors: scans.filter((scan) => "error" in scan).length, scans };
}
