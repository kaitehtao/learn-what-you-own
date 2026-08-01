import { sql } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { companies, companyDossiers, dossierClaims, dossierSources, filingFacts } from "../../../../../db/schema";
import { getCuratedDossierBundle } from "../../../../data/curatedDossierClaims";
import { normalizeCompanyFacts, type SecCompanyFacts } from "../../../../data/secMetrics";
import { getSecCompany } from "../../../../data/secCompanies.generated";
import { researchUniverse } from "../../../../data/universe";
import { apiError, requireEditor } from "../../../../supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { profile } = await requireEditor(request);
    const payload = await request.json() as { ticker?: string };
    const ticker = String(payload.ticker ?? "").trim().toUpperCase();
    const company = researchUniverse.find((candidate) => candidate.ticker === ticker);
    const secCompany = getSecCompany(ticker);
    if (!company || !secCompany) {
      return Response.json({ error: "A verified ticker-to-CIK match is required." }, { status: 400 });
    }

    const response = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${secCompany.cik}.json`, {
      headers: {
        accept: "application/json",
        "user-agent": "LearnWhatYouOwn/1.0 https://learnwhatyouown.com",
      },
    });
    if (!response.ok) {
      return Response.json({ error: `SEC Company Facts returned ${response.status}.` }, { status: 502 });
    }

    const normalized = normalizeCompanyFacts(secCompany.cik, await response.json() as SecCompanyFacts);
    const db = getDb();
    await db.insert(companies).values({
      ticker: company.ticker,
      name: company.name,
      sector: company.sector,
      exchange: company.exchange,
      marketCap: company.marketCap,
      membershipsJson: JSON.stringify(company.memberships),
      indexWeightsJson: JSON.stringify(company.indexWeights),
    }).onConflictDoUpdate({
      target: companies.ticker,
      set: {
        name: company.name,
        sector: company.sector,
        exchange: company.exchange,
        marketCap: company.marketCap,
        membershipsJson: JSON.stringify(company.memberships),
        indexWeightsJson: JSON.stringify(company.indexWeights),
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });

    for (let index = 0; index < normalized.length; index += 20) {
      const values = normalized.slice(index, index + 20).map((fact) => ({ ticker, ...fact }));
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

    const dossier = getCuratedDossierBundle(ticker);
    let importedClaims = 0;
    if (dossier) {
      const sourceHostname = new URL(dossier.sourceUrl).hostname.toLowerCase();
      if (sourceHostname !== "sec.gov" && !sourceHostname.endsWith(".sec.gov")) {
        throw new Error("Curated dossier evidence must link directly to SEC EDGAR.");
      }

      await db.insert(companyDossiers).values({
        ticker,
        status: "published",
        contentJson: JSON.stringify({ coverage: "SEC facts and filing-grounded narrative", claimCount: dossier.claims.length }),
        verifiedBy: profile.username,
        verifiedAt: sql`CURRENT_TIMESTAMP`,
        publishedAt: sql`CURRENT_TIMESTAMP`,
      }).onConflictDoUpdate({
        target: companyDossiers.ticker,
        set: {
          status: "published",
          contentJson: JSON.stringify({ coverage: "SEC facts and filing-grounded narrative", claimCount: dossier.claims.length }),
          verifiedBy: profile.username,
          verifiedAt: sql`CURRENT_TIMESTAMP`,
          publishedAt: sql`CURRENT_TIMESTAMP`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });

      await db.insert(dossierSources).values({
        ticker,
        sourceType: "sec",
        title: dossier.sourceTitle,
        url: dossier.sourceUrl,
        filingType: dossier.filingType,
        filedAt: dossier.filedAt,
      }).onConflictDoNothing();

      for (const claim of dossier.claims) {
        await db.insert(dossierClaims).values({
          ticker,
          ...claim,
          sourceTitle: dossier.sourceTitle,
          sourceUrl: dossier.sourceUrl,
          evidenceDate: dossier.filedAt,
          status: "published",
          verifiedBy: profile.username,
          verifiedAt: sql`CURRENT_TIMESTAMP`,
        }).onConflictDoUpdate({
          target: [dossierClaims.ticker, dossierClaims.claim, dossierClaims.sourceUrl],
          set: {
            section: claim.section,
            claimType: claim.claimType,
            whyItMatters: claim.whyItMatters,
            sourceTitle: dossier.sourceTitle,
            sourceExcerpt: claim.sourceExcerpt,
            evidenceDate: dossier.filedAt,
            status: "published",
            verifiedBy: profile.username,
            verifiedAt: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          },
        });
      }
      importedClaims = dossier.claims.length;
    }

    return Response.json({
      ticker,
      imported: normalized.length,
      metrics: [...new Set(normalized.map((fact) => fact.metricKey))].length,
      claims: importedClaims,
      dossierStatus: dossier ? "published" : "facts-only",
      importedBy: profile.username,
      source: `https://data.sec.gov/api/xbrl/companyfacts/CIK${secCompany.cik}.json`,
    });
  } catch (error) {
    return apiError(error);
  }
}
