import { companySlug } from "../../data/universe";
import { listPublishedDossierSitemapEntries } from "../../../db/publishedDossier";
import { sitemapHeaders, urlsetDocument } from "../sitemap-utils";

const origin = "https://learnwhatyouown.com";

export const dynamic = "force-dynamic";

export async function GET() {
  const dossiers = await listPublishedDossierSitemapEntries();
  return new Response(urlsetDocument(dossiers.map(({ ticker, lastModified }) => ({
    loc: `${origin}/company/${companySlug(ticker)}`,
    lastModified,
  }))), { headers: { ...sitemapHeaders, "cache-control": "public, max-age=300, s-maxage=3600" } });
}
