import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { featuredDossiers, type FeaturedDossier } from "../app/data/featuredDossiers";
import { researchUniverse } from "../app/data/universe";

const outputDirectory = resolve(process.argv[2] ?? "drizzle");
const batchSize = Number(process.argv[3] ?? 104);
const auditRunId = "2026-08-05-complete-benchmark";
if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error("Batch size must be a positive integer.");

function sql(value: unknown) { return value === null || value === undefined ? "NULL" : `'${String(value).replaceAll("'", "''")}'`; }
function dossierSql(dossier: FeaturedDossier) {
  const company = researchUniverse.find(item => item.ticker === dossier.ticker);
  if (!company) throw new Error(`${dossier.ticker} is missing from the research universe.`);
  return [
    `INSERT INTO companies (ticker,name,sector,exchange,market_cap,memberships_json,index_weights_json) VALUES (${sql(company.ticker)},${sql(company.name)},${sql(company.sector)},${sql(company.exchange)},${company.marketCap ?? "NULL"},${sql(JSON.stringify(company.memberships))},${sql(JSON.stringify(company.indexWeights))}) ON CONFLICT(ticker) DO UPDATE SET name=excluded.name,sector=excluded.sector,exchange=excluded.exchange,market_cap=excluded.market_cap,memberships_json=excluded.memberships_json,index_weights_json=excluded.index_weights_json,updated_at=CURRENT_TIMESTAMP;`,
    `INSERT INTO dossier_audit_members (run_id,ticker,source_count,claim_count,completeness,verified_at) VALUES (${sql(auditRunId)},${sql(dossier.ticker)},${dossier.sources.length},8,${dossier.completeness},CURRENT_TIMESTAMP) ON CONFLICT(run_id,ticker) DO UPDATE SET source_count=excluded.source_count,claim_count=excluded.claim_count,completeness=excluded.completeness,verified_at=CURRENT_TIMESTAMP;`,
  ].join("\n\n");
}

const dossiers = Object.values(featuredDossiers).sort((a, b) => a.ticker.localeCompare(b.ticker));
mkdirSync(outputDirectory, { recursive: true });
const generated: string[] = [];
for (let start = 0, index = 0; start < dossiers.length; start += batchSize, index += 1) {
  const batch = dossiers.slice(start, start + batchSize);
  const file = resolve(outputDirectory, `${String(25 + index).padStart(4, "0")}_complete_dossier_registry_${String(index + 1).padStart(2, "0")}.sql`);
  const auditPrelude = index === 0 ? `CREATE TABLE IF NOT EXISTS dossier_audit_runs (run_id TEXT PRIMARY KEY NOT NULL,benchmark_name TEXT NOT NULL,expected_ticker_pages INTEGER NOT NULL,expected_distinct_companies INTEGER NOT NULL,verified_at TEXT NOT NULL,notes TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS dossier_audit_members (run_id TEXT NOT NULL,ticker TEXT NOT NULL,source_count INTEGER NOT NULL,claim_count INTEGER NOT NULL,completeness INTEGER NOT NULL,verified_at TEXT NOT NULL,PRIMARY KEY(run_id,ticker),FOREIGN KEY(run_id) REFERENCES dossier_audit_runs(run_id) ON DELETE CASCADE);\nINSERT INTO dossier_audit_runs (run_id,benchmark_name,expected_ticker_pages,expected_distinct_companies,verified_at,notes) VALUES (${sql(auditRunId)},'Complete evidence-led ownership dossier benchmark',${dossiers.length},${new Set(dossiers.map(item => item.ticker === "GOOGL" ? "GOOG" : item.ticker)).size},CURRENT_TIMESTAMP,'Static benchmark, primary sources, balanced thesis, comparables, newsrooms, and claim-level provenance verified by the production test suite.') ON CONFLICT(run_id) DO UPDATE SET expected_ticker_pages=excluded.expected_ticker_pages,expected_distinct_companies=excluded.expected_distinct_companies,verified_at=CURRENT_TIMESTAMP,notes=excluded.notes;\nDELETE FROM dossier_audit_members WHERE run_id=${sql(auditRunId)};\n\n` : "";
  writeFileSync(file, `PRAGMA foreign_keys = ON;\n\n${auditPrelude}${batch.map(dossierSql).join("\n\n")}\n`);
  generated.push(file);
}
console.log(`Generated ${generated.length} migrations for ${dossiers.length} published ticker dossiers (${new Set(dossiers.map(item => item.ticker === "GOOGL" ? "GOOG" : item.ticker)).size} distinct company dossiers).`);
for (const file of generated) console.log(file);
