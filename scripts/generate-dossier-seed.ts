import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { featuredDossiers } from "../app/data/featuredDossiers";
import { researchUniverse } from "../app/data/universe";

const outputPath = resolve(process.argv[2] ?? "drizzle/seed-dossiers.sql");

function sql(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

const statements: string[] = [
  "PRAGMA foreign_keys = ON;",
];

for (const company of researchUniverse) {
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
  );

  statements.push(
    `INSERT INTO company_dossiers (ticker, status)
VALUES (${sql(company.ticker)}, 'queued')
ON CONFLICT(ticker) DO NOTHING;`,
  );
}

for (const dossier of Object.values(featuredDossiers)) {
  if (!researchUniverse.some((company) => company.ticker === dossier.ticker)) {
    throw new Error(`Published dossier ${dossier.ticker} is missing from the research universe.`);
  }

  statements.push(
    `UPDATE company_dossiers SET
  status = 'published',
  content_json = ${sql(JSON.stringify(dossier))},
  verified_by = 'Founding editorial research',
  verified_at = COALESCE(verified_at, CURRENT_TIMESTAMP),
  published_at = COALESCE(published_at, CURRENT_TIMESTAMP),
  updated_at = CURRENT_TIMESTAMP
WHERE ticker = ${sql(dossier.ticker)};`,
  );

  for (const source of dossier.sources) {
    const sourceType = source.href.includes("sec.gov") ? "sec" : "company";
    statements.push(
      `INSERT INTO dossier_sources (ticker, source_type, title, url)
VALUES (${sql(dossier.ticker)}, ${sql(sourceType)}, ${sql(source.title)}, ${sql(source.href)})
ON CONFLICT(ticker, url) DO UPDATE SET
  source_type = excluded.source_type,
  title = excluded.title,
  accessed_at = CURRENT_TIMESTAMP;`,
    );
  }
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${statements.join("\n\n")}\n`);

console.log(
  `Generated ${outputPath}: ${researchUniverse.length} unique companies, ${Object.keys(featuredDossiers).length} published dossiers.`,
);
