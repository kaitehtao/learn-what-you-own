import { env } from "cloudflare:workers";
import { ensureDossierFreshnessSchema } from "../../db/runtimeSchema";
import { scanDossierFreshnessCandidate, type DossierFreshnessCandidate } from "./dossierFreshness";
import { parseSecCurrentFeed, type SecCurrentFeedEntry } from "./secCurrentFeedParser";

const SEC_AGENT = "LearnWhatYouOwn/1.0 research@learnwhatyouown.com";
const FORMS = ["10-Q", "10-K", "8-K", "DEF 14A", "6-K"];

async function fetchFeed(form: string) {
  const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=${encodeURIComponent(form)}&count=100&output=atom`;
  const response = await fetch(url, { headers: { "user-agent": SEC_AGENT, accept: "application/atom+xml, application/xml;q=0.9" } });
  if (!response.ok) throw new Error(`SEC current-filings feed returned ${response.status} for ${form}`);
  return parseSecCurrentFeed(await response.text());
}

function placeholders(count: number) {
  return Array.from({ length: count }, () => "?").join(",");
}

export async function discoverCurrentSecFilings(limit = 25) {
  await ensureDossierFreshnessSchema();
  const feedResults = await Promise.allSettled(FORMS.map(fetchFeed));
  const feedEntries = new Map<string, SecCurrentFeedEntry>();
  for (const result of feedResults) if (result.status === "fulfilled") {
    for (const entry of result.value) feedEntries.set(`${entry.cik}|${entry.accessionNumber}`, entry);
  }
  if (!feedEntries.size) throw new Error("Every SEC current-filings feed failed.");

  const database = env.DB;
  const ciks = [...new Set([...feedEntries.values()].map((entry) => entry.cik))];
  const candidates: DossierFreshnessCandidate[] = [];
  for (let index = 0; index < ciks.length; index += 80) {
    const chunk = ciks.slice(index, index + 80);
    const rows = await database.prepare(`SELECT d.ticker,c.cik,c.name,f.last_success_at
      FROM company_dossiers d JOIN companies c ON c.ticker=d.ticker
      LEFT JOIN dossier_freshness_checks f ON f.ticker=d.ticker
      WHERE d.status='published' AND LTRIM(c.cik,'0') IN (${placeholders(chunk.length)})`).bind(...chunk).all<DossierFreshnessCandidate>();
    candidates.push(...rows.results);
  }

  const accessionNumbers = [...new Set([...feedEntries.values()].map((entry) => entry.accessionNumber))];
  const existing = new Set<string>();
  for (let index = 0; index < accessionNumbers.length; index += 80) {
    const chunk = accessionNumbers.slice(index, index + 80);
    const rows = await database.prepare(`SELECT ticker,accession_number FROM dossier_freshness_events WHERE accession_number IN (${placeholders(chunk.length)})`)
      .bind(...chunk).all<{ ticker: string; accession_number: string }>();
    for (const row of rows.results) existing.add(`${row.ticker}|${row.accession_number}`);
  }

  const newCandidates = candidates.filter((candidate) => {
    const cik = candidate.cik.replace(/^0+/, "") || "0";
    return [...feedEntries.values()].some((entry) => entry.cik === cik && !existing.has(`${candidate.ticker}|${entry.accessionNumber}`));
  }).slice(0, Math.max(1, Math.min(limit, 50)));

  const scans = [];
  for (const candidate of newCandidates) {
    scans.push(await scanDossierFreshnessCandidate(candidate));
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  return {
    feedsSucceeded: feedResults.filter((result) => result.status === "fulfilled").length,
    filingsObserved: feedEntries.size,
    trackedMatches: candidates.length,
    candidatesScanned: scans.length,
    detected: scans.reduce((total, scan) => total + scan.detected, 0),
    errors: scans.filter((scan) => "error" in scan).length,
    scans,
  };
}
