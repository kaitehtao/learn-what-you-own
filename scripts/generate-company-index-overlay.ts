import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { researchUniverse, researchUniverseAsOf, universeSources } from "../app/data/universe";

const outputPath = resolve(process.argv[2] ?? "drizzle/seed-company-index-overlay.sql");

function sql(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sourceFor(company: (typeof researchUniverse)[number]) {
  const membership = company.memberships[0];
  const sourceLabel = membership === "Nasdaq-100 (QQQ)" ? "Nasdaq-100"
    : membership === "Russell 3000" ? "Russell 1000"
      : membership === "Extended Coverage" ? "S&P 500"
        : membership;
  return universeSources.find((source) => source.label === sourceLabel)?.url ?? universeSources[0].url;
}

function values(company: (typeof researchUniverse)[number]) {
  return `(${[
    sql(company.ticker), sql(company.name), sql(company.sector), sql(company.exchange), company.marketCap ?? "NULL",
    sql(JSON.stringify(company.memberships)), sql(JSON.stringify(company.indexWeights)), "NULL", sql("other"),
    sql("Index-tracked compatibility security"), sql(company.name), sql(sourceFor(company)), sql(researchUniverseAsOf), "0",
  ].join(", ")})`;
}

const statements = ["PRAGMA foreign_keys = ON;"];
for (let start = 0; start < researchUniverse.length; start += 100) {
  const batch = researchUniverse.slice(start, start + 100);
  statements.push(`INSERT INTO companies (
  ticker, name, sector, exchange, market_cap, memberships_json, index_weights_json,
  cik, listing_scope, security_type, security_description, universe_source_url, universe_source_as_of, is_active
) VALUES
${batch.map(values).join(",\n")}
ON CONFLICT(ticker) DO UPDATE SET
  name = excluded.name,
  sector = excluded.sector,
  market_cap = excluded.market_cap,
  memberships_json = excluded.memberships_json,
  index_weights_json = excluded.index_weights_json,
  updated_at = CURRENT_TIMESTAMP;`);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${statements.join("\n\n")}\n`);
console.log(`Generated ${outputPath}: ${researchUniverse.length} index-tracked company records.`);
