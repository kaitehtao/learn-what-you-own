import { and, asc, desc, eq, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureDossierFreshnessSchema, ensureQuarterlyDossierUpdatesSchema } from "../../../db/runtimeSchema";
import { companyDossiers, companyRelationships, dossierClaims, dossierFreshnessChecks, dossierFreshnessEvents, filingFactImports, filingFacts, quarterlyDossierUpdates } from "../../../db/schema";
import { importSecFilingFacts } from "../../data/secFactsRepository";
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

function parseJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const ticker = new URL(request.url).searchParams.get("ticker")?.trim().toUpperCase() ?? "";
  if (!researchUniverse.some((company) => company.ticker === ticker)) {
    return Response.json({ error: "Choose a valid company ticker." }, { status: 400 });
  }

  try {
    try {
      await ensureQuarterlyDossierUpdatesSchema();
      await ensureDossierFreshnessSchema();
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
      db.select().from(dossierFreshnessEvents).where(eq(dossierFreshnessEvents.ticker, ticker))
        .orderBy(desc(dossierFreshnessEvents.filingDate), desc(dossierFreshnessEvents.detectedAt)).limit(12),
      db.select().from(dossierFreshnessChecks).where(eq(dossierFreshnessChecks.ticker, ticker)).limit(1),
      db.select({ status: companyDossiers.status, qualityTier: companyDossiers.qualityTier, updatedAt: companyDossiers.updatedAt })
        .from(companyDossiers).where(eq(companyDossiers.ticker, ticker)).limit(1),
    ]);
    const [factsResult, claimsResult, relationshipsResult, importsResult, quarterlyResult, freshnessResult, freshnessCheckResult, dossierResult] = queries;
    let facts = factsResult.status === "fulfilled" ? factsResult.value : [];
    const claims = claimsResult.status === "fulfilled" ? claimsResult.value : [];
    const relationships = relationshipsResult.status === "fulfilled" ? relationshipsResult.value : [];
    let importRows = importsResult.status === "fulfilled" ? importsResult.value : [];
    const quarterlyUpdates = quarterlyResult.status === "fulfilled" ? quarterlyResult.value : [];
    const freshnessEvents = freshnessResult.status === "fulfilled" ? freshnessResult.value : [];
    const freshnessChecks = freshnessCheckResult.status === "fulfilled" ? freshnessCheckResult.value : [];
    const dossierRows = dossierResult.status === "fulfilled" ? dossierResult.value : [];
    const dossierState = dossierRows[0] ?? null;

    // Any published evidence-bearing dossier can safely bootstrap its filing
    // facts on first read. Eligibility comes from D1 rather than a compiled
    // ticker registry; recurring refreshes remain scheduler-owned.
    if (facts.length === 0 && dossierState?.status === "published" && dossierState.qualityTier !== "starting_point") {
      try {
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
      freshnessEvents: freshnessResult.status === "fulfilled" ? "available" : "unavailable",
      freshnessCheck: freshnessCheckResult.status === "fulfilled" ? "available" : "unavailable",
      dossierState: dossierResult.status === "fulfilled" ? "available" : "unavailable",
    };
    queries.forEach((result, index) => {
      if (result.status === "rejected") console.error(`Research source ${Object.keys(sourceStatus)[index]} failed for ${ticker}.`, result.reason);
    });

    return Response.json({
      ticker,
      dossier: dossierState,
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
        objectiveSummary: update.objectiveSummary,
        comparisons: parseJsonArray(update.comparisonsJson),
        comparisonBasis: update.comparisonBasis,
        comparisonGeneratedAt: update.comparisonGeneratedAt,
        editorialSummary: update.status === "published" ? update.editorialSummary : "",
        reviewedAt: update.reviewedAt,
        publishedAt: update.publishedAt,
      })),
      freshnessEvents: freshnessEvents.map((event) => ({
        id: event.id,
        accessionNumber: event.accessionNumber,
        form: event.form,
        filingDate: event.filingDate,
        reportDate: event.reportDate,
        sourceUrl: event.sourceUrl,
        eventType: event.eventType,
        materialityReason: event.materialityReason,
        factsRefreshStatus: event.factsRefreshStatus,
        status: event.status,
        editorialSummary: event.status === "published" ? event.editorialSummary : "",
        publishedAt: event.publishedAt,
      })),
      freshnessCheck: freshnessChecks[0] ? {
        lastAttemptedAt: freshnessChecks[0].lastAttemptedAt,
        lastSuccessAt: freshnessChecks[0].lastSuccessAt,
        latestFilingDate: freshnessChecks[0].latestFilingDate,
        error: freshnessChecks[0].errorMessage,
      } : null,
    }, { headers: { "cache-control": "public, max-age=300, s-maxage=900" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "The public research database is temporarily unavailable." }, { status: 503 });
  }
}
