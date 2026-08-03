import { featuredDossiers, type FeaturedDossier } from "../../data/featuredDossiers";
import { researchUniverse } from "../../data/universe";
import { findCatalogCompany } from "../../../db/companyCatalog";
import { getSecCompany } from "../../data/secCompanies.generated";
import { stripNewsHtml } from "../../news-text";
import type { SecSubmissions } from "../../data/secShareFacts";

type NewsItem = {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  summary?: string;
  category?: string;
  readingMinutes?: number;
  provider?: string;
};

type GdeltArticle = {
  title?: string;
  url?: string;
  seendate?: string;
  domain?: string;
  sourcecountry?: string;
};

type TradingViewArticle = {
  published?: number;
  source?: string;
  storyPath?: string;
  title?: string;
};

type PalantirPressRelease = {
  Body?: string;
  Headline?: string;
  LinkToDetailPage?: string;
  PressReleaseDate?: string;
  ShortDescription?: string;
};

type PalantirPressReleaseResponse = {
  GetPressReleaseListResult?: PalantirPressRelease[];
};

type OfficialSourceHealth = {
  source: "company" | "sec";
  status: "working" | "empty" | "unavailable" | "not-configured" | "not-applicable";
  records: number;
  url: string | null;
};

const verifiedOfficialFeeds: Record<string, string> = {
  AAPL: "https://www.apple.com/newsroom/rss-feed.rss",
  MSFT: "https://news.microsoft.com/source/feed/",
  NFLX: "https://about.netflix.com/en/feed.xml",
  NVDA: "https://nvidianews.nvidia.com/releases.xml",
  PLD: "https://ir.prologis.com/news-events/press-releases/rss",
};

// Prefer issuer-maintained release archives over broad corporate newsroom
// landing pages. These URLs are verified entry points for the live archive and
// also give the fallback indexer an exact official host to constrain against.
const verifiedOfficialNewsrooms: Record<string, string> = {
  AMAT: "https://ir.appliedmaterials.com/news-releases/",
  AXP: "https://ir.americanexpress.com/news/investor-relations-news/default.aspx",
  MCD: "https://corporate.mcdonalds.com/corpmcd/our-stories/press-releases.html",
  PLD: "https://ir.prologis.com/press-releases",
  SNDK: "https://investor.sandisk.com/news-events/news-releases",
  TJX: "https://investor.tjx.com/investors/press-releases",
  TMO: "https://ir.thermofisher.com/investors/news-events/news/default.aspx",
  TXN: "https://www.ti.com/about-ti/newsroom.html",
};

const verifiedOfficialStructuredSources: Record<string, string> = {
  // Dell's public newsroom is rendered from an AEM JSON model. The HTML
  // landing page does not contain the release cards, so parse the issuer's
  // own structured model instead of reporting a false empty archive.
  DELL: "https://www.dell.com/en-us/dt/corporate/newsroom.model.json",
};

function decodeXml(value: string): string {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function tag(item: string, name: string): string {
  return decodeXml(item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1]?.trim() ?? "");
}

function parseRss(xml: string, fallbackSource = "Public news source"): NewsItem[] {
  const rssItems = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map(([item]) => {
    const title = tag(item, "title").replace(/\s+-\s+[^-]+$/, "").trim();
    const source = tag(item, "source") || tag(item, "dc:creator") || fallbackSource;
    const url = tag(item, "link");
    const publishedAt = tag(item, "pubDate");
    const summary = stripHtml(tag(item, "description"));
    return { title, source, url, publishedAt, summary };
  }).filter((item) => item.title && /^https?:\/\//.test(item.url));

  const atomItems = [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map(([entry]) => {
    const linkAttributes = entry.match(/<link\b([^>]*\brel=["']alternate["'][^>]*)\/?\s*>/i)?.[1]
      ?? entry.match(/<link\b([^>]*)\/?\s*>/i)?.[1]
      ?? "";
    const filingType = stripHtml(tag(entry, "filing-type"));
    const formName = stripHtml(tag(entry, "form-name"));
    const itemDescription = stripHtml(tag(entry, "items-desc"));
    const summary = stripHtml(tag(entry, "summary"));
    const isSecFiling = Boolean(filingType || formName || itemDescription);
    const category = filingType || htmlAttribute(entry.match(/<category\b([^>]*)\/?\s*>/i)?.[1] ?? "", "term");
    return {
      title: isSecFiling ? [filingType || "SEC filing", formName, itemDescription].filter(Boolean).join(" · ") : stripHtml(tag(entry, "title")),
      url: htmlAttribute(linkAttributes, "href"),
      publishedAt: stripHtml(tag(entry, "updated")) || stripHtml(tag(entry, "filing-date")),
      source: isSecFiling ? "SEC EDGAR official filing" : fallbackSource,
      summary,
      category: category || undefined,
    };
  }).filter((item) => item.title && /^https?:\/\//.test(item.url));

  return [...rssItems, ...atomItems];
}

function discoverFeedUrls(html: string, newsroomUrl: string): string[] {
  const candidates = [
    ...[...html.matchAll(/<link\b([^>]+)>/gi)].flatMap(([, attributes]) => {
      const type = htmlAttribute(attributes, "type").toLowerCase();
      const rel = htmlAttribute(attributes, "rel").toLowerCase();
      return rel.includes("alternate") && /(rss|atom|xml)/.test(type) ? [htmlAttribute(attributes, "href")] : [];
    }),
    ...[...html.matchAll(/<a\b([^>]+)>/gi)].flatMap(([, attributes]) => {
      const href = htmlAttribute(attributes, "href");
      return /(?:rss|atom|feed)(?:[./?]|$)/i.test(href) ? [href] : [];
    }),
  ];
  return [...new Set(candidates.flatMap((href) => {
    try { return [new URL(href, newsroomUrl).toString()]; } catch { return []; }
  }))].slice(0, 3);
}

const stripHtml = stripNewsHtml;

function releaseDate(value: string): string {
  const text = stripHtml(value);
  return text.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2},?\s+20\d{2}\b/i)?.[0]
    ?? text.match(/\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+20\d{2}\b/i)?.[0]
    ?? text.match(/\b20\d{2}-\d{2}-\d{2}(?:T[^\s"'<]+)?\b/)?.[0]
    ?? text.match(/\b\d{1,2}\/\d{1,2}\/20\d{2}(?:\s+\d{1,2}:\d{2}:\d{2})?\b/)?.[0]
    ?? "";
}

function isReleaseContext(value: string): boolean {
  return /(?:press|news|media|earnings|financial|operational)\s+(?:release|announcement|results)|\bpressroom\b/i.test(stripHtml(value));
}

function parseNewsroomHtml(html: string, newsroomUrl: string): NewsItem[] {
  const source = new URL(newsroomUrl).hostname.replace(/^www\./, "");
  const releaseBlocks = [...html.matchAll(/<div[^>]+class=["'][^"']*\brelease\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi)].flatMap(([, block]) => {
    const anchor = block.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!anchor) return [];
    return [{
      title: stripHtml(anchor[2]),
      url: new URL(decodeXml(anchor[1]), newsroomUrl).toString(),
      publishedAt: releaseDate(block),
      source,
      category: "Company press release",
    }];
  });

  const attributedCards = [...html.matchAll(/<([a-z][\w-]*)\b([^>]*(?:\bhref|\burl)=["'][^"']+["'][^>]*)>/gi)].flatMap((match) => {
    const attributes = match[2];
    const title = htmlAttribute(attributes, "heading") || htmlAttribute(attributes, "data-title");
    const href = htmlAttribute(attributes, "href") || htmlAttribute(attributes, "url");
    if (!title || !href || !isReleaseContext(attributes)) return [];
    try {
      return [{
        title: stripHtml(title),
        url: new URL(href, newsroomUrl).toString(),
        publishedAt: releaseDate(htmlAttribute(attributes, "description") || attributes),
        source,
        category: "Company press release",
      }];
    } catch {
      return [];
    }
  });

  const anchors = [...html.matchAll(/<a\b([^>]+)>([\s\S]*?)<\/a>/gi)].flatMap((match) => {
    const attributes = match[1];
    const href = htmlAttribute(attributes, "href");
    const title = stripHtml(match[2]) || htmlAttribute(attributes, "aria-label") || htmlAttribute(attributes, "title");
    if (!href || title.length < 18 || /^(?:all |latest )?(?:news|press|media|releases?|read more|learn more)$/i.test(title)) return [];
    const start = Math.max(0, (match.index ?? 0) - 500);
    const context = html.slice(start, (match.index ?? 0) + match[0].length + 500);
    const publishedAt = releaseDate(context);
    if (!publishedAt || !isReleaseContext(`${href} ${context}`)) return [];
    try {
      return [{ title, url: new URL(href, newsroomUrl).toString(), publishedAt, source, category: "Company press release" }];
    } catch {
      return [];
    }
  });

  return unique([...releaseBlocks, ...attributedCards, ...anchors].filter((item) => item.title && /^https:\/\//.test(item.url)), 100);
}

function htmlAttribute(attributes: string, name: string): string {
  return decodeXml(attributes.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1]?.trim() ?? "");
}

function titleCase(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === "ai-ml") return "AI / ML";
  if (normalized === "ai-infrastructure") return "AI Infrastructure";
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseCoreWeaveNewsroom(html: string, newsroomUrl: string): NewsItem[] {
  return [...html.matchAll(/<div\s+([^>]*\bdata-content-type=["']press-release["'][^>]*)><\/div>[\s\S]{0,3500}?<a[^>]+\bhref=["']([^"']+)["'][^>]*\bclass=["'][^"']*\bresource__data-link\b[^"']*["'][^>]*>/gi)].map(([, attributes, href]) => {
    const readingMinutes = Number.parseInt(htmlAttribute(attributes, "data-time-to-read"), 10);
    return {
      title: htmlAttribute(attributes, "data-title"),
      url: new URL(decodeXml(href), newsroomUrl).toString(),
      publishedAt: htmlAttribute(attributes, "data-date-start"),
      source: "CoreWeave official newsroom",
      summary: htmlAttribute(attributes, "data-excerpt"),
      category: titleCase(htmlAttribute(attributes, "data-topic") || "Company update"),
      readingMinutes: Number.isFinite(readingMinutes) && readingMinutes > 0 ? readingMinutes : undefined,
    };
  }).filter((item) => item.title && /^https:\/\//.test(item.url));
}

function parseDellAemNewsroom(payload: unknown): NewsItem[] {
  const items: NewsItem[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    const text = record.text && typeof record.text === "object" ? record.text as Record<string, unknown> : null;
    const link = record.link && typeof record.link === "object" ? record.link as Record<string, unknown> : null;
    const title = typeof text?.title === "string" ? stripHtml(text.title) : "";
    const publishedAt = typeof text?.label === "string" ? releaseDate(text.label) : "";
    const url = typeof link?.url === "string" ? link.url : "";
    if (title && publishedAt && /\/newsroom\/announcements\/detailpage\.press-releases/i.test(url)) {
      items.push({
        title,
        publishedAt,
        url,
        source: "Dell Technologies official newsroom",
        summary: "Company-published release indexed from Dell Technologies' official newsroom data model.",
        category: "Company press release",
        provider: "Dell AEM newsroom",
      });
    }
    for (const nested of Object.values(record)) {
      if (Array.isArray(nested)) nested.forEach(visit);
      else if (nested && typeof nested === "object") visit(nested);
    }
  };
  visit(payload);
  return unique(items.sort((left, right) => new Date(right.publishedAt).valueOf() - new Date(left.publishedAt).valueOf()), 100);
}

function parsePalantirNewsroom(html: string, newsroomUrl: string): NewsItem[] {
  const serialized = html.match(/<script id=["']__NEXT_DATA__["'] type=["']application\/json["']>([\s\S]*?)<\/script>/i)?.[1];
  if (!serialized) return [];

  try {
    const payload = JSON.parse(decodeXml(serialized)) as unknown;
    const releases: NewsItem[] = [];
    const visit = (value: unknown) => {
      if (!value || typeof value !== "object") return;
      const record = value as Record<string, unknown>;
      const fields = record.fields && typeof record.fields === "object" ? record.fields as Record<string, unknown> : null;
      if (fields) {
        const link = fields.link && typeof fields.link === "object" ? fields.link as Record<string, unknown> : null;
        const linkFields = link?.fields && typeof link.fields === "object" ? link.fields as Record<string, unknown> : null;
        const headline = typeof fields.headline === "string" ? fields.headline : "";
        const publishedAt = typeof fields.date === "string" ? fields.date : "";
        const href = typeof linkFields?.url === "string" ? linkFields.url : "";
        if (headline && publishedAt && /^https?:\/\//.test(href)) {
          releases.push({
            title: headline,
            publishedAt,
            url: new URL(href, newsroomUrl).toString(),
            source: "Palantir official newsroom",
            category: "Company press release",
          });
        }
      }
      for (const nested of Object.values(record)) {
        if (Array.isArray(nested)) nested.forEach(visit);
        else if (nested && typeof nested === "object") visit(nested);
      }
    };
    visit(payload);
    return unique(releases.sort((left, right) => new Date(right.publishedAt).valueOf() - new Date(left.publishedAt).valueOf()), 100);
  } catch {
    return [];
  }
}

function parsePalantirInvestorReleases(payload: PalantirPressReleaseResponse, investorUrl: string, source = "Palantir Investor Relations"): NewsItem[] {
  return (payload.GetPressReleaseListResult ?? []).flatMap((release) => {
    const title = release.Headline?.trim() ?? "";
    const href = release.LinkToDetailPage?.trim() ?? "";
    if (!title || !href) return [];
    const summary = stripHtml(release.ShortDescription || release.Body || "");
    return [{
      title,
      publishedAt: release.PressReleaseDate ?? "",
      url: new URL(href, investorUrl).toString(),
      source,
      summary: summary.length > 420 ? `${summary.slice(0, 417).trimEnd()}…` : summary,
      category: "Company press release",
      provider: "Palantir IR",
    }];
  });
}

async function fetchText(url: string, userAgent = "LearnWhatYouOwn/1.0 research@learnwhatyouown.com", timeoutMs = 8_000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        "accept": "application/atom+xml, application/rss+xml, application/xml, text/html;q=0.9, */*;q=0.8",
        "user-agent": userAgent,
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`News feed returned ${response.status}.`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson<T>(url: string, userAgent = "LearnWhatYouOwn/1.0 research@learnwhatyouown.com", timeoutMs = 8_000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": userAgent,
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`News API returned ${response.status}.`);
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function bingNews(query: string): Promise<NewsItem[]> {
  const params = new URLSearchParams({ q: query, format: "rss" });
  return parseRss(await fetchText(`https://www.bing.com/news/search?${params}`)).map((item) => ({
    ...item,
    url: item.url.replace(/^http:\/\/www\.bing\.com/i, "https://www.bing.com"),
    source: item.source === "Public news source" ? "Bing News index" : item.source,
    provider: "Bing News",
  }));
}

async function googleNews(query: string): Promise<NewsItem[]> {
  const params = new URLSearchParams({ q: query, hl: "en-US", gl: "US", ceid: "US:en" });
  return parseRss(await fetchText(`https://news.google.com/rss/search?${params}`)).map((item) => ({
    ...item,
    source: item.source === "Public news source" ? "Google News index" : item.source,
    provider: "Google News",
  }));
}

async function tradingViewNews(ticker: string, exchange: string): Promise<NewsItem[]> {
  const params = new URLSearchParams({ category: "stock", lang: "en", symbol: `${exchange}:${ticker}` });
  const userAgent = "Mozilla/5.0 (compatible; LearnWhatYouOwn/1.0; +https://learnwhatyouown.com)";
  const payload = await fetchJson<TradingViewArticle[]>(`https://news-headlines.tradingview.com/headlines/?${params}`, userAgent, 12_000);
  return payload.flatMap((article) => {
    if (!article.title || !article.storyPath) return [];
    return [{
      title: article.title.trim(),
      url: new URL(article.storyPath, "https://www.tradingview.com").toString(),
      publishedAt: article.published ? new Date(article.published * 1_000).toISOString() : "",
      source: article.source || "TradingView indexed publisher",
      provider: "TradingView",
    }];
  });
}

function gdeltDate(value: string | undefined): string {
  if (!value) return "";
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z` : value;
}

async function gdeltNews(query: string): Promise<NewsItem[]> {
  const params = new URLSearchParams({
    query,
    mode: "ArtList",
    maxrecords: "25",
    format: "json",
    sort: "HybridRel",
    timespan: "30d",
  });
  const payload = await fetchJson<{ articles?: GdeltArticle[] }>(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`);
  return (payload.articles ?? []).flatMap((article) => {
    if (!article.title || !article.url || !/^https?:\/\//.test(article.url)) return [];
    return [{
      title: article.title.trim(),
      url: article.url,
      publishedAt: gdeltDate(article.seendate),
      source: article.domain || article.sourcecountry || "GDELT indexed publisher",
      provider: "GDELT",
    }];
  });
}

async function retryOnce<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch {
    return load();
  }
}

const corporateReleasePublishers = /(?:business\s*wire|pr\s*newswire|globe\s*newswire|access\s*newswire|accesswire|newsfile|ein\s*presswire|issuer\s*direct|investor\s*brand\s*network)/i;
const corporateReleaseHosts = /(?:^|\.)(?:palantir\.com|businesswire\.com|prnewswire\.com|globenewswire\.com|accesswire\.com|newsfilecorp\.com|einpresswire\.com)$/i;

function isIndependentCoverage(item: NewsItem): boolean {
  if (corporateReleasePublishers.test(`${item.source} ${item.provider ?? ""}`)) return false;
  try {
    const hostname = new URL(item.url).hostname.replace(/^www\./, "");
    if (corporateReleaseHosts.test(hostname)) return false;
  } catch {
    return false;
  }
  return item.source !== "SEC EDGAR official filing" && item.category !== "Company press release";
}

async function palantirOfficialNews(investorUrl: string): Promise<NewsItem[]> {
  const year = new Date().getUTCFullYear();
  const endpoint = new URL("/feed/PressRelease.svc/GetPressReleaseList", investorUrl);
  endpoint.search = new URLSearchParams({
    languageId: "1",
    bodyType: "1",
    year: String(year),
    includeTags: "true",
    pressReleaseDateFilter: "1",
  }).toString();
  const current = parsePalantirInvestorReleases(await fetchJson<PalantirPressReleaseResponse>(endpoint.toString()), investorUrl);

  try {
    const historicalUrl = "https://www.palantir.com/newsroom/press-releases/";
    const historical = parsePalantirNewsroom(await fetchText(historicalUrl), historicalUrl);
    return unique([...current, ...historical].sort((left, right) => new Date(right.publishedAt).valueOf() - new Date(left.publishedAt).valueOf()), 100);
  } catch {
    return unique(current, 100);
  }
}

async function q4OfficialNews(companyName: string, newsroomUrl: string): Promise<NewsItem[]> {
  const endpoint = new URL("/feed/PressRelease.svc/GetPressReleaseList", newsroomUrl);
  endpoint.search = new URLSearchParams({
    languageId: "1",
    bodyType: "1",
    year: String(new Date().getUTCFullYear()),
    includeTags: "true",
    pressReleaseDateFilter: "1",
  }).toString();
  const payload = await fetchJson<PalantirPressReleaseResponse>(endpoint.toString());
  return parsePalantirInvestorReleases(payload, newsroomUrl, `${companyName} Investor Relations`);
}

async function indexedOfficialNews(companyName: string, newsroomUrl: string): Promise<NewsItem[]> {
  const hostname = new URL(newsroomUrl).hostname;
  const pressItems = (await googleNews(`site:${hostname} "press release" when:365d`))
    .filter((item) => /[a-z0-9]{3}/i.test(item.title));
  let items = pressItems;
  if (pressItems.length < 2) {
    const generalItems = await googleNews(`site:${hostname} "${companyName.replace(/\b(?:INC|INCORPORATED|LTD|PLC|CORP|CORPORATION|CLASS [A-Z])\.?\b/gi, "").replace(/\s+/g, " ").trim()}" when:365d`);
    items = [...pressItems, ...generalItems];
  }
  return unique(items.flatMap((item) => {
    if (/\b(?:careers?|jobs?|newsroom|press releases?|media center|home page)\b/i.test(item.title)) return [];
    if (/^(?:how|why|what|meet|highlights?|shareholders?|search|for (?:himself|herself|patients?|families?))\b/i.test(item.title)) return [];
    return [{
      ...item,
      source: `${companyName} official newsroom`,
      summary: "Company-published release discovered from the issuer's configured official newsroom host.",
      category: "Company press release",
      provider: "Official-domain index",
    }];
  }), 30);
}

async function companyOfficialNews(ticker: string, companyName: string, newsroomUrl: string | null, feedUrl: string | null): Promise<{ items: NewsItem[]; health: OfficialSourceHealth }> {
  const source = `${companyName} official newsroom`;
  const primaryUrl = feedUrl || newsroomUrl;
  if (!primaryUrl) return { items: [], health: { source: "company", status: "not-configured", records: 0, url: null } };
  try {
    const structuredSource = verifiedOfficialStructuredSources[ticker];
    if (structuredSource) {
      const items = ticker === "DELL" ? parseDellAemNewsroom(await fetchJson<unknown>(structuredSource)) : [];
      if (items.length) return { items, health: { source: "company", status: "working", records: items.length, url: structuredSource } };
    }
    if (newsroomUrl && new URL(newsroomUrl).hostname.replace(/^www\./, "") === "investors.palantir.com") {
      const items = await palantirOfficialNews(newsroomUrl);
      return { items, health: { source: "company", status: items.length ? "working" : "empty", records: items.length, url: newsroomUrl } };
    }
    if (feedUrl) {
      const items = parseRss(await fetchText(feedUrl), source);
      return { items, health: { source: "company", status: items.length ? "working" : "empty", records: items.length, url: feedUrl } };
    }
    const html = await fetchText(newsroomUrl!);
    const hostname = new URL(newsroomUrl!).hostname.replace(/^www\./, "");
    const direct = hostname === "coreweave.com"
      ? parseCoreWeaveNewsroom(html, newsroomUrl!)
      : hostname === "palantir.com"
        ? parsePalantirNewsroom(html, newsroomUrl!)
        : parseNewsroomHtml(html, newsroomUrl!);
    let discovered: NewsItem[] = [];
    for (const discoveredFeed of discoverFeedUrls(html, newsroomUrl!)) {
      try {
        const items = parseRss(await fetchText(discoveredFeed), source);
        if (items.length) {
          discovered = items;
          break;
        }
      } catch { /* Continue through alternate official feeds. */ }
    }
    let q4: NewsItem[] = [];
    if (direct.length + discovered.length < 2) {
      try { q4 = await q4OfficialNews(companyName, newsroomUrl!); } catch { /* This issuer does not use a compatible Q4 feed. */ }
    }
    let indexed: NewsItem[] = [];
    if (direct.length + discovered.length + q4.length < 2) {
      try { indexed = await indexedOfficialNews(companyName, newsroomUrl!); } catch { /* The official-domain index is a last-resort discovery path. */ }
    }
    const items = unique([...direct, ...discovered, ...q4, ...indexed].sort((left, right) => new Date(right.publishedAt).valueOf() - new Date(left.publishedAt).valueOf()), 100);
    return { items, health: { source: "company", status: items.length ? "working" : "empty", records: items.length, url: newsroomUrl } };
  } catch {
    if (newsroomUrl) {
      try {
        const items = await indexedOfficialNews(companyName, newsroomUrl);
        if (items.length) return { items, health: { source: "company", status: "working", records: items.length, url: newsroomUrl } };
      } catch { /* Preserve the unavailable status when both direct and indexed discovery fail. */ }
    }
    return { items: [], health: { source: "company", status: "unavailable", records: 0, url: primaryUrl } };
  }
}

async function secOfficialNews(cik: string | null): Promise<{ items: NewsItem[]; health: OfficialSourceHealth }> {
  if (!cik) return { items: [], health: { source: "sec", status: "not-applicable", records: 0, url: null } };
  const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
  try {
    const payload = await fetchJson<SecSubmissions>(url);
    const recent = payload.filings?.recent;
    const items = (recent?.form ?? []).slice(0, 100).flatMap((form, index): NewsItem[] => {
      const accession = recent?.accessionNumber?.[index] ?? "";
      const primaryDocument = recent?.primaryDocument?.[index] ?? "";
      if (!accession || !primaryDocument) return [];
      const archiveRoot = `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession.replaceAll("-", "")}`;
      return [{
        title: `SEC ${form}${recent?.reportDate?.[index] ? ` · Period ${recent.reportDate[index]}` : ""}`,
        url: `${archiveRoot}/${primaryDocument}`,
        publishedAt: recent?.filingDate?.[index] ?? "",
        source: "SEC EDGAR official filing",
        summary: `Official ${form} filing submitted by the issuer to the SEC.`,
        category: form,
        provider: "SEC EDGAR submissions",
      }];
    });
    return { items, health: { source: "sec", status: items.length ? "working" : "empty", records: items.length, url } };
  } catch {
    return { items: [], health: { source: "sec", status: "unavailable", records: 0, url } };
  }
}

function unique(items: NewsItem[], limit: number): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const titleKey = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const key = item.source === "SEC EDGAR official filing" ? item.url : titleKey;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

function curatedCompanyReleases(dossier: FeaturedDossier | undefined): NewsItem[] {
  if (!dossier) return [];
  return dossier.sources.flatMap((source) => {
    const classification = `${source.title} ${source.meta}`;
    const isArchiveOrFiling = /(?:SEC|filing|10-[KQ]|annual report|events?|investor relations|archive|presentation|webcast)/i.test(classification);
    if (source.href.includes("sec.gov") || isArchiveOrFiling || !/(?:earnings|press|operational) release|results/i.test(classification)) return [];
    const dateText = source.meta.match(/(?:Filed|Published|release|materials|event|results)\s*[·:]?\s*([A-Z][a-z]+ \d{1,2}, \d{4})/i)?.[1] ?? "";
    return [{
      title: source.title,
      url: source.href,
      publishedAt: dateText,
      source: `${dossier.ticker} curated company source`,
      summary: source.excerpt,
      category: "Company primary material",
      provider: "Editorial source registry",
    }];
  });
}

function mergePublicSources(groups: NewsItem[][], limit: number): NewsItem[] {
  const queues = groups.map((group) => unique(group, 30));
  const merged: NewsItem[] = [];
  const seen = new Set<string>();
  while (merged.length < limit && queues.some((queue) => queue.length)) {
    for (const queue of queues) {
      const item = queue.shift();
      if (!item) continue;
      const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
      if (merged.length === limit) break;
    }
  }
  return merged;
}

export async function GET(request: Request) {
  const ticker = new URL(request.url).searchParams.get("ticker")?.trim().toUpperCase() ?? "";
  if (!/^[A-Z0-9.-]{1,12}$/.test(ticker)) return Response.json({ error: "Choose a valid ticker." }, { status: 400 });

  const universeCompany = researchUniverse.find((company) => company.ticker === ticker);
  const catalogCompany = await findCatalogCompany(ticker);
  if (!universeCompany && !catalogCompany) return Response.json({ error: "Ticker is not in the research universe." }, { status: 404 });

  const dossier = featuredDossiers[ticker];
  const companyName = catalogCompany?.name || universeCompany?.name || ticker;
  const newsroomUrl = verifiedOfficialNewsrooms[ticker]
    ?? dossier?.newsroomUrl
    ?? dossier?.sources.find((source) => source.meta.toLowerCase().includes("company"))?.href
    ?? null;
  const newsroomFeedUrl = verifiedOfficialFeeds[ticker] ?? dossier?.newsroomFeedUrl ?? null;
  const cik = catalogCompany?.cik || getSecCompany(ticker)?.cik || null;
  const searchName = companyName
    .replace(/\b(CLASS\s+[A-Z]|COMMON STOCK)\b/gi, "")
    .replace(/\b(INC|INCORPORATED|LTD|PLC|CORP|CORPORATION)\.?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const searchAliases: Record<string, string> = { IBM: "IBM", IBKR: "Interactive Brokers", PLD: "Prologis", PLTR: "Palantir", SPCX: "SpaceX" };
  const displayQuery = searchAliases[ticker] ? `${searchAliases[ticker]} ${ticker}` : `"${searchName}" ${ticker}`;
  const tradingViewExchange = /NASDAQ/i.test(universeCompany?.exchange ?? "") ? "NASDAQ"
    : /NYSE/i.test(universeCompany?.exchange ?? "") ? "NYSE"
      : /AMEX|NYSEAMERICAN/i.test(universeCompany?.exchange ?? "") ? "AMEX"
        : "NASDAQ";

  const publicSources = [
    { provider: "Bing News", load: () => retryOnce(() => bingNews(displayQuery)) },
    { provider: "Google News", load: () => retryOnce(() => googleNews(`${displayQuery} when:30d`)) },
    { provider: "TradingView", load: () => retryOnce(() => tradingViewNews(ticker, tradingViewExchange)) },
    { provider: "GDELT", load: () => gdeltNews(displayQuery) },
  ];
  const [companyOfficial, secOfficial, publicResults] = await Promise.all([
    companyOfficialNews(ticker, companyName, newsroomUrl, newsroomFeedUrl),
    secOfficialNews(cik),
    Promise.allSettled(publicSources.map((source) => source.load())),
  ]);
  const companyReleases = unique([...companyOfficial.items, ...curatedCompanyReleases(dossier)].sort((left, right) => {
    const leftTime = new Date(left.publishedAt).valueOf();
    const rightTime = new Date(right.publishedAt).valueOf();
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  }), 100);
  const secFilings = unique(secOfficial.items.sort((left, right) => {
    const leftTime = new Date(left.publishedAt).valueOf();
    const rightTime = new Date(right.publishedAt).valueOf();
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  }), 100);
  const official = unique([...companyReleases, ...secFilings].sort((left, right) => {
    const leftTime = new Date(left.publishedAt).valueOf();
    const rightTime = new Date(right.publishedAt).valueOf();
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  }), 100);
  const officialTitles = new Set(official.map((item) => item.title.toLowerCase()));
  const independentPublicGroups = publicResults.map((result) => result.status === "fulfilled" ? result.value.filter(isIndependentCoverage) : []);
  const fulfilledPublicGroups = independentPublicGroups.filter((group) => group.length);
  const publicNews = mergePublicSources(fulfilledPublicGroups, 18)
    .filter((item) => !officialTitles.has(item.title.toLowerCase()));
  const providers = publicSources.flatMap((source, index) => independentPublicGroups[index]?.length ? [source.provider] : []);
  const unavailableProviders = publicSources.flatMap((source, index) => publicResults[index].status === "rejected" ? [source.provider] : []);

  return Response.json({
    ticker,
    companyName,
    newsroomUrl,
    companyReleases,
    secFilings,
    official,
    officialSources: [companyOfficial.health, secOfficial.health],
    public: publicNews,
    providers,
    unavailableProviders,
    updatedAt: new Date().toISOString(),
    partial: [companyOfficial.health, secOfficial.health].some((source) => source.status === "unavailable") || unavailableProviders.length > 0,
  }, { headers: { "cache-control": "public, max-age=300, stale-while-revalidate=900" } });
}
