import { featuredDossiers } from "../app/data/featuredDossiers";

const requiredTickers = [
  "AMC", "NVDA", "AAPL", "AMZN", "TSLA", "PLTR", "RKLB", "SPCX", "BB", "BE",
  "BA", "CAT", "CRWV", "ORCL", "RCL", "AMD", "MSFT", "GOOG", "META",
];

const failures: string[] = [];

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
  ] as const;

  for (const [label, passed] of checks) {
    if (!passed) failures.push(`${ticker}: insufficient ${label}`);
  }
}

if (failures.length > 0) {
  throw new Error(`Flagship dossier benchmark failed:\n${failures.join("\n")}`);
}

console.log(`Flagship dossier benchmark passed for ${requiredTickers.length} companies.`);
