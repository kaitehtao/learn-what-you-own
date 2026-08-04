import { featuredDossiers } from "../data/featuredDossiers";
import { companySlug } from "../data/universe";

const origin = "https://learnwhatyouown.com";
const staticPaths = [
  "",
  "/companies",
  "/comps",
  "/contributors",
  "/earnings",
  "/emerging-companies",
  "/founders-letter",
  "/insider-activity",
  "/interviews",
  "/research/batches",
];

function xmlEscape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export async function GET() {
  const companyPaths = Object.keys(featuredDossiers).map((ticker) => `/company/${companySlug(ticker)}`);
  const urls = [...staticPaths, ...companyPaths].map((path) => `<url><loc>${xmlEscape(`${origin}${path || "/"}`)}</loc></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
