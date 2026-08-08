import { sitemapHeaders, urlsetDocument } from "../sitemap-utils";

const origin = "https://learnwhatyouown.com";
const publicPaths = [
  "",
  "/companies",
  "/comps",
  "/contributors",
  "/earnings",
  "/emerging-companies",
  "/emerging-companies/y-combinator",
  "/founders-letter",
  "/facts",
  "/insider-activity",
  "/interviews",
  "/learn",
  "/research/batches",
  "/research/sp-500",
  "/research/nasdaq-100",
  "/research/russell-3000",
  "/research/russell-2000",
];

export async function GET() {
  return new Response(urlsetDocument(publicPaths.map((path) => ({ loc: `${origin}${path || "/"}` }))), { headers: sitemapHeaders });
}
