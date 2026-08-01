import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SEC_URL = "https://www.sec.gov/files/company_tickers_exchange.json";
const NASDAQ_LISTED_URL = "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt";
const OTHER_LISTED_URL = "https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt";
const FINRA_API_URL = "https://api.finra.org/data/group/otcMarket/name/otcSecurityMaster";
const FINRA_PARTITIONS_URL = "https://api.finra.org/partitions/group/otcMarket/name/otcSecurityMaster";
const FINRA_DIRECTORY_URL = "https://otce.finra.org/otce/symbol-directory";
const META_OUTPUT_PATH = resolve("app/data/exchangeUniverseMeta.generated.ts");
const SQL_OUTPUT_PATH = resolve("drizzle/seed-exchange-universe.sql");
const USER_AGENT = process.env.SEC_USER_AGENT || "LearnWhatYouOwn research universe admin@learnwhatyouown.com";
const PAGE_SIZE = 5_000;

async function fetchOk(url, init = {}) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${url} returned ${response.status} ${response.statusText}`);
  return response;
}

function compact(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeTicker(value) {
  return compact(value).toUpperCase();
}

function canonicalTicker(value) {
  const ticker = normalizeTicker(value);
  if (ticker === "BRK-B") return "BRK.B";
  if (ticker === "BF-B") return "BF.B";
  return ticker;
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function parsePipeFile(text, symbolColumn) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split("|");
  const symbolIndex = headers.indexOf(symbolColumn);
  const testIndex = headers.indexOf("Test Issue");
  if (symbolIndex < 0 || testIndex < 0) throw new Error(`Unexpected Nasdaq Trader schema for ${symbolColumn}.`);
  return new Set(lines.slice(1, -1).map((line) => line.split("|"))
    .filter((row) => row[testIndex] === "N")
    .map((row) => normalizeTicker(row[symbolIndex]))
    .filter(Boolean));
}

async function fetchListedCompanies() {
  const [sec, nasdaq, other] = await Promise.all([
    fetchOk(SEC_URL, { headers: { "user-agent": USER_AGENT, accept: "application/json" } }).then((response) => response.json()),
    fetchOk(NASDAQ_LISTED_URL).then((response) => response.text()),
    fetchOk(OTHER_LISTED_URL).then((response) => response.text()),
  ]);

  const fields = Object.fromEntries(sec.fields.map((field, index) => [field, index]));
  const nasdaqSymbols = parsePipeFile(nasdaq, "Symbol");
  const otherSymbols = parsePipeFile(other, "NASDAQ Symbol");
  const companies = [];
  const seen = new Set();
  let crossChecked = 0;

  for (const row of sec.data) {
    const secExchange = row[fields.exchange];
    if (secExchange !== "Nasdaq" && secExchange !== "NYSE") continue;
    const sourceTicker = normalizeTicker(row[fields.ticker]);
    const ticker = canonicalTicker(sourceTicker);
    if (!ticker || seen.has(ticker)) throw new Error(`Duplicate or empty listed ticker in SEC data: ${ticker || "(empty)"}`);
    seen.add(ticker);
    const exchange = secExchange === "Nasdaq" ? "NASDAQ" : "NYSE";
    const comparisonSet = exchange === "NASDAQ" ? nasdaqSymbols : otherSymbols;
    if (comparisonSet.has(sourceTicker)) crossChecked += 1;
    companies.push({
      ticker,
      name: compact(row[fields.name]),
      exchange,
      cik: String(row[fields.cik]).padStart(10, "0"),
      securityType: "Listed issuer security",
    });
  }

  if (crossChecked < companies.length * 0.9) {
    throw new Error(`Nasdaq Trader validation matched only ${crossChecked} of ${companies.length} SEC listed associations.`);
  }
  return { companies, crossChecked };
}

async function fetchOtcSecurities(listedTickers) {
  const partitions = await fetchOk(FINRA_PARTITIONS_URL).then((response) => response.json());
  const asOfDate = partitions.availablePartitions?.[0]?.partitions?.[0];
  if (!asOfDate) throw new Error("FINRA did not return a current OTC security-master partition.");

  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const response = await fetchOk(FINRA_API_URL, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        limit: PAGE_SIZE,
        offset,
        fields: ["asOfDate", "issueSymbolIdentifier", "securityDescription", "issueType", "issuerName"],
        compareFilters: [{ compareType: "EQUAL", fieldName: "asOfDate", fieldValue: asOfDate }],
        sortFields: ["+issueSymbolIdentifier"],
      }),
    }).then((item) => item.json());
    rows.push(...response);
    if (response.length < PAGE_SIZE) break;
  }

  const seen = new Set();
  const securities = [];
  for (const row of rows) {
    const ticker = canonicalTicker(row.issueSymbolIdentifier);
    if (!ticker || listedTickers.has(ticker) || seen.has(ticker)) continue;
    seen.add(ticker);
    securities.push({
      ticker,
      name: compact(row.issuerName) || compact(row.securityDescription),
      exchange: "OTC",
      cik: null,
      securityType: compact(row.issueType) || "Other OTC equity",
      securityDescription: compact(row.securityDescription),
    });
  }
  return { securities, asOfDate };
}

function titleDate(isoDate) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${isoDate}T00:00:00Z`));
}

const listed = await fetchListedCompanies();
const listedTickers = new Set(listed.companies.map((company) => company.ticker));
const otc = await fetchOtcSecurities(listedTickers);
const generatedDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const listedCompanies = listed.companies.sort((a, b) => a.ticker.localeCompare(b.ticker));
const otcSecurities = otc.securities.sort((a, b) => a.ticker.localeCompare(b.ticker));

const sourceRecords = [
    { label: "SEC ticker/exchange associations", url: SEC_URL },
    { label: "Nasdaq Trader symbol directory", url: "https://www.nasdaqtrader.com/trader.aspx?id=symboldirdefs" },
    { label: "FINRA OTC Symbol Directory", url: FINRA_DIRECTORY_URL },
];
const exchangeCounts = Object.fromEntries(["NYSE", "NASDAQ"].map((exchange) => [exchange, listedCompanies.filter((item) => item.exchange === exchange).length]));
const issueTypeCounts = Object.entries(otcSecurities.reduce((counts, item) => {
  counts[item.securityType] = (counts[item.securityType] ?? 0) + 1;
  return counts;
}, {})).sort((a, b) => b[1] - a[1]);
const metaOutput = `// Generated by scripts/update-exchange-universe.mjs. Do not edit manually.\n\n` +
  `export const listedUniverseAsOf = ${JSON.stringify(titleDate(generatedDate))};\n` +
  `export const otcUniverseAsOf = ${JSON.stringify(titleDate(otc.asOfDate))};\n` +
  `export const listedSecurityCount = ${listedCompanies.length};\n` +
  `export const otcSecurityCount = ${otcSecurities.length};\n` +
  `export const officialExchangeCounts = ${JSON.stringify(exchangeCounts, null, 2)} as const;\n` +
  `export const otcIssueTypeCounts = ${JSON.stringify(issueTypeCounts, null, 2)} as const;\n` +
  `export const officialUniverseSources = ${JSON.stringify(sourceRecords, null, 2)} as const;\n`;

function companyValues(item, scope, sourceUrl, asOfDate) {
  return `(${[
    sql(item.ticker), sql(item.name), sql("Not classified"), sql(item.exchange), "NULL", sql("[]"), sql("{}"),
    sql(item.cik), sql(scope), sql(item.securityType), sql(item.securityDescription ?? item.name),
    sql(sourceUrl), sql(asOfDate), "1",
  ].join(", ")})`;
}

const sqlStatements = ["PRAGMA foreign_keys = ON;"];
const records = [
  ...listedCompanies.map((item) => ({ item, scope: "listed", sourceUrl: SEC_URL, asOfDate: generatedDate })),
  ...otcSecurities.map((item) => ({ item, scope: "otc", sourceUrl: FINRA_DIRECTORY_URL, asOfDate: otc.asOfDate })),
];
for (let start = 0; start < records.length; start += 100) {
  const batch = records.slice(start, start + 100);
  sqlStatements.push(`INSERT INTO companies (
  ticker, name, sector, exchange, market_cap, memberships_json, index_weights_json,
  cik, listing_scope, security_type, security_description, universe_source_url, universe_source_as_of, is_active
) VALUES
${batch.map(({ item, scope, sourceUrl, asOfDate }) => companyValues(item, scope, sourceUrl, asOfDate)).join(",\n")}
ON CONFLICT(ticker) DO UPDATE SET
  name = excluded.name,
  exchange = excluded.exchange,
  cik = excluded.cik,
  listing_scope = excluded.listing_scope,
  security_type = excluded.security_type,
  security_description = excluded.security_description,
  universe_source_url = excluded.universe_source_url,
  universe_source_as_of = excluded.universe_source_as_of,
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP;`);
}

await Promise.all([
  writeFile(META_OUTPUT_PATH, metaOutput),
  writeFile(SQL_OUTPUT_PATH, `${sqlStatements.join("\n\n")}\n`),
]);
console.log(`Generated ${META_OUTPUT_PATH}`);
console.log(`Generated ${SQL_OUTPUT_PATH}`);
console.log(`NYSE/Nasdaq: ${listedCompanies.length} (${listed.crossChecked} cross-checked in Nasdaq Trader)`);
console.log(`OTC: ${otcSecurities.length} as of ${otc.asOfDate}`);
