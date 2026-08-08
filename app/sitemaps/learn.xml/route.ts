import { learningGuides } from "../../learn/guides";
import { sitemapHeaders, urlsetDocument } from "../sitemap-utils";

const origin = "https://learnwhatyouown.com";

export async function GET() {
  return new Response(urlsetDocument(learningGuides.map((guide) => ({ loc: `${origin}/learn/${guide.slug}` }))), { headers: sitemapHeaders });
}
