import { sitemapIndexDocument } from "../sitemaps/sitemap-utils";

const origin = "https://learnwhatyouown.com";

export async function GET() {
  return new Response(sitemapIndexDocument([
    `${origin}/sitemaps/core.xml`,
    `${origin}/sitemaps/learn.xml`,
    `${origin}/sitemaps/companies.xml`,
  ]), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
