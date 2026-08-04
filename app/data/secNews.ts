import { stripNewsHtml } from "../news-text";

export type SecFiledReleaseItem = {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  summary: string;
  category: string;
  provider: string;
};

function releaseTitle(html: string, companyName: string, filingDate: string): string {
  const emphasizedText = [...html.matchAll(/<font\b[^>]*font-weight:\s*(?:700|bold)[^>]*>([\s\S]*?)<\/font>/gi)].map((match) => match[1]);
  const candidates = [
    html.match(/<meta\b[^>]*(?:property|name)=["'](?:og:title|twitter:title)["'][^>]*content=["']([^"']+)["']/i)?.[1] ?? "",
    html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "",
    html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "",
    html.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "",
    html.match(/<p\b[^>]*>[\s\n\r]*(?:<[^>]+>[\s\n\r]*)*<(?:b|strong)\b[^>]*>([\s\S]*?)<\/(?:b|strong)>/i)?.[1] ?? "",
    ...emphasizedText,
  ].map((candidate) => stripNewsHtml(candidate).replace(/\s+/g, " ").trim())
    .filter((candidate) => candidate.length >= 12 && candidate.length <= 240)
    .filter((candidate) => !/^(?:document|exhibit(?:\s+99(?:\.\d+)?)?|press release|news release|untitled|form 8-k|for immediate release)$/i.test(candidate))
    .filter((candidate) => !/^(?:(?:nasdaq|nyse) symbol|[A-Z][a-z]+ \d{1,2}, \d{4}$)/i.test(candidate))
    .filter((candidate) => !/(?:font-size|font-family|list-style-type|q4default|prnews_)/i.test(candidate));
  return candidates[0] || `${companyName} official release filed ${filingDate}`;
}

function releaseSummary(html: string, title: string): string {
  const cleaned = stripNewsHtml(html).replace(/\s+/g, " ").trim();
  const withoutTitle = cleaned.toLowerCase().startsWith(title.toLowerCase()) ? cleaned.slice(title.length).trim() : cleaned;
  return withoutTitle.length > 420 ? `${withoutTitle.slice(0, 417).trimEnd()}…` : withoutTitle;
}

export function parseSecFiledPressReleases(submission: string, archiveRoot: string, companyName: string, filingDate: string): SecFiledReleaseItem[] {
  return [...submission.matchAll(/<DOCUMENT>([\s\S]*?)<\/DOCUMENT>/gi)].flatMap(([, document]) => {
    const type = document.match(/<TYPE>\s*([^\r\n<]+)/i)?.[1]?.trim() ?? "";
    const filename = document.match(/<FILENAME>\s*([^\r\n<]+)/i)?.[1]?.trim() ?? "";
    const html = document.match(/<TEXT>([\s\S]*?)<\/TEXT>/i)?.[1] ?? "";
    if (!/^(?:EX-99(?:\.\d+)?|6-K)$/i.test(type) || !filename || !html) return [];
    const plainText = stripNewsHtml(html);
    const looksLikeRelease = /\b(?:press release|news release|earnings release|financial results|quarterly results|announces|reports (?:first|second|third|fourth|quarter|full[- ]year|financial))\b/i.test(plainText);
    const looksLikeOtherExhibit = /\b(?:investor presentation|credit agreement|indenture|bylaws|articles of incorporation)\b/i.test(plainText.slice(0, 2_500));
    if (!looksLikeRelease || looksLikeOtherExhibit) return [];
    const title = releaseTitle(html, companyName, filingDate);
    let url = "";
    try { url = new URL(filename, `${archiveRoot}/`).toString(); } catch { return []; }
    return [{
      title,
      url,
      publishedAt: filingDate,
      source: `${companyName} official release filed with SEC`,
      summary: releaseSummary(html, title),
      category: "Company press release · SEC exhibit",
      provider: "SEC EDGAR Exhibit 99",
    }];
  });
}
