"use client";

import { useEffect, useMemo, useState } from "react";

type NewsItem = { title: string; url: string; publishedAt: string; source: string; summary?: string; category?: string; readingMinutes?: number; provider?: string };
type NewsResponse = {
  official: NewsItem[];
  companyReleases: NewsItem[];
  secFilings: NewsItem[];
  public: NewsItem[];
  newsroomUrl: string | null;
  updatedAt: string;
  partial: boolean;
  providers: string[];
  unavailableProviders: string[];
  officialSources: { source: "company" | "sec"; status: "working" | "empty" | "unavailable" | "not-configured" | "not-applicable"; records: number; url: string | null }[];
  error?: string;
};

function dateLabel(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? "Date unavailable" : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function NewsList({ items, providers, empty }: { items: NewsItem[]; providers: string[]; empty: string }) {
  const [activeProvider, setActiveProvider] = useState("All sources");
  const filtered = activeProvider === "All sources" ? items : items.filter((item) => item.provider === activeProvider);
  if (items.length === 0) return <p className="news-empty">{empty}</p>;
  return <div className="external-news-archive">
    <div className="news-provider-filters" aria-label="Filter external coverage by news index">
      {["All sources", ...providers].map((provider) => <button type="button" className={activeProvider === provider ? "active" : ""} onClick={() => setActiveProvider(provider)} key={provider}>{provider}</button>)}
    </div>
    <div className="company-news-list">{filtered.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={`${item.url}-${item.title}`}>
      <span>{item.source}{item.provider ? ` · indexed by ${item.provider}` : ""}</span><h4>{item.title}</h4><small>{dateLabel(item.publishedAt)} · Open original publisher ↗</small>
    </a>)}</div>
    {filtered.length === 0 && <p className="news-empty">No current stories were returned by this source.</p>}
  </div>;
}

function OfficialNewsList({ items, empty, searchLabel = "SEARCH OFFICIAL RELEASES", linkLabel = "Expand to Read Full Press Release ↗" }: { items: NewsItem[]; empty: string; searchLabel?: string; linkLabel?: string }) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(10);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => `${item.title} ${item.summary ?? ""} ${item.category ?? ""}`.toLowerCase().includes(normalized));
  }, [items, query]);

  if (items.length === 0) return <p className="news-empty">{empty}</p>;
  return <div className="official-news-archive">
    <label className="official-news-search"><span>{searchLabel}</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisible(10); }} placeholder="Partnership, financing, customer, product…"/></label>
    <div className="official-news-count">Showing {Math.min(visible, filtered.length)} of {filtered.length} official records</div>
    <div className="official-news-list">{filtered.slice(0, visible).map((item) => <article key={`${item.url}-${item.title}`}>
      <div className="official-news-meta"><span>{item.source === "SEC EDGAR official filing" ? "✓ OFFICIAL SEC FILING" : "✓ OFFICIAL COMPANY RELEASE"}</span><time>{dateLabel(item.publishedAt)}</time></div>
      <h4>{item.title}</h4>
      <p>{item.summary || "This official release is indexed from the company archive. The company did not provide a separate archive summary."}</p>
      <footer><span>{item.category || "Company update"}{item.readingMinutes ? ` · ${item.readingMinutes} min read` : ""}</span><a href={item.url} target="_blank" rel="noreferrer">{linkLabel}</a></footer>
    </article>)}</div>
    {filtered.length === 0 && <p className="news-empty">No official releases match that search.</p>}
    {visible < filtered.length && <button type="button" className="official-news-more" onClick={() => setVisible((count) => count + 10)}>Show 10 more official releases ↓</button>}
  </div>;
}

export function CompanyNewsPanel({ ticker, companyName, newsroomUrl }: { ticker: string; companyName: string; newsroomUrl?: string }) {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/company-news?ticker=${encodeURIComponent(ticker)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as NewsResponse;
        if (!response.ok) throw new Error(payload.error || "News is temporarily unavailable.");
        setData(payload);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "News is temporarily unavailable.");
      });
    return () => controller.abort();
  }, [ticker]);

  const officialUrl = data?.newsroomUrl || newsroomUrl;
  return <section className="company-news-panel" id="news">
    <div className="company-news-heading"><div><span className="kicker">NEWS &amp; DEVELOPMENTS · {ticker}</span><h2>What is changing around {companyName}</h2><p>Read the company’s official release archive here, alongside independent coverage gathered across Bing News, Google News, and GDELT. Original publisher links remain available for verification.</p></div>{officialUrl && <a href={officialUrl} target="_blank" rel="noreferrer">Source archive ↗</a>}</div>
    <div className="company-news-notice"><strong>Official does not mean independently verified.</strong><span>Company summaries reflect management’s framing. Learn What You Own keeps them on-site and promotes material developments into the dossier only after checking filings and other direct evidence.</span></div>
    {error && <p className="news-error">{error} <a href={`https://news.google.com/search?q=${encodeURIComponent(ticker)}`} target="_blank" rel="noreferrer">Open news search ↗</a></p>}
    {!data && !error && <div className="news-loading"><i/><span>Loading current releases and coverage…</span></div>}
    {data && <><div className="company-news-grid">
      <section className="official-news-column"><div className="news-column-title"><div><small>PRIMARY · COMPANY-PUBLISHED PRESS RELEASES</small><h3>Official company releases</h3></div><span>{data.companyReleases.length}</span></div><div className="official-source-health">{(data.officialSources ?? []).filter((source) => source.source === "company").map((source) => <span className={`source-${source.status}`} key={source.source}>Company newsroom: {source.status === "working" ? `${source.records} loaded` : source.status.replace("-", " ")}</span>)}</div><OfficialNewsList items={data.companyReleases} empty="No company press releases were returned. This does not mean there were no SEC filings; those are listed separately below."/></section>
      <section><div className="news-column-title"><div><small>EXTERNAL · MULTI-SOURCE</small><h3>Public &amp; industry coverage</h3></div><span>{data.public.length}</span></div><NewsList items={data.public} providers={data.providers} empty="No recent public coverage was returned. Try again later or open a broader news search."/></section>
    </div><section className="sec-news-column"><div className="news-column-title"><div><small>PRIMARY · REGULATORY</small><h3>SEC EDGAR filings</h3></div><span>{data.secFilings.length}</span></div><div className="official-source-health">{(data.officialSources ?? []).filter((source) => source.source === "sec").map((source) => <span className={`source-${source.status}`} key={source.source}>SEC EDGAR: {source.status === "working" ? `${source.records} loaded` : source.status.replace("-", " ")}</span>)}</div><OfficialNewsList items={data.secFilings} searchLabel="SEARCH SEC FILINGS" linkLabel="Open Exact SEC Filing ↗" empty="No SEC filings were returned for this ticker."/></section></>}
    {data && <div className="news-updated">Feed checked {dateLabel(data.updatedAt)} · {data.providers.length ? data.providers.join(" + ") : "External indexes unavailable"}{data.unavailableProviders.length ? ` · Temporarily unavailable: ${data.unavailableProviders.join(", ")}` : ""}</div>}
  </section>;
}
