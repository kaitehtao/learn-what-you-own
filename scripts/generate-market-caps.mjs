import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const sourcePath = process.argv[2];

if (!sourcePath) {
  throw new Error("Pass the downloaded Nasdaq stock screener JSON path.");
}

const universeFiles = [
  "app/data/sp500.ts",
  "app/data/russell1000.ts",
  "app/data/russell2000.ts",
  "app/data/nasdaq100.ts",
];

const tickers = new Set(["BB"]);
for (const relativePath of universeFiles) {
  const source = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
  for (const match of source.matchAll(/"ticker":\s*"([^"]+)"/g)) {
    tickers.add(match[1]);
  }
}

const payload = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const rows = payload?.data?.rows ?? [];
const byTicker = new Map(rows.map((row) => [row.symbol, Number(row.marketCap) || 0]));
const aliases = {
  BRKB: "BRK/B",
  HEIA: "HEI",
  UHALB: "UHAL",
  LENB: "LEN",
  GEFB: "GEF",
  BHA: "BH",
};

function marketCapFor(ticker) {
  const candidates = [
    ticker,
    aliases[ticker],
    ticker.replace(".", "/"),
    ticker.replace(".", "-"),
    ticker.replace("-", "/"),
    ticker.replace("-", "."),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const value = byTicker.get(candidate);
    if (value > 0) return value;
  }
  return null;
}

const values = [...tickers]
  .sort()
  .map((ticker) => [ticker, marketCapFor(ticker)])
  .filter((entry) => entry[1] !== null);

const generated = `// Generated from the Nasdaq Stock Screener on July 30, 2026.
// Re-run scripts/generate-market-caps.mjs with a fresh screener response to update.

export const marketCapsAsOf = "July 30, 2026";
export const marketCapSourceUrl = "https://www.nasdaq.com/market-activity/stocks/screener";

export const marketCaps: Record<string, number> = ${JSON.stringify(Object.fromEntries(values), null, 2)};
`;

fs.writeFileSync(path.join(projectRoot, "app/data/marketCaps.generated.ts"), generated);
console.log(`Generated ${values.length.toLocaleString()} market-cap records.`);
