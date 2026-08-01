import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { featuredDossiers, type FeaturedDossier } from "../app/data/featuredDossiers";

const outputPath = resolve(process.argv[2] ?? "/tmp/publish-normalized-dossiers.sql");
const tickers = process.argv.slice(3).map((ticker) => ticker.trim().toUpperCase()).filter(Boolean);

if (tickers.length === 0) throw new Error("Pass one or more dossier tickers after the output path.");

function sql(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function isoDate(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? fallback : parsed.toISOString().slice(0, 10);
}

function sourceEvidenceDate(source: FeaturedDossier["sources"][number], fallback: string): string {
  const date = source.meta.match(/(?:Filed|Published) ([A-Z][a-z]+ \d{1,2}, \d{4})/)?.[1];
  return isoDate(date, fallback);
}

function sourceType(source: FeaturedDossier["sources"][number]): "sec_filing" | "sec_company_page" | "investor_relations" {
  if (!source.href.includes("sec.gov")) return "investor_relations";
  return source.href.includes("/edgar/browse/") ? "sec_company_page" : "sec_filing";
}

function claimStatements(dossier: FeaturedDossier, evidenceDate: string): string[] {
  const annual = dossier.sources[0];
  const company = dossier.sources[1] ?? annual;
  const quarterly = dossier.sources.find((source, index) => index > 0 && source.href.includes("sec.gov/Archives/")) ?? annual;
  const statements: string[] = [];

  const add = (
    section: string,
    claimType: "verified_fact" | "company_statement" | "editorial_analysis",
    claim: string,
    whyItMatters: string,
    source: FeaturedDossier["sources"][number],
  ) => statements.push(
    `INSERT INTO dossier_claims (ticker, section, claim_type, claim, why_it_matters, source_title, source_url, source_excerpt, evidence_date, status, verified_by, verified_at, updated_at)
VALUES (${sql(dossier.ticker)}, ${sql(section)}, ${sql(claimType)}, ${sql(claim)}, ${sql(whyItMatters)}, ${sql(source.title)}, ${sql(source.href)}, ${sql(source.excerpt)}, ${sql(sourceEvidenceDate(source, evidenceDate))}, 'published', 'Founding editorial research', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(ticker, claim, source_url) DO UPDATE SET
  section = excluded.section,
  claim_type = excluded.claim_type,
  why_it_matters = excluded.why_it_matters,
  source_title = excluded.source_title,
  source_excerpt = excluded.source_excerpt,
  evidence_date = excluded.evidence_date,
  status = 'published',
  verified_by = excluded.verified_by,
  verified_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP;`,
  );

  add("owner_summary", "editorial_analysis", dossier.lede, "Defines the central owner lens and the variables that determine long-term value.", annual);
  add("business_model", "verified_fact", dossier.sells, "Identifies the products, services, customers, and operating footprint that produce revenue.", annual);
  add("business_model", "editorial_analysis", dossier.revenueModel, "Explains how reported revenue converts into operating and owner economics.", annual);
  add("opportunity", "editorial_analysis", dossier.opportunity, "States the evidence-grounded route by which the business could expand value.", company);
  add("owner_requirements", "editorial_analysis", dossier.mustGoRight, "Makes the operating and capital-allocation conditions of the thesis falsifiable.", annual);
  add("thesis_breaker", "editorial_analysis", dossier.thesisBreaker, "Defines the evidence that would invalidate the ownership case.", annual);
  dossier.bull.forEach((claim) => add("bull_case", "editorial_analysis", claim, "Supports the constructive side of the balanced investment debate.", company));
  dossier.bear.forEach((claim) => add("bear_case", "editorial_analysis", claim, "Supports the skeptical side of the balanced investment debate.", annual));
  dossier.financialDrivers.forEach((driver) => add("financial_drivers", "editorial_analysis", `${driver.label}: ${driver.value} — ${driver.detail}`, "Identifies a measurable driver owners should update from each filing.", quarterly));
  dossier.risks.forEach((risk) => add("risks", "editorial_analysis", `${risk.title}: ${risk.text}`, `Leading indicator: ${risk.signal}`, annual));
  dossier.monitor.forEach((item) => add("monitor", "editorial_analysis", `${item.title}: ${item.text}`, `Thesis impact: ${item.impact}`, quarterly));
  return statements;
}

const statements = ["PRAGMA foreign_keys = ON;"];

for (const ticker of tickers) {
  const dossier = featuredDossiers[ticker];
  if (!dossier) throw new Error(`No featured dossier exists for ${ticker}.`);
  const evidenceDate = isoDate(dossier.reviewed, "2026-08-01");

  statements.push(
    `INSERT INTO company_dossiers (ticker, status, description, lede, sells, revenue_model, opportunity, must_go_right, editor_note, bull_title, bull_json, bear_title, bear_json, thesis_breaker, financial_drivers_json, risks_json, monitor_json, questions_json, competitors, evidence_date, validated_at, published_at, updated_at)
VALUES (${sql(dossier.ticker)}, 'published', ${sql(dossier.description)}, ${sql(dossier.lede)}, ${sql(dossier.sells)}, ${sql(dossier.revenueModel)}, ${sql(dossier.opportunity)}, ${sql(dossier.mustGoRight)}, ${sql(dossier.editorNote)}, ${sql(dossier.bullTitle)}, ${sql(JSON.stringify(dossier.bull))}, ${sql(dossier.bearTitle)}, ${sql(JSON.stringify(dossier.bear))}, ${sql(dossier.thesisBreaker)}, ${sql(JSON.stringify(dossier.financialDrivers))}, ${sql(JSON.stringify(dossier.risks))}, ${sql(JSON.stringify(dossier.monitor))}, ${sql(JSON.stringify(dossier.questions))}, ${sql(dossier.competitors)}, ${sql(evidenceDate)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(ticker) DO UPDATE SET
  status = 'published', description = excluded.description, lede = excluded.lede,
  sells = excluded.sells, revenue_model = excluded.revenue_model,
  opportunity = excluded.opportunity, must_go_right = excluded.must_go_right,
  editor_note = excluded.editor_note, bull_title = excluded.bull_title,
  bull_json = excluded.bull_json, bear_title = excluded.bear_title,
  bear_json = excluded.bear_json, thesis_breaker = excluded.thesis_breaker,
  financial_drivers_json = excluded.financial_drivers_json,
  risks_json = excluded.risks_json, monitor_json = excluded.monitor_json,
  questions_json = excluded.questions_json, competitors = excluded.competitors,
  evidence_date = excluded.evidence_date, validated_at = CURRENT_TIMESTAMP,
  published_at = COALESCE(company_dossiers.published_at, CURRENT_TIMESTAMP),
  updated_at = CURRENT_TIMESTAMP;`,
    `DELETE FROM dossier_sources WHERE ticker = ${sql(dossier.ticker)};`,
    `DELETE FROM dossier_claims WHERE ticker = ${sql(dossier.ticker)};`,
  );

  for (const source of dossier.sources) {
    statements.push(
      `INSERT INTO dossier_sources (ticker, title, source_type, url, evidence_date, excerpt, verified_at)
VALUES (${sql(dossier.ticker)}, ${sql(source.title)}, ${sql(sourceType(source))}, ${sql(source.href)}, ${sql(sourceEvidenceDate(source, evidenceDate))}, ${sql(source.excerpt)}, CURRENT_TIMESTAMP)
ON CONFLICT(ticker, url) DO UPDATE SET
  title = excluded.title, source_type = excluded.source_type,
  evidence_date = excluded.evidence_date, excerpt = excluded.excerpt,
  verified_at = CURRENT_TIMESTAMP;`,
    );
  }
  statements.push(...claimStatements(dossier, evidenceDate));
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${statements.join("\n\n")}\n`);
console.log(`Generated ${outputPath}: ${tickers.length} normalized dossier publication records.`);
