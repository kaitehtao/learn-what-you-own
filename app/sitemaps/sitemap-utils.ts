export type SitemapUrl = { loc: string; lastModified?: string | null };

function xmlEscape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export function urlsetDocument(urls: SitemapUrl[]): string {
  const entries = urls.map(({ loc, lastModified }) => {
    const lastmod = lastModified ? `<lastmod>${xmlEscape(lastModified)}</lastmod>` : "";
    return `<url><loc>${xmlEscape(loc)}</loc>${lastmod}</url>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

export function sitemapIndexDocument(sitemaps: string[]): string {
  const entries = sitemaps.map((loc) => `<sitemap><loc>${xmlEscape(loc)}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

export const sitemapHeaders = {
  "content-type": "application/xml; charset=utf-8",
  "cache-control": "public, max-age=3600, s-maxage=86400",
};
