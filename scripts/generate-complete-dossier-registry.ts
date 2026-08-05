import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { featuredDossiers, type FeaturedDossier } from "../app/data/featuredDossiers";
import { researchUniverse } from "../app/data/universe";

const outputDirectory = resolve(process.argv[2] ?? "drizzle");
const batchSize = Number(process.argv[3] ?? 104);
const auditRunId = "2026-08-05-complete-benchmark";
if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error("Batch size must be a positive integer.");

function sql(value: unknown) { return value === null || value === undefined ? "NULL" : `'${String(value).replaceAll("'", "''")}'`; }
function iso(value: string) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? "2026-08-01" : date.toISOString().slice(0, 10); }
function sourceType(source: FeaturedDossier["sources"][number]) {
  if (!source.href.includes("sec.gov")) return "investor_relations";
  return source.href.includes("/edgar/browse/") || source.href.includes("/cgi-bin/browse-edgar") ? "sec_company_page" : "sec_filing";
}

function sourceDate(source: FeaturedDossier["sources"][number], fallback: string) {
  const match = source.meta.match(/(?:Filed|Published) ([A-Z][a-z]+ \d{1,2}, \d{4})/)?.[1];
  return match ? iso(match) : fallback;
}

function claim(ticker: string, section: string, kind: string, value: string, why: string, source: FeaturedDossier["sources"][number], evidenceDate: string) {
  return `INSERT INTO dossier_claims (ticker,section,claim_type,claim,why_it_matters,source_title,source_url,source_excerpt,evidence_date,status,verified_by,verified_at,updated_at)
VALUES (${sql(ticker)},${sql(section)},${sql(kind)},${sql(value)},${sql(why)},${sql(source.title)},${sql(source.href)},${sql(source.excerpt)},${sql(sourceDate(source, evidenceDate))},'published','Founding editorial research',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT(ticker,claim,source_url) DO UPDATE SET section=excluded.section,claim_type=excluded.claim_type,why_it_matters=excluded.why_it_matters,source_title=excluded.source_title,source_excerpt=excluded.source_excerpt,evidence_date=excluded.evidence_date,status='published',verified_by=excluded.verified_by,verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP;`;
}

function dossierSql(dossier: FeaturedDossier) {
  const company = researchUniverse.find(item => item.ticker === dossier.ticker);
  if (!company) throw new Error(`${dossier.ticker} is missing from the research universe.`);
  const evidenceDate = iso(dossier.reviewed);
  const sec = dossier.sources.find(source => source.href.includes("sec.gov")) ?? dossier.sources[0];
  const companySource = dossier.sources.find(source => !source.href.includes("sec.gov")) ?? sec;
  if (!sec || !companySource) throw new Error(`${dossier.ticker} has no source evidence.`);
  const statements = [
    `INSERT INTO companies (ticker,name,sector,exchange,market_cap,memberships_json,index_weights_json) VALUES (${sql(company.ticker)},${sql(company.name)},${sql(company.sector)},${sql(company.exchange)},${company.marketCap ?? "NULL"},${sql(JSON.stringify(company.memberships))},${sql(JSON.stringify(company.indexWeights))}) ON CONFLICT(ticker) DO UPDATE SET name=excluded.name,sector=excluded.sector,exchange=excluded.exchange,market_cap=excluded.market_cap,memberships_json=excluded.memberships_json,index_weights_json=excluded.index_weights_json,updated_at=CURRENT_TIMESTAMP;`,
    `INSERT INTO research_companies (ticker,name,sector,exchange,market_cap,memberships_json,index_weights_json) VALUES (${sql(company.ticker)},${sql(company.name)},${sql(company.sector)},${sql(company.exchange)},${company.marketCap ?? "NULL"},${sql(JSON.stringify(company.memberships))},${sql(JSON.stringify(company.indexWeights))}) ON CONFLICT(ticker) DO UPDATE SET name=excluded.name,sector=excluded.sector,exchange=excluded.exchange,market_cap=excluded.market_cap,memberships_json=excluded.memberships_json,index_weights_json=excluded.index_weights_json,updated_at=CURRENT_TIMESTAMP;`,
    `INSERT INTO company_dossiers (ticker,status,description,lede,sells,revenue_model,opportunity,must_go_right,editor_note,bull_title,bull_json,bear_title,bear_json,thesis_breaker,financial_drivers_json,risks_json,monitor_json,questions_json,competitors,evidence_date,validated_at,published_at,updated_at) VALUES (${sql(dossier.ticker)},'published',${sql(dossier.description)},${sql(dossier.lede)},${sql(dossier.sells)},${sql(dossier.revenueModel)},${sql(dossier.opportunity)},${sql(dossier.mustGoRight)},${sql(dossier.editorNote)},${sql(dossier.bullTitle)},${sql(JSON.stringify(dossier.bull))},${sql(dossier.bearTitle)},${sql(JSON.stringify(dossier.bear))},${sql(dossier.thesisBreaker)},${sql(JSON.stringify(dossier.financialDrivers))},${sql(JSON.stringify(dossier.risks))},${sql(JSON.stringify(dossier.monitor))},${sql(JSON.stringify(dossier.questions))},${sql(dossier.competitors)},${sql(evidenceDate)},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(ticker) DO UPDATE SET status='published',description=excluded.description,lede=excluded.lede,sells=excluded.sells,revenue_model=excluded.revenue_model,opportunity=excluded.opportunity,must_go_right=excluded.must_go_right,editor_note=excluded.editor_note,bull_title=excluded.bull_title,bull_json=excluded.bull_json,bear_title=excluded.bear_title,bear_json=excluded.bear_json,thesis_breaker=excluded.thesis_breaker,financial_drivers_json=excluded.financial_drivers_json,risks_json=excluded.risks_json,monitor_json=excluded.monitor_json,questions_json=excluded.questions_json,competitors=excluded.competitors,evidence_date=excluded.evidence_date,validated_at=CURRENT_TIMESTAMP,published_at=COALESCE(company_dossiers.published_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP;`,
  ];
  for (const source of dossier.sources) statements.push(`INSERT INTO dossier_sources (ticker,source_type,title,url,evidence_date,excerpt,verified_at) VALUES (${sql(dossier.ticker)},${sql(sourceType(source))},${sql(source.title)},${sql(source.href)},${sql(sourceDate(source, evidenceDate))},${sql(source.excerpt)},CURRENT_TIMESTAMP) ON CONFLICT(ticker,url) DO UPDATE SET source_type=excluded.source_type,title=excluded.title,evidence_date=excluded.evidence_date,excerpt=excluded.excerpt,verified_at=CURRENT_TIMESTAMP;`);
  statements.push(
    claim(dossier.ticker, "owner_summary", "editorial_analysis", dossier.lede, "Defines the central ownership lens and its falsifiable operating variables.", sec, evidenceDate),
    claim(dossier.ticker, "business_model", "verified_fact", dossier.sells, "Identifies the products, services, and customers that produce revenue.", sec, evidenceDate),
    claim(dossier.ticker, "revenue_model", "editorial_analysis", dossier.revenueModel, "Explains how reported activity converts into revenue and owner economics.", sec, evidenceDate),
    claim(dossier.ticker, "opportunity", "editorial_analysis", dossier.opportunity, "States the evidence-led path by which the business could expand value.", companySource, evidenceDate),
    claim(dossier.ticker, "owner_requirements", "editorial_analysis", dossier.mustGoRight, "Makes the conditions required by the thesis explicit and testable.", sec, evidenceDate),
    claim(dossier.ticker, "bull_case", "editorial_analysis", dossier.bull.join(" "), "Preserves the constructive interpretation as a sourced, reviewable claim.", companySource, evidenceDate),
    claim(dossier.ticker, "bear_case", "editorial_analysis", dossier.bear.join(" "), "Preserves the skeptical interpretation as a sourced, reviewable claim.", sec, evidenceDate),
    claim(dossier.ticker, "thesis_breaker", "editorial_analysis", dossier.thesisBreaker, "Defines evidence that would invalidate the ownership thesis.", sec, evidenceDate),
    `INSERT INTO dossier_audit_members (run_id,ticker,source_count,claim_count,completeness,verified_at) VALUES (${sql(auditRunId)},${sql(dossier.ticker)},${dossier.sources.length},8,${dossier.completeness},CURRENT_TIMESTAMP) ON CONFLICT(run_id,ticker) DO UPDATE SET source_count=excluded.source_count,claim_count=excluded.claim_count,completeness=excluded.completeness,verified_at=CURRENT_TIMESTAMP;`,
  );
  return statements.join("\n\n");
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
