import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { ensureQuarterlyDossierUpdatesSchema } from "../../db/runtimeSchema";
import { companies, companyDossiers, dossierSources, filingFactImports, filingFacts, quarterlyDossierUpdates } from "../../db/schema";
import { featuredDossiers } from "./featuredDossiers";
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
  quarterlyUpdate: { accessionNumber: string; form: string; filedAt: string; periodEnd: string } | null;
};

export async function ensureFeaturedDossierRegistration(tickerValue: string) {
  const ticker = tickerValue.trim().toUpperCase();
  const dossier = featuredDossiers[ticker];
  const company = researchUniverse.find((candidate) => candidate.ticker === ticker);
  const secCompany = getSecCompany(ticker);
  if (!dossier || !company || !secCompany) return false;

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

  await db.insert(companyDossiers).values({
    ticker,
    status: "published",
    contentJson: JSON.stringify(dossier),
    verifiedBy: "Founding editorial research",
    verifiedAt: sql`CURRENT_TIMESTAMP`,
    publishedAt: sql`CURRENT_TIMESTAMP`,
  }).onConflictDoUpdate({
    target: companyDossiers.ticker,
    set: {
      status: "published",
      contentJson: JSON.stringify(dossier),
      verifiedBy: "Founding editorial research",
      verifiedAt: sql`CURRENT_TIMESTAMP`,
      publishedAt: sql`COALESCE(${companyDossiers.publishedAt}, CURRENT_TIMESTAMP)`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    },
  });

  for (const source of dossier.sources) {
    await db.insert(dossierSources).values({
      ticker,
      sourceType: source.href.includes("sec.gov") ? "sec" : "company",
      title: source.title,
      url: source.href,
    }).onConflictDoNothing();
  }
  return true;
}

async function recordLatestQuarterlyUpdate(ticker: string, normalized: ReturnType<typeof normalizeCompanyFacts>) {
  const latest = normalized
    .filter((fact) => /^(10-Q|10-K)(?:\/A)?$/.test(fact.form))
    .sort((left, right) => right.filedAt.localeCompare(left.filedAt) || right.periodEnd.localeCompare(left.periodEnd))[0];
  if (!latest) return null;

  await ensureQuarterlyDossierUpdatesSchema();
  const db = getDb();
  const published = await db.select({ ticker: companyDossiers.ticker }).from(companyDossiers)
    .where(and(eq(companyDossiers.ticker, ticker), eq(companyDossiers.status, "published"))).limit(1);
  if (!published.length) return null;

  await db.insert(quarterlyDossierUpdates).values({
    ticker,
    accessionNumber: latest.accessionNumber,
    form: latest.form,
    periodEnd: latest.periodEnd,
    filedAt: latest.filedAt,
    sourceUrl: latest.sourceUrl,
  }).onConflictDoUpdate({
    target: [quarterlyDossierUpdates.ticker, quarterlyDossierUpdates.accessionNumber],
    set: {
      form: latest.form,
      periodEnd: latest.periodEnd,
      filedAt: latest.filedAt,
      sourceUrl: latest.sourceUrl,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    },
  });

  return {
    accessionNumber: latest.accessionNumber,
    form: latest.form,
    filedAt: latest.filedAt,
    periodEnd: latest.periodEnd,
  };
}

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
    const quarterlyUpdate = await recordLatestQuarterlyUpdate(ticker, normalized);
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
    return { ticker, imported: normalized.length, metrics, status, source, quarterlyUpdate };
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
