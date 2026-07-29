import fs from "node:fs/promises";
import path from "node:path";

const SEC_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
const sourceFiles = [
  "app/data/sp500.ts",
  "app/data/russell1000.ts",
  "app/data/russell2000.ts",
  "app/data/nasdaq100.ts",
];

const manualMatches = new Map([
  [
    "AKE",
    {
      cik: "0001744659",
      name: "AKERO THERAPEUTICS, INC.",
      secTicker: "AKRO",
      note: "AKE is a contingent value right. These filings belong to its underlying issuer, Akero Therapeutics, Inc.",
    },
  ],
]);

function normalizeTicker(ticker) {
  return ticker.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function padCik(cik) {
  return String(cik).padStart(10, "0");
}

async function readUniverse() {
  const companies = new Map([["BB", "BLACKBERRY LIMITED"]]);

  for (const sourceFile of sourceFiles) {
    const source = await fs.readFile(path.resolve(sourceFile), "utf8");
    for (const block of source.matchAll(/\{[\s\S]*?\}/g)) {
      const ticker = block[0].match(/"ticker":\s*"([^"]+)"/)?.[1];
      const name = block[0].match(/"name":\s*"([^"]+)"/)?.[1];
      if (ticker && name && !companies.has(ticker)) companies.set(ticker, name);
    }
  }

  return companies;
}

const response = await fetch(SEC_TICKERS_URL, {
  headers: {
    "User-Agent": "LearnWhatYouOwn research@learnwhatyouown.com",
  },
});

if (!response.ok) {
  throw new Error(`SEC ticker download failed with ${response.status}`);
}

const officialRecords = Object.values(await response.json());
const recordsByTicker = new Map(
  officialRecords.map((record) => [normalizeTicker(record.ticker), record]),
);
const universe = await readUniverse();
const matches = [];
const unmatched = [];

for (const [ticker] of universe) {
  const manual = manualMatches.get(ticker);
  const official = recordsByTicker.get(normalizeTicker(ticker));

  if (manual) {
    matches.push([ticker, manual]);
  } else if (official) {
    matches.push([
      ticker,
      {
        cik: padCik(official.cik_str),
        name: official.title,
        secTicker: official.ticker,
      },
    ]);
  } else {
    unmatched.push(ticker);
  }
}

matches.sort(([left], [right]) => left.localeCompare(right));
const generatedOn = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
}).format(new Date());
const body = matches
  .map(([ticker, record]) => `  ${JSON.stringify(ticker)}: ${JSON.stringify(record)},`)
  .join("\n");

const output = `// Generated from the SEC's official ticker-to-CIK file.
// Source: ${SEC_TICKERS_URL}
// Refreshed: ${generatedOn}

export type SecCompany = {
  cik: string;
  name: string;
  secTicker: string;
  note?: string;
};

export const secCompaniesGeneratedAsOf = ${JSON.stringify(generatedOn)};

export const secCompanies: Record<string, SecCompany> = {
${body}
};

export function getSecCompany(ticker: string) {
  return secCompanies[ticker.toUpperCase()];
}
`;

await fs.writeFile(
  path.resolve("app/data/secCompanies.generated.ts"),
  output,
  "utf8",
);

console.log(
  `Wrote ${matches.length} verified ticker-to-CIK matches. Unmatched: ${unmatched.join(", ") || "none"}.`,
);
