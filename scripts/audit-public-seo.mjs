const originArgument = process.argv.find((argument) => argument.startsWith("--origin="));
const origin = new URL(originArgument?.slice("--origin=".length) || "https://learnwhatyouown.com");
const canonicalOrigin = `${origin.protocol}//${origin.host}`;
const failures = [];

function locations(xml) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]
    .replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<").replaceAll("&gt;", ">"));
}

async function getWithoutRedirect(url) {
  return fetch(url, { redirect: "manual", headers: { "user-agent": "LearnWhatYouOwn-SEO-Audit/1.0" } });
}

async function readXml(url) {
  const response = await getWithoutRedirect(url);
  if (response.status !== 200) failures.push(`${url} returned ${response.status}; expected 200`);
  if (!response.headers.get("content-type")?.includes("xml")) failures.push(`${url} did not return XML`);
  return response.text();
}

const sitemapIndexUrl = `${canonicalOrigin}/sitemap.xml`;
const sitemapIndex = await readXml(sitemapIndexUrl);
const childSitemaps = locations(sitemapIndex);
if (!childSitemaps.length) failures.push("The sitemap index contains no child sitemaps");

const pageUrls = [];
for (const sitemap of childSitemaps) {
  const parsed = new URL(sitemap);
  if (parsed.origin !== canonicalOrigin) failures.push(`${sitemap} is not on the canonical origin`);
  pageUrls.push(...locations(await readXml(sitemap)));
}

const uniquePageUrls = [...new Set(pageUrls)];
if (uniquePageUrls.length !== pageUrls.length) failures.push("The sitemap contains duplicate page URLs");

const titleOwners = new Map();
let cursor = 0;
const workers = Array.from({ length: Math.min(8, uniquePageUrls.length) }, async () => {
  while (cursor < uniquePageUrls.length) {
    const pageUrl = uniquePageUrls[cursor++];
    const parsed = new URL(pageUrl);
    if (parsed.origin !== canonicalOrigin) failures.push(`${pageUrl} is not on the canonical origin`);
    const response = await getWithoutRedirect(pageUrl);
    if (response.status !== 200) {
      failures.push(`${pageUrl} returned ${response.status}; sitemap URLs must not redirect or fail`);
      continue;
    }
    const html = await response.text();
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
    const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim();
    const htmlCanonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
      || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1];
    const linkHeader = response.headers.get("link") || "";
    const headerCanonical = linkHeader.match(/<([^>]+)>;\s*rel=["']?canonical/i)?.[1];
    const canonical = htmlCanonical || headerCanonical;
    if (!title) failures.push(`${pageUrl} has no title`);
    if (!description) failures.push(`${pageUrl} has no meta description`);
    if (!canonical || new URL(canonical, pageUrl).toString() !== pageUrl) failures.push(`${pageUrl} has no matching self-canonical`);
    if (/noindex/i.test(html) || /noindex/i.test(response.headers.get("x-robots-tag") || "")) failures.push(`${pageUrl} is noindex but appears in the sitemap`);
    if (title) {
      const owner = titleOwners.get(title);
      if (owner) failures.push(`${pageUrl} duplicates the title used by ${owner}`);
      else titleOwners.set(title, pageUrl);
    }
    if (parsed.pathname === "/" || parsed.pathname.startsWith("/company/")) {
      if (!html.includes("application/ld+json")) failures.push(`${pageUrl} has no structured data`);
    }
  }
});
await Promise.all(workers);

const insecureOrigin = `http://${origin.host}/`;
const insecureResponse = await getWithoutRedirect(insecureOrigin);
if (![301, 308].includes(insecureResponse.status)) failures.push(`${insecureOrigin} returned ${insecureResponse.status}; expected a permanent HTTPS redirect`);

if (failures.length) {
  console.error(`SEO audit failed with ${failures.length} issue${failures.length === 1 ? "" : "s"}:`);
  for (const failure of failures.slice(0, 50)) console.error(`- ${failure}`);
  if (failures.length > 50) console.error(`- ${failures.length - 50} additional issues omitted`);
  process.exitCode = 1;
} else {
  console.log(`SEO audit passed for ${uniquePageUrls.length} canonical pages across ${childSitemaps.length} sitemaps.`);
}
