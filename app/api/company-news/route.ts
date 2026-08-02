import { featuredDossiers, type FeaturedDossier } from "../../data/featuredDossiers";
import { researchUniverse } from "../../data/universe";
import { findCatalogCompany } from "../../../db/companyCatalog";
import { getSecCompany } from "../../data/secCompanies.generated";

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

type OfficialSourceHealth = {
  source: "company" | "sec";
  status: "working" | "empty" | "unavailable" | "not-configured" | "not-applicable";
  records: number;
  url: string | null;
};

const verifiedOfficialFeeds: Record<string, string> = {
  AAPL: "https://www.apple.com/newsroom/rss-feed.rss",
  MSFT: "https://news.microsoft.com/source/feed/",
  NVDA: "https://nvidianews.nvidia.com/releases.xml",
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
    const source = tag(item, "source") || fallbackSource;
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

function stripHtml(value: string): string {
  return decodeXml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function parseNewsroomHtml(html: string, newsroomUrl: string): NewsItem[] {
  const source = new URL(newsroomUrl).hostname.replace(/^www\./, "");
  return [...html.matchAll(/<div[^>]+class=["'][^"']*\brelease\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi)].flatMap(([, block]) => {
    const anchor = block.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!anchor) return [];
    const date = block.match(/<p[^>]+class=["'][^"']*\bdate\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "";
    return [{
      title: stripHtml(anchor[2]),
      url: new URL(decodeXml(anchor[1]), newsroomUrl).toString(),
      publishedAt: stripHtml(date),
      source,
    }];
  }).filter((item) => item.title && /^https:\/\//.test(item.url));
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

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      headers: {
        "accept": "application/atom+xml, application/rss+xml, application/xml, text/html;q=0.9, */*;q=0.8",
        "user-agent": "LearnWhatYouOwn/1.0 research@learnwhatyouown.com",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`News feed returned ${response.status}.`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "LearnWhatYouOwn/1.0 research@learnwhatyouown.com",
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
    timespan: "7d",
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

async function companyOfficialNews(companyName: string, newsroomUrl: string | null, feedUrl: string | null): Promise<{ items: NewsItem[]; health: OfficialSourceHealth }> {
  const source = `${companyName} official newsroom`;
  const primaryUrl = feedUrl || newsroomUrl;
  if (!primaryUrl) return { items: [], health: { source: "company", status: "not-configured", records: 0, url: null } };
  try {
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
    if (direct.length) return { items: direct, health: { source: "company", status: "working", records: direct.length, url: newsroomUrl } };
    for (const discoveredFeed of discoverFeedUrls(html, newsroomUrl!)) {
      try {
        const items = parseRss(await fetchText(discoveredFeed), source);
        if (items.length) return { items, health: { source: "company", status: "working", records: items.length, url: discoveredFeed } };
      } catch { /* Continue through alternate official feeds. */ }
    }
    return { items: [], health: { source: "company", status: "empty", records: 0, url: newsroomUrl } };
  } catch {
    return { items: [], health: { source: "company", status: "unavailable", records: 0, url: primaryUrl } };
  }
}

async function secOfficialNews(cik: string | null): Promise<{ items: NewsItem[]; health: OfficialSourceHealth }> {
  if (!cik) return { items: [], health: { source: "sec", status: "not-applicable", records: 0, url: null } };
  const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(cik)}&owner=exclude&count=40&output=atom`;
  try {
    const items = parseRss(await fetchText(url), "SEC EDGAR official filing").map((item) => ({ ...item, source: "SEC EDGAR official filing", provider: "SEC EDGAR" }));
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
    if (source.href.includes("sec.gov") || !/(company|earnings|press release|operational release|results|investor relations)/i.test(classification)) return [];
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
  const newsroomUrl = dossier?.newsroomUrl ?? dossier?.sources.find((source) => source.meta.toLowerCase().includes("company"))?.href ?? null;
  const newsroomFeedUrl = dossier?.newsroomFeedUrl ?? verifiedOfficialFeeds[ticker] ?? null;
  const cik = catalogCompany?.cik || getSecCompany(ticker)?.cik || null;
  const displayQuery = `"${companyName.replace(/\b(INC|INCORPORATED|LTD|PLC|CORP|CORPORATION)\.?\b/gi, "").replace(/\s+/g, " ").trim()}" ${ticker}`;

  const publicSources = [
    { provider: "Bing News", load: () => bingNews(displayQuery) },
    { provider: "Google News", load: () => googleNews(displayQuery) },
    { provider: "GDELT", load: () => gdeltNews(displayQuery) },
  ];
  const [companyOfficial, secOfficial, publicResults] = await Promise.all([
    companyOfficialNews(companyName, newsroomUrl, newsroomFeedUrl),
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
  const fulfilledPublicGroups = publicResults.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  const publicNews = mergePublicSources(fulfilledPublicGroups, 18)
    .filter((item) => !officialTitles.has(item.title.toLowerCase()));
  const providers = publicSources.flatMap((source, index) => {
    const result = publicResults[index];
    return result.status === "fulfilled" && result.value.length ? [source.provider] : [];
  });
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
