import assert from "node:assert/strict";
import test from "node:test";
import { sitemapIndexDocument, urlsetDocument } from "../app/sitemaps/sitemap-utils";

test("serializes canonical sitemap URLs with escaped values and last-modified dates", () => {
  const xml = urlsetDocument([
    { loc: "https://learnwhatyouown.com/company/brk-b", lastModified: "2026-08-07" },
    { loc: "https://learnwhatyouown.com/learn/research?a=1&b=2" },
  ]);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /<lastmod>2026-08-07<\/lastmod>/);
  assert.match(xml, /research\?a=1&amp;b=2/);
});

test("serializes a sitemap index for independently auditable sitemap groups", () => {
  const xml = sitemapIndexDocument([
    "https://learnwhatyouown.com/sitemaps/core.xml",
    "https://learnwhatyouown.com/sitemaps/companies.xml",
  ]);
  assert.match(xml, /<sitemapindex/);
  assert.match(xml, /sitemaps\/core\.xml/);
  assert.match(xml, /sitemaps\/companies\.xml/);
});
