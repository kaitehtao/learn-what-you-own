const originArgument = process.argv.find((argument) => argument.startsWith("--origin="));
const origin = new URL(originArgument?.slice("--origin=".length) || "https://learnwhatyouown.com");
const canonicalOrigin = `${origin.protocol}//${origin.host}`;
const failures = [];
const exhaustive = process.argv.includes("--all");
const companySampleArgument = process.argv.find((argument) => argument.startsWith("--company-sample="));
const companySampleSize = Math.max(1, Number.parseInt(companySampleArgument?.slice("--company-sample=".length) || "10", 10));
const requestDelayMs = 1_000;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function locations(xml) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]
    .replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<").replaceAll("&gt;", ">"));
}

async function getWithoutRedirect(url) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(20_000),
        headers: { "user-agent": "LearnWhatYouOwn-SEO-Audit/1.1" },
      });
      if (![429, 502, 503, 504].includes(response.status) || attempt === 4) return response;
    } catch (error) {
      if (attempt === 4) throw error;
    }
    await delay(1_000 * attempt);
  }
  throw new Error(`Unable to fetch ${url}`);
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

const nonCompanyUrls = uniquePageUrls.filter((url) => !new URL(url).pathname.startsWith("/company/"));
const companyUrls = uniquePageUrls.filter((url) => new URL(url).pathname.startsWith("/company/"));
const sampledCompanyUrls = exhaustive || companyUrls.length <= companySampleSize
  ? companyUrls
  : Array.from({ length: companySampleSize }, (_, index) => companyUrls[Math.floor(index * companyUrls.length / companySampleSize)]);
const auditedPageUrls = [...nonCompanyUrls, ...sampledCompanyUrls];

const titleOwners = new Map();
for (const [pageIndex, pageUrl] of auditedPageUrls.entries()) {
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
    if ((pageIndex + 1) % 10 === 0 || pageIndex + 1 === auditedPageUrls.length) {
      console.log(`Audited ${pageIndex + 1}/${auditedPageUrls.length} public pages.`);
    }
    await delay(requestDelayMs);
}

const insecureOrigin = `http://${origin.host}/`;
const insecureResponse = await getWithoutRedirect(insecureOrigin);
if (![301, 308].includes(insecureResponse.status)) failures.push(`${insecureOrigin} returned ${insecureResponse.status}; expected a permanent HTTPS redirect`);

if (failures.length) {
  console.error(`SEO audit failed with ${failures.length} issue${failures.length === 1 ? "" : "s"}:`);
  for (const failure of failures.slice(0, 50)) console.error(`- ${failure}`);
  if (failures.length > 50) console.error(`- ${failures.length - 50} additional issues omitted`);
  process.exitCode = 1;
} else {
  const scope = exhaustive ? "all" : `${auditedPageUrls.length} sampled from ${uniquePageUrls.length}`;
  console.log(`SEO audit passed for ${scope} canonical pages across ${childSitemaps.length} sitemaps.`);
}
