import { featuredDossiers } from "../../data/featuredDossiers";
import { researchUniverse } from "../../data/universe";
import { findCatalogCompany } from "../../../db/companyCatalog";

type NewsItem = {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
};

function decodeXml(value: string): string {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tag(item: string, name: string): string {
  return decodeXml(item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1]?.trim() ?? "");
}

function parseRss(xml: string): NewsItem[] {
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map(([item]) => {
    const title = tag(item, "title").replace(/\s+-\s+[^-]+$/, "").trim();
    const source = tag(item, "source") || "Public news source";
    const url = tag(item, "link");
    const publishedAt = tag(item, "pubDate");
    return { title, source, url, publishedAt };
  }).filter((item) => item.title && /^https?:\/\//.test(item.url));
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

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "LearnWhatYouOwn/1.0 company-news reader" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`News feed returned ${response.status}.`);
    return response.text();
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
  }));
}

async function officialNews(newsroomUrl: string | null, feedUrl: string | null): Promise<NewsItem[]> {
  if (feedUrl) return parseRss(await fetchText(feedUrl));
  if (!newsroomUrl) return [];
  return parseNewsroomHtml(await fetchText(newsroomUrl), newsroomUrl);
}

function unique(items: NewsItem[], limit: number): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
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
  const newsroomFeedUrl = dossier?.newsroomFeedUrl ?? null;
  const displayQuery = `"${companyName.replace(/\b(INC|INCORPORATED|LTD|PLC|CORP|CORPORATION)\.?\b/gi, "").replace(/\s+/g, " ").trim()}" ${ticker}`;

  const [officialResult, publicResult] = await Promise.allSettled([
    officialNews(newsroomUrl, newsroomFeedUrl),
    bingNews(displayQuery),
  ]);
  const official = officialResult.status === "fulfilled" ? unique(officialResult.value, 5) : [];
  const officialTitles = new Set(official.map((item) => item.title.toLowerCase()));
  const publicNews = publicResult.status === "fulfilled"
    ? unique(publicResult.value.filter((item) => !officialTitles.has(item.title.toLowerCase())), 8)
    : [];

  return Response.json({
    ticker,
    companyName,
    newsroomUrl,
    official,
    public: publicNews,
    updatedAt: new Date().toISOString(),
    partial: officialResult.status === "rejected" || publicResult.status === "rejected",
  }, { headers: { "cache-control": "public, max-age=300, stale-while-revalidate=900" } });
}
