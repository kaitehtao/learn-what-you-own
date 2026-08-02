import { featuredDossiers } from "../app/data/featuredDossiers";

const originalBenchmarkTickers = [
  "AMC", "NVDA", "AAPL", "AMZN", "TSLA", "PLTR", "RKLB", "SPCX", "BB", "BE",
  "BA", "CAT", "CRWV", "ORCL", "RCL", "AMD", "MSFT", "GOOG", "META",
];

const sp500Batch01Tickers = [
  "AAPL", "NVDA", "GOOG", "GOOGL", "MSFT", "AMZN", "AVGO", "META", "TSLA", "BRK.B",
  "LLY", "MU", "JPM", "WMT", "AMD", "V", "XOM", "JNJ", "MA", "INTC", "ABBV", "CSCO",
  "BAC", "COST", "AMAT", "CVX", "UNH", "KO", "CAT", "LRCX", "GE",
];

const requiredTickers = [...new Set([...originalBenchmarkTickers, ...sp500Batch01Tickers])];

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
