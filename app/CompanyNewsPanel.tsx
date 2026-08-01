"use client";

import { useEffect, useState } from "react";

type NewsItem = { title: string; url: string; publishedAt: string; source: string };
type NewsResponse = {
  official: NewsItem[];
  public: NewsItem[];
  newsroomUrl: string | null;
  updatedAt: string;
  partial: boolean;
  error?: string;
};

function dateLabel(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? "Date unavailable" : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function NewsList({ items, empty }: { items: NewsItem[]; empty: string }) {
  if (items.length === 0) return <p className="news-empty">{empty}</p>;
  return <div className="company-news-list">{items.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={`${item.url}-${item.title}`}>
    <span>{item.source}</span><h4>{item.title}</h4><small>{dateLabel(item.publishedAt)} · Open story ↗</small>
  </a>)}</div>;
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
    <div className="company-news-heading"><div><span className="kicker">NEWS &amp; DEVELOPMENTS · {ticker}</span><h2>What is changing around {companyName}</h2><p>Company-issued releases and independent coverage are separated so source incentives remain visible.</p></div>{officialUrl && <a href={officialUrl} target="_blank" rel="noreferrer">Official newsroom ↗</a>}</div>
    <div className="company-news-notice"><strong>Headline monitor, not verified research.</strong><span>External stories may contain errors, opinions, or promotional claims. Promote a development into the dossier only after checking direct evidence.</span></div>
    {error && <p className="news-error">{error} <a href={`https://news.google.com/search?q=${encodeURIComponent(ticker)}`} target="_blank" rel="noreferrer">Open news search ↗</a></p>}
    {!data && !error && <div className="news-loading"><i/><span>Loading current releases and coverage…</span></div>}
    {data && <div className="company-news-grid">
      <section><div className="news-column-title"><div><small>PRIMARY</small><h3>Company releases</h3></div><span>{data.official.length}</span></div><NewsList items={data.official} empty={officialUrl ? "No recent indexed releases. Open the official newsroom for the complete archive." : "An official newsroom has not yet been curated for this ticker."}/></section>
      <section><div className="news-column-title"><div><small>EXTERNAL</small><h3>Public &amp; industry coverage</h3></div><span>{data.public.length}</span></div><NewsList items={data.public} empty="No recent public coverage was returned. Try again later or open a broader news search."/></section>
    </div>}
    {data && <div className="news-updated">Feed checked {dateLabel(data.updatedAt)}{data.partial ? " · One source was temporarily unavailable" : ""}</div>}
  </section>;
}
