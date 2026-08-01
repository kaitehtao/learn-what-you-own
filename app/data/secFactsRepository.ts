import { sql } from "drizzle-orm";
import { getDb } from "../../db";
import { companies, filingFactImports, filingFacts } from "../../db/schema";
import { getSecCompany } from "./secCompanies.generated";
import { normalizeCompanyFacts, type SecCompanyFacts } from "./secMetrics";
import { researchUniverse } from "./universe";

const D1_FACT_BATCH_SIZE = 5;

export type SecFactImportResult = {
  ticker: string;
  imported: number;
  metrics: number;
  status: "success" | "no_compatible_facts";
  source: string;
};

export async function importSecFilingFacts(tickerValue: string): Promise<SecFactImportResult> {
  const ticker = tickerValue.trim().toUpperCase();
  const company = researchUniverse.find((candidate) => candidate.ticker === ticker);
  const secCompany = getSecCompany(ticker);
  if (!company || !secCompany) throw new Error("A verified ticker-to-CIK match is required.");

  const source = `https://data.sec.gov/api/xbrl/companyfacts/CIK${secCompany.cik}.json`;
  const db = getDb();
  await db.insert(companies).values({
    ticker: company.ticker,
    name: company.name,
    sector: company.sector,
    exchange: company.exchange,
    marketCap: company.marketCap,
    membershipsJson: JSON.stringify(company.memberships),
    indexWeightsJson: JSON.stringify(company.indexWeights),
    cik: secCompany.cik,
  }).onConflictDoUpdate({
    target: companies.ticker,
    set: {
      name: company.name,
      sector: company.sector,
      exchange: company.exchange,
      marketCap: company.marketCap,
      membershipsJson: JSON.stringify(company.memberships),
      indexWeightsJson: JSON.stringify(company.indexWeights),
      cik: secCompany.cik,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    },
  });

  try {
    const response = await fetch(source, {
      headers: {
        accept: "application/json",
        "user-agent": "LearnWhatYouOwn/1.0 research@learnwhatyouown.com",
      },
    });
    if (!response.ok) throw new Error(`SEC Company Facts returned ${response.status}.`);

    const normalized = normalizeCompanyFacts(secCompany.cik, await response.json() as SecCompanyFacts);
    for (let index = 0; index < normalized.length; index += D1_FACT_BATCH_SIZE) {
      const values = normalized.slice(index, index + D1_FACT_BATCH_SIZE).map((fact) => ({ ticker, ...fact }));
      if (!values.length) continue;
      await db.insert(filingFacts).values(values).onConflictDoUpdate({
        target: [filingFacts.ticker, filingFacts.metricKey, filingFacts.periodEnd, filingFacts.fiscalPeriod],
        set: {
          taxonomy: sql`excluded.taxonomy`,
          concept: sql`excluded.concept`,
          label: sql`excluded.label`,
          value: sql`excluded.value`,
          unit: sql`excluded.unit`,
          periodStart: sql`excluded.period_start`,
          fiscalYear: sql`excluded.fiscal_year`,
          form: sql`excluded.form`,
          filedAt: sql`excluded.filed_at`,
          accessionNumber: sql`excluded.accession_number`,
          sourceUrl: sql`excluded.source_url`,
          dimensionsJson: sql`excluded.dimensions_json`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });
    }

    const metrics = new Set(normalized.map((fact) => fact.metricKey)).size;
    const status = normalized.length ? "success" as const : "no_compatible_facts" as const;
    await db.insert(filingFactImports).values({
      ticker,
      status,
      sourceUrl: source,
      importedCount: normalized.length,
      metricCount: metrics,
      lastSuccessAt: sql`CURRENT_TIMESTAMP`,
    }).onConflictDoUpdate({
      target: filingFactImports.ticker,
      set: {
        status,
        sourceUrl: source,
        importedCount: normalized.length,
        metricCount: metrics,
        lastAttemptedAt: sql`CURRENT_TIMESTAMP`,
        lastSuccessAt: sql`CURRENT_TIMESTAMP`,
        errorMessage: null,
      },
    });
    return { ticker, imported: normalized.length, metrics, status, source };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SEC import failed.";
    await db.insert(filingFactImports).values({
      ticker,
      status: "error",
      sourceUrl: source,
      errorMessage: message.slice(0, 500),
    }).onConflictDoUpdate({
      target: filingFactImports.ticker,
      set: {
        status: "error",
        sourceUrl: source,
        lastAttemptedAt: sql`CURRENT_TIMESTAMP`,
        errorMessage: message.slice(0, 500),
      },
    });
    throw error;
  }
}
