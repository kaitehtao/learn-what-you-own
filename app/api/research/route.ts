import { and, asc, desc, eq, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { companyRelationships, dossierClaims, filingFacts } from "../../../db/schema";
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
    const db = getDb();
    const [facts, claims, relationships] = await Promise.all([
      db.select().from(filingFacts).where(eq(filingFacts.ticker, ticker))
        .orderBy(asc(filingFacts.metricKey), desc(filingFacts.periodEnd)).limit(300),
      db.select().from(dossierClaims).where(and(eq(dossierClaims.ticker, ticker), eq(dossierClaims.status, "published")))
        .orderBy(asc(dossierClaims.section), desc(dossierClaims.evidenceDate)).limit(100),
      db.select().from(companyRelationships).where(or(
        eq(companyRelationships.supplierTicker, ticker),
        eq(companyRelationships.customerTicker, ticker),
      )).orderBy(desc(companyRelationships.evidenceDate)).limit(100),
    ]);

    return Response.json({
      ticker,
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
    }, { headers: { "cache-control": "public, max-age=300, s-maxage=900" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "The public research database is temporarily unavailable." }, { status: 503 });
  }
}
