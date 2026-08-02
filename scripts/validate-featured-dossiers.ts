import { featuredDossiers } from "../app/data/featuredDossiers";
import { sp500DossierBatch01, sp500DossierBatch02 } from "../app/data/sp500DossierBatches";

const requiredTickers = Object.keys(featuredDossiers).sort();

const failures: string[] = [];
const rankedSpxCompanies = [...sp500DossierBatch01, ...sp500DossierBatch02];

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
}

if (failures.length > 0) {
  throw new Error(`Flagship dossier benchmark failed:\n${failures.join("\n")}`);
}

console.log(`Flagship dossier benchmark passed for ${requiredTickers.length} ticker pages (${requiredTickers.length - 1} distinct companies; GOOG and GOOGL share one Alphabet dossier).`);
