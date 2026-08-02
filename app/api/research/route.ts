import { and, asc, desc, eq, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureQuarterlyDossierUpdatesSchema } from "../../../db/runtimeSchema";
import { companyRelationships, dossierClaims, filingFactImports, filingFacts, quarterlyDossierUpdates } from "../../../db/schema";
import { featuredDossiers } from "../../data/featuredDossiers";
import { ensureFeaturedDossierRegistration, importSecFilingFacts } from "../../data/secFactsRepository";
import { researchUniverse } from "../../data/universe";

export const dynamic = "force-dynamic";

function relatedEndpoint(ticker: string, row: typeof companyRelationships.$inferSelect) {
  const companyIsSupplier = row.supplierTicker === ticker;
  return {
    id: row.id,
    direction: companyIsSupplier ? "customer" : "supplier",
    relatedTicker: companyIsSupplier ? row.customerTicker : row.supplierTicker,
    relatedName: companyIsSupplier ? row.customerName : row.supplierName,
    supplierTicker: row.supplierTicker,
    supplierName: row.supplierName,
    customerTicker: row.customerTicker,
    customerName: row.customerName,
    productService: row.productService,
    evidenceSummary: row.evidenceSummary,
    materiality: row.materiality,
    evidenceClass: row.evidenceClass,
    sourceType: row.sourceType,
    sourceTitle: row.sourceTitle,
    sourceUrl: row.sourceUrl,
    evidenceDate: row.evidenceDate,
    status: row.status,
    contributorUsername: row.contributorUsername,
    verifiedAt: row.verifiedAt,
  };
}

export async function GET(request: Request) {
  const ticker = new URL(request.url).searchParams.get("ticker")?.trim().toUpperCase() ?? "";
  if (!researchUniverse.some((company) => company.ticker === ticker)) {
    return Response.json({ error: "Choose a valid company ticker." }, { status: 400 });
  }

  try {
    try {
      await ensureQuarterlyDossierUpdatesSchema();
    } catch (error) {
      console.error(`Quarterly dossier schema check failed for ${ticker}; continuing with core research sources.`, error);
    }
    const db = getDb();
    const queries = await Promise.allSettled([
      db.select().from(filingFacts).where(eq(filingFacts.ticker, ticker))
        .orderBy(asc(filingFacts.metricKey), desc(filingFacts.periodEnd)).limit(300),
      db.select().from(dossierClaims).where(and(eq(dossierClaims.ticker, ticker), eq(dossierClaims.status, "published")))
        .orderBy(asc(dossierClaims.section), desc(dossierClaims.evidenceDate)).limit(100),
      db.select().from(companyRelationships).where(or(
        eq(companyRelationships.supplierTicker, ticker),
        eq(companyRelationships.customerTicker, ticker),
      )).orderBy(desc(companyRelationships.evidenceDate)).limit(100),
      db.select().from(filingFactImports).where(eq(filingFactImports.ticker, ticker)).limit(1),
      db.select().from(quarterlyDossierUpdates).where(eq(quarterlyDossierUpdates.ticker, ticker))
        .orderBy(desc(quarterlyDossierUpdates.filedAt)).limit(8),
    ]);
    const [factsResult, claimsResult, relationshipsResult, importsResult, quarterlyResult] = queries;
    let facts = factsResult.status === "fulfilled" ? factsResult.value : [];
    const claims = claimsResult.status === "fulfilled" ? claimsResult.value : [];
    const relationships = relationshipsResult.status === "fulfilled" ? relationshipsResult.value : [];
    let importRows = importsResult.status === "fulfilled" ? importsResult.value : [];
    const quarterlyUpdates = quarterlyResult.status === "fulfilled" ? quarterlyResult.value : [];

    // Managed deployments can lag a newly added data migration. A completed
    // dossier therefore performs one safe, idempotent first-read import when
    // no filing history exists yet. Recurring refreshes remain scheduler-owned.
    if (facts.length === 0 && featuredDossiers[ticker]) {
      try {
        await ensureFeaturedDossierRegistration(ticker);
        await importSecFilingFacts(ticker);
        [facts, importRows] = await Promise.all([
          db.select().from(filingFacts).where(eq(filingFacts.ticker, ticker))
            .orderBy(asc(filingFacts.metricKey), desc(filingFacts.periodEnd)).limit(300),
          db.select().from(filingFactImports).where(eq(filingFactImports.ticker, ticker)).limit(1),
        ]);
      } catch (error) {
        console.error(`Initial SEC facts import failed for ${ticker}; returning available research.`, error);
      }
    }
    const sourceStatus = {
      secFacts: factsResult.status === "fulfilled" ? "available" : "unavailable",
      claims: claimsResult.status === "fulfilled" ? "available" : "unavailable",
      relationships: relationshipsResult.status === "fulfilled" ? "available" : "unavailable",
      importHistory: importsResult.status === "fulfilled" ? "available" : "unavailable",
      quarterlyUpdates: quarterlyResult.status === "fulfilled" ? "available" : "unavailable",
    };
    queries.forEach((result, index) => {
      if (result.status === "rejected") console.error(`Research source ${Object.keys(sourceStatus)[index]} failed for ${ticker}.`, result.reason);
    });

    return Response.json({
      ticker,
      sourceStatus,
      facts: facts.map((fact) => ({
        id: fact.id,
        metricKey: fact.metricKey,
        label: fact.label,
        value: fact.value,
        unit: fact.unit,
        periodStart: fact.periodStart,
        periodEnd: fact.periodEnd,
        fiscalYear: fact.fiscalYear,
        fiscalPeriod: fact.fiscalPeriod,
        form: fact.form,
        filedAt: fact.filedAt,
        sourceUrl: fact.sourceUrl,
        updatedAt: fact.updatedAt,
      })),
      claims: claims.map((claim) => ({
        id: claim.id,
        section: claim.section,
        claimType: claim.claimType,
        claim: claim.claim,
        whyItMatters: claim.whyItMatters,
        sourceTitle: claim.sourceTitle,
        sourceUrl: claim.sourceUrl,
        sourceExcerpt: claim.sourceExcerpt,
        evidenceDate: claim.evidenceDate,
      })),
      relationships: relationships.map((relationship) => relatedEndpoint(ticker, relationship)),
      factsImport: importRows[0] ? {
        status: importRows[0].status,
        sourceUrl: importRows[0].sourceUrl,
        importedCount: importRows[0].importedCount,
        metricCount: importRows[0].metricCount,
        lastAttemptedAt: importRows[0].lastAttemptedAt,
        lastSuccessAt: importRows[0].lastSuccessAt,
      } : null,
      quarterlyUpdates: quarterlyUpdates.map((update) => ({
        id: update.id,
        accessionNumber: update.accessionNumber,
        form: update.form,
        periodEnd: update.periodEnd,
        filedAt: update.filedAt,
        sourceUrl: update.sourceUrl,
        status: update.status,
        editorialSummary: update.status === "published" ? update.editorialSummary : "",
        reviewedAt: update.reviewedAt,
        publishedAt: update.publishedAt,
      })),
    }, { headers: { "cache-control": "public, max-age=300, s-maxage=900" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "The public research database is temporarily unavailable." }, { status: 503 });
  }
}
