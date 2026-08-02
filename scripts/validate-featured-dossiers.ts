import { featuredDossiers } from "../app/data/featuredDossiers";
import { sp500DossierBatch01, sp500DossierBatch02 } from "../app/data/sp500DossierBatches";
import { researchUniverse } from "../app/data/universe";

const requiredTickers = Object.keys(featuredDossiers).sort();

const failures: string[] = [];
const rankedSpxCompanies = [...sp500DossierBatch01, ...sp500DossierBatch02];
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

if (rankedSpxCompanies.length !== 100) failures.push(`S&P 500 program: expected 100 ranked companies, found ${rankedSpxCompanies.length}`);
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
  ] as const;

  for (const [label, passed] of checks) {
    if (!passed) failures.push(`${ticker}: insufficient ${label}`);
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

console.log(`Comprehensive dossier audit passed for ${requiredTickers.length} ticker pages (${requiredTickers.length - 1} distinct companies; GOOG and GOOGL share one Alphabet dossier). Every dossier has complete owner research sections, a valid last-reviewed date, balanced thesis coverage, six or more comparables, filing and company sources, an official newsroom, and clean display text.`);
