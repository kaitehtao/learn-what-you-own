import { featuredDossiers } from "../app/data/featuredDossiers";
import { sp500DossierBatch01, sp500DossierBatch02, sp500DossierBatch03 } from "../app/data/sp500DossierBatches";
import { legacyCompletedTickers } from "../app/data/legacyCompleteDossiers";
import { researchUniverse } from "../app/data/universe";

const requiredTickers = Object.keys(featuredDossiers).sort();

const failures: string[] = [];
const rankedSpxCompanies = [...sp500DossierBatch01, ...sp500DossierBatch02, ...sp500DossierBatch03];
const universeTickers = new Set(researchUniverse.map((company) => company.ticker));
const markupLeakPattern = /q4default|<\/?(?:style|script|html|body)\b|\bfont-(?:size|family)\s*:|\blist-style-type\s*:|\{\s*(?:color|margin|padding)\s*:/i;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function dossierText(dossier: object) {
  return JSON.stringify(dossier);
}

if (rankedSpxCompanies.length !== 200) failures.push(`S&P 500 program: expected 200 ranked companies, found ${rankedSpxCompanies.length}`);
for (const ticker of legacyCompletedTickers) {
  if (!featuredDossiers[ticker]) failures.push(`${ticker}: legacy/starter record was not upgraded to the complete dossier registry`);
}
for (let index = 0; index < rankedSpxCompanies.length; index += 1) {
  const company = rankedSpxCompanies[index];
  if (company.rank !== index + 1) failures.push(`${company.ticker}: expected rank ${index + 1}, found ${company.rank}`);
  if (index > 0 && company.marketCap > rankedSpxCompanies[index - 1].marketCap) {
    failures.push(`${company.ticker}: market cap exceeds prior-ranked ${rankedSpxCompanies[index - 1].ticker}`);
  }
}

for (const ticker of requiredTickers) {
  const dossier = featuredDossiers[ticker];
  if (!dossier) {
    failures.push(`${ticker}: missing dossier`);
    continue;
  }

  if (!universeTickers.has(ticker)) failures.push(`${ticker}: missing from research universe`);

  const reviewedAt = dossier.reviewed ? new Date(dossier.reviewed) : null;
  if (!reviewedAt || Number.isNaN(reviewedAt.valueOf())) failures.push(`${ticker}: missing or invalid last-reviewed date`);

  const proseChecks = [
    ["description", dossier.description, 60],
    ["owner summary", dossier.lede, 80],
    ["products and services", dossier.sells, 60],
    ["revenue model", dossier.revenueModel, 70],
    ["opportunity", dossier.opportunity, 80],
    ["owner requirements", dossier.mustGoRight, 80],
    ["editor note", dossier.editorNote, 100],
    ["thesis breaker", dossier.thesisBreaker, 100],
    ["competitors", dossier.competitors, 60],
  ] as const;
  for (const [label, value, minimum] of proseChecks) {
    if (value.trim().length < minimum) failures.push(`${ticker}: incomplete ${label}`);
  }

  if (markupLeakPattern.test(dossierText(dossier))) failures.push(`${ticker}: leaked HTML or stylesheet text`);

  const checks = [
    ["completeness", dossier.completeness === 100],
    ["financial drivers", dossier.financialDrivers.length >= 6],
    ["risks", dossier.risks.length >= 5],
    ["monitor points", dossier.monitor.length >= 4],
    ["owner questions", dossier.questions.length >= 6],
    ["comparables", (dossier.comparables?.length ?? 0) >= 6],
    ["primary sources", dossier.sources.length >= 5],
    ["official newsroom", Boolean(dossier.newsroomUrl || dossier.newsroomFeedUrl)],
    ["SEC source", dossier.sources.some((source) => source.href.includes("sec.gov"))],
    ["company source", dossier.sources.some((source) => !source.href.includes("sec.gov"))],
    ["filing and call evidence ledger", Boolean(dossier.evidenceReview)],
  ] as const;

  for (const [label, passed] of checks) {
    if (!passed) failures.push(`${ticker}: insufficient ${label}`);
  }

  if (dossier.evidenceReview) {
    const evidenceLinks = [
      ["10-K", dossier.evidenceReview.annualFilingsUrl, "10-K"],
      ["10-Q", dossier.evidenceReview.quarterlyFilingsUrl, "10-Q"],
      ["8-K earnings", dossier.evidenceReview.earningsUpdatesUrl, "8-K"],
      ["proxy", dossier.evidenceReview.proxyFilingsUrl, "DEF"],
      ["official call materials", dossier.evidenceReview.officialMaterialsUrl, ""],
    ] as const;
    for (const [label, url, requiredToken] of evidenceLinks) {
      if (!isHttpUrl(url)) failures.push(`${ticker}: invalid ${label} evidence URL ${url}`);
      if (requiredToken && !decodeURIComponent(url).toUpperCase().includes(requiredToken)) failures.push(`${ticker}: ${label} evidence URL does not target the required form`);
    }
    if (dossier.evidenceReview.transcriptPolicy.length < 100) failures.push(`${ticker}: incomplete transcript provenance policy`);
  }

  const sourceUrls = new Set<string>();
  for (const source of dossier.sources) {
    if (!source.title.trim() || !source.meta.trim() || source.excerpt.trim().length < 40) failures.push(`${ticker}: incomplete source annotation for ${source.href}`);
    if (!isHttpUrl(source.href)) failures.push(`${ticker}: invalid source URL ${source.href}`);
    if (sourceUrls.has(source.href)) failures.push(`${ticker}: duplicate source URL ${source.href}`);
    sourceUrls.add(source.href);
  }

  for (const comparable of dossier.comparables ?? []) {
    if (!comparable.name.trim() || !comparable.ticker.trim() || comparable.relationship.trim().length < 20 || comparable.valuation.trim().length < 20 || comparable.financialStatus.trim().length < 20) {
      failures.push(`${ticker}: incomplete comparable ${comparable.ticker || comparable.name}`);
    }
    if (!isHttpUrl(comparable.sourceUrl)) failures.push(`${ticker}: invalid comparable source ${comparable.sourceUrl}`);
  }

  const arraySections = [
    ["bull case", dossier.bull],
    ["bear case", dossier.bear],
    ["questions", dossier.questions],
  ] as const;
  for (const [label, entries] of arraySections) {
    if (entries.some((entry) => entry.trim().length < 25)) failures.push(`${ticker}: underdeveloped ${label} entry`);
  }
}

if (failures.length > 0) {
  throw new Error(`Flagship dossier benchmark failed:\n${failures.join("\n")}`);
}

console.log(`Comprehensive dossier audit passed for ${requiredTickers.length} ticker pages (${requiredTickers.length - 1} distinct companies; GOOG and GOOGL share one Alphabet dossier). The first 200 S&P 500 companies are ranked by descending market capitalization, all 10 legacy records are upgraded, and every dossier has complete owner research sections, a filing/call evidence ledger, balanced thesis coverage, six or more comparables, filing and company sources, an official newsroom, and clean display text.`);
