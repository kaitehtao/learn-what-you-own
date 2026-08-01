import { getSecCompany } from "../../app/data/secCompanies.generated";
import { normalizeCompanyFacts, type SecCompanyFacts } from "../../app/data/secMetrics";

function sql(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function fetchCompanyFacts(url: string): Promise<SecCompanyFacts> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(url, { headers: { accept: "application/json", "user-agent": "LearnWhatYouOwn/1.0 research@learnwhatyouown.com" } });
    if (response.ok) return response.json() as Promise<SecCompanyFacts>;
    lastError = new Error(`SEC Company Facts returned ${response.status}.`);
    if (response.status !== 429 && response.status < 500) break;
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  throw lastError ?? new Error("SEC Company Facts request failed.");
}

export async function generateSecFactSql(tickerValue: string) {
  const ticker = tickerValue.trim().toUpperCase();
  const secCompany = getSecCompany(ticker);
  if (!secCompany) throw new Error(`${ticker}: no verified ticker-to-CIK mapping.`);
  const source = `https://data.sec.gov/api/xbrl/companyfacts/CIK${secCompany.cik}.json`;
  const normalized = normalizeCompanyFacts(secCompany.cik, await fetchCompanyFacts(source));
  const rows = normalized.map((fact) => `(${sql(ticker)}, ${sql(fact.metricKey)}, ${sql(fact.taxonomy)}, ${sql(fact.concept)}, ${sql(fact.label)}, ${sql(fact.value)}, ${sql(fact.unit)}, ${sql(fact.periodStart)}, ${sql(fact.periodEnd)}, ${sql(fact.fiscalYear)}, ${sql(fact.fiscalPeriod)}, ${sql(fact.form)}, ${sql(fact.filedAt)}, ${sql(fact.accessionNumber)}, ${sql(fact.sourceUrl)}, ${sql(fact.dimensionsJson)}, CURRENT_TIMESTAMP)`);
  const statements: string[] = [];
  for (let index = 0; index < rows.length; index += 25) {
    statements.push(`INSERT INTO filing_facts (ticker, metric_key, taxonomy, concept, label, value, unit, period_start, period_end, fiscal_year, fiscal_period, form, filed_at, accession_number, source_url, dimensions_json, updated_at)
VALUES ${rows.slice(index, index + 25).join(",\n")}
ON CONFLICT(ticker, metric_key, period_end, fiscal_period) DO UPDATE SET taxonomy=excluded.taxonomy, concept=excluded.concept, label=excluded.label, value=excluded.value, unit=excluded.unit, period_start=excluded.period_start, fiscal_year=excluded.fiscal_year, form=excluded.form, filed_at=excluded.filed_at, accession_number=excluded.accession_number, source_url=excluded.source_url, dimensions_json=excluded.dimensions_json, updated_at=CURRENT_TIMESTAMP;`);
  }
  const metrics = new Set(normalized.map((fact) => fact.metricKey)).size;
  const status = normalized.length ? "success" : "no_compatible_facts";
  statements.push(`INSERT INTO filing_fact_imports (ticker, status, source_url, imported_count, metric_count, last_attempted_at, last_success_at, error_message)
VALUES (${sql(ticker)}, ${sql(status)}, ${sql(source)}, ${normalized.length}, ${metrics}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL)
ON CONFLICT(ticker) DO UPDATE SET status=excluded.status, source_url=excluded.source_url, imported_count=excluded.imported_count, metric_count=excluded.metric_count, last_attempted_at=CURRENT_TIMESTAMP, last_success_at=CURRENT_TIMESTAMP, error_message=NULL;`);
  return { ticker, source, statements, imported: normalized.length, metrics, status };
}
