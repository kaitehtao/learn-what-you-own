import { sql } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { companyDossiers, dossierClaims, dossierSources } from "../../../../../db/schema";
import { getCuratedDossierBundle } from "../../../../data/curatedDossierClaims";
import { importSecFilingFacts } from "../../../../data/secFactsRepository";
import { researchUniverse } from "../../../../data/universe";
import { apiError, requireEditor } from "../../../../supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { profile } = await requireEditor(request);
    const payload = await request.json() as { ticker?: string };
    const ticker = String(payload.ticker ?? "").trim().toUpperCase();
    const company = researchUniverse.find((candidate) => candidate.ticker === ticker);
    if (!company) return Response.json({ error: "A verified ticker-to-CIK match is required." }, { status: 400 });
    const factImport = await importSecFilingFacts(ticker);
    const db = getDb();

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
      imported: factImport.imported,
      metrics: factImport.metrics,
      claims: importedClaims,
      dossierStatus: dossier ? "published" : "facts-only",
      importedBy: profile.username,
      source: factImport.source,
    });
  } catch (error) {
    return apiError(error);
  }
}
