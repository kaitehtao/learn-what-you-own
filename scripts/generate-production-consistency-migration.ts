import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { featuredDossiers } from "../app/data/featuredDossiers";
import { researchUniverse } from "../app/data/universe";
import { generateSecFactSql } from "./lib/sec-fact-sql";

const outputPath = resolve(process.argv[2] ?? "drizzle/0013_sync-featured-dossiers-and-pltr-facts.sql");

function sql(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

const companies = new Map(researchUniverse.map((company) => [company.ticker, company]));
const statements = [
  "PRAGMA foreign_keys = ON;",
  "-- Keep every editorially completed dossier in the same published D1 registry used by scheduled SEC refreshes.",
];

for (const dossier of Object.values(featuredDossiers)) {
  const company = companies.get(dossier.ticker);
  if (!company) throw new Error(`${dossier.ticker} is missing from the research universe.`);

  statements.push(
    `INSERT INTO companies (ticker, name, sector, exchange, market_cap, memberships_json, index_weights_json)
VALUES (${sql(company.ticker)}, ${sql(company.name)}, ${sql(company.sector)}, ${sql(company.exchange)}, ${company.marketCap ?? "NULL"}, ${sql(JSON.stringify(company.memberships))}, ${sql(JSON.stringify(company.indexWeights))})
ON CONFLICT(ticker) DO UPDATE SET
  name = excluded.name,
  sector = excluded.sector,
  exchange = excluded.exchange,
  market_cap = excluded.market_cap,
  memberships_json = excluded.memberships_json,
  index_weights_json = excluded.index_weights_json,
  updated_at = CURRENT_TIMESTAMP;`,
    `INSERT INTO company_dossiers (ticker, status, content_json, verified_by, verified_at, published_at, updated_at)
VALUES (${sql(dossier.ticker)}, 'published', ${sql(JSON.stringify(dossier))}, 'Founding editorial research', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(ticker) DO UPDATE SET
  status = 'published',
  content_json = excluded.content_json,
  verified_by = excluded.verified_by,
  verified_at = CURRENT_TIMESTAMP,
  published_at = COALESCE(company_dossiers.published_at, CURRENT_TIMESTAMP),
  updated_at = CURRENT_TIMESTAMP;`,
  );

  for (const source of dossier.sources) {
    statements.push(
      `INSERT INTO dossier_sources (ticker, source_type, title, url)
VALUES (${sql(dossier.ticker)}, ${sql(source.href.includes("sec.gov") ? "sec" : "company")}, ${sql(source.title)}, ${sql(source.href)})
ON CONFLICT(ticker, url) DO UPDATE SET
  source_type = excluded.source_type,
  title = excluded.title,
  accessed_at = CURRENT_TIMESTAMP;`,
    );
  }
}

// PLTR is the first verified production gap. Seed its SEC history immediately;
// the scheduled importer will refresh all published dossiers after deployment.
const palantirFacts = await generateSecFactSql("PLTR");
statements.push(...palantirFacts.statements);

writeFileSync(outputPath, `${statements.join("\n\n")}\n`);
console.log(JSON.stringify({
  outputPath,
  publishedDossiers: Object.keys(featuredDossiers).length,
  palantirFacts: palantirFacts.imported,
  palantirMetrics: palantirFacts.metrics,
  palantirStatus: palantirFacts.status,
}, null, 2));
