"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "./ui";
import { companySlug, researchUniverse } from "./data/universe";
import { normalizedTicker, rankedCompanyMatches } from "./data/companySearch";
import { authenticatedFetch, loginPath } from "./supabase-browser";
import { AccessComparison } from "./AccessComparison";

const companies = [
  { ticker: "AMC", name: "AMC Entertainment", sector: "Theatrical Exhibition", updated: "Today", score: 100, note: "Q2 performance, debt actions, and comparables verified" },
  { ticker: "NVDA", name: "NVIDIA", sector: "Semiconductors", updated: "4h ago", score: 96, note: "Supply chain map refreshed" },
  { ticker: "AAPL", name: "Apple", sector: "Consumer Technology", updated: "Today", score: 96, note: "Supplier evidence map added" },
  { ticker: "AMZN", name: "Amazon", sector: "Commerce & Cloud", updated: "Today", score: 95, note: "AWS capital intensity reviewed" },
  { ticker: "TSLA", name: "Tesla", sector: "Automotive & Energy", updated: "Today", score: 100, note: "Q2 filing, performance, autonomy, and energy economics reviewed" },
  { ticker: "PLTR", name: "Palantir", sector: "Enterprise AI", updated: "3d ago", score: 95, note: "Commercial cohort review" },
  { ticker: "RKLB", name: "Rocket Lab", sector: "Space Systems", updated: "2d ago", score: 93, note: "Neutron milestone added" },
  { ticker: "SPCX", name: "SpaceX", sector: "Space, Connectivity & AI", updated: "Today", score: 100, note: "IPO prospectus, segment economics, governance, and capital needs reviewed" },
  { ticker: "BB", name: "BlackBerry", sector: "Infrastructure Software", updated: "Yesterday", score: 91, note: "QNX backlog analysis" },
  { ticker: "BE", name: "Bloom Energy", sector: "Clean Energy", updated: "Yesterday", score: 88, note: "Margin thesis revised" },
  { ticker: "BA", name: "Boeing", sector: "Aerospace & Defense", updated: "3d ago", score: 92, note: "Production recovery evidence reviewed" },
  { ticker: "CAT", name: "Caterpillar", sector: "Industrial Equipment", updated: "4d ago", score: 92, note: "Dealer inventory signals updated" },
  { ticker: "CRWV", name: "CoreWeave", sector: "AI Infrastructure", updated: "4d ago", score: 90, note: "Backlog and financing review" },
  { ticker: "ORCL", name: "Oracle", sector: "Enterprise Software & Cloud", updated: "Today", score: 100, note: "FY2026 cloud, backlog, and financing review" },
];

const updates = [
  { date: "Today", ticker: "AMC", title: "Record Q2 economics and premium-format footprint reviewed", impact: "Recovery evidence strengthened", type: "SEC filing" },
  { date: "Today", ticker: "SPCX", title: "IPO prospectus and three-segment economics reviewed", impact: "Founding public dossier published", type: "SEC filing" },
  { date: "Today", ticker: "TSLA", title: "Q2 filing and 2026 capital plan reviewed", impact: "Cash-return debate updated", type: "SEC filing" },
  { date: "Today", ticker: "NVDA", title: "A key supplier raised capacity guidance", impact: "Dependency updated", type: "Primary source" },
  { date: "Yesterday", ticker: "BB", title: "QNX royalty backlog reached a new high", impact: "Thesis unchanged", type: "Company filing" },
];

const dossierHref = (ticker: string) => `/company/${companySlug(ticker)}`;
const searchExamples = ["AMC", "NVIDIA", "Semiconductors", "S&P 500"];
type Demand = { ticker: string; vote_count: number; page_views: number; demand_score: number };
type SearchMatch = { ticker: string; name: string; sector: string };
type SiteStats = {
  researchableSymbols: number;
  listedSymbols: number;
  otcSymbols: number;
  publishedDossiers: number;
  uniquePrimarySources: number;
  claimSourceCoverage: number;
  sourceCountsByTicker: Record<string, number>;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [demand, setDemand] = useState<Record<string, Demand>>({});
  const [viewerVotes, setViewerVotes] = useState<Set<string>>(new Set());
  const [demandBusy, setDemandBusy] = useState("");
  const [catalogSearch, setCatalogSearch] = useState<{ query: string; matches: SearchMatch[] }>({ query: "", matches: [] });
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const localMatches = useMemo(
    () => rankedCompanyMatches(researchUniverse, query).slice(0, 8),
    [query]
  );
  const matches = useMemo(() => {
    if (!query.trim()) return [];
    if (localMatches.length === 1 && normalizedTicker(localMatches[0].ticker) === normalizedTicker(query)) return localMatches;
    const seen = new Set<string>();
    const catalogMatches = catalogSearch.query === query.trim() ? catalogSearch.matches : [];
    return [...localMatches, ...catalogMatches].filter((company) => {
      if (seen.has(company.ticker)) return false;
      seen.add(company.ticker);
      return true;
    }).slice(0, 8);
  }, [query, localMatches, catalogSearch]);
  useEffect(() => {
    authenticatedFetch("/api/research-demand", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const payload = await response.json() as { companies?: Demand[]; viewerVotes?: string[] };
      setDemand(Object.fromEntries((payload.companies ?? []).map((item) => [item.ticker, item])));
      setViewerVotes(new Set(payload.viewerVotes ?? []));
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    fetch("/api/site-stats").then(async (response) => {
      if (response.ok) setSiteStats(await response.json() as SiteStats);
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    const search = query.trim();
    if (!search) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q: search, pageSize: "10" });
      Promise.all(["listed", "otc"].map((market) => fetch(`/api/universe?market=${market}&${params}`, { signal: controller.signal }).then((response) => response.ok ? response.json() : { companies: [] })))
        .then((payloads) => setCatalogSearch({ query: search, matches: payloads.flatMap((payload) => (payload.companies ?? []).map((company: { ticker: string; name: string; sector: string; exchange: string }) => ({ ticker: company.ticker, name: company.name, sector: company.sector === "Not classified" ? company.exchange : company.sector }))) }))
        .catch(() => undefined);
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);
  const rankedCompanies = useMemo(() => [...companies].sort((a, b) => {
    const demandDifference = (demand[b.ticker]?.demand_score ?? 0) - (demand[a.ticker]?.demand_score ?? 0);
    return demandDifference || companies.indexOf(a) - companies.indexOf(b);
  }), [demand]);
  const nextRequested = useMemo(() => Object.values(demand)
    .filter((item) => !companies.some((company) => company.ticker === item.ticker) && researchUniverse.some((company) => company.ticker === item.ticker))
    .sort((a, b) => b.demand_score - a.demand_score || a.ticker.localeCompare(b.ticker)).slice(0, 6), [demand]);

  async function toggleDemand(ticker: string) {
    const voted = viewerVotes.has(ticker);
    setDemandBusy(ticker);
    const response = await authenticatedFetch("/api/research-demand", {
      method: voted ? "DELETE" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker }),
    });
    if (response.status === 401) { window.location.assign(loginPath("/")); return; }
    if (response.ok) {
      setViewerVotes((current) => { const next = new Set(current); if (voted) next.delete(ticker); else next.add(ticker); return next; });
      setDemand((current) => ({ ...current, [ticker]: { ticker, vote_count: Math.max(0, (current[ticker]?.vote_count ?? 0) + (voted ? -1 : 1)), page_views: current[ticker]?.page_views ?? 0, demand_score: Math.max(0, (current[ticker]?.demand_score ?? 0) + (voted ? -10 : 10)) } }));
    }
    setDemandBusy("");
  }

  return (
    <main>
      <Header />
      <section className="hero">
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <div className="container hero-inner">
          <div className="eyebrow"><span className="status-dot" /> Research for owners, not traders</div>
          <h1>Know the business.<br /><em>Own with conviction.</em></h1>
          <p className="hero-copy">A living, evidence-linked owner’s manual for every company you own—or are curious enough to study.</p>
          <div className="search-shell">
            <span className="search-icon">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ticker, company, sector, or index"
              aria-label="Search companies"
              autoComplete="off"
            />
            <span className="keycap">⌘ K</span>
            {matches.length > 0 && (
              <div className="search-results">
                {matches.map((company) => (
                  <Link href={`/company/${companySlug(company.ticker)}`} key={company.ticker}>
                    <strong>{company.ticker}</strong>
                    <span>{company.name}</span>
                    <small>{company.sector}</small>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="search-guidance" aria-label="Supported search types and examples">
            <span>Search by ticker, company, sector, or index</span>
            <div><strong>Try</strong>{searchExamples.map((example) => <button type="button" onClick={() => setQuery(example)} key={example}>{example}</button>)}</div>
          </div>
        </div>
      </section>

      <section className="container founder-section" id="mission">
        <div className="founder-mission">
          <span className="kicker">THE FOUNDER’S MISSION</span>
          <h2>Ownership should come with understanding.</h2>
          <p className="mission-lede">LearnWhatYouOwn is building the world’s most trusted Ownership Intelligence Network—a community where AI and human expertise work together to help people understand the assets they own, beginning with public equities.</p>
          <p>Our mission is to combine high-quality data, artificial intelligence, practical education, and the collective expertise of the community so owners can ask better questions and make calmer, better-informed decisions.</p>
          <Link className="text-link" href="/founders-letter">Read the Founder’s Letter <span>→</span></Link>
        </div>
        <aside className="founder-host">
          <span>HOSTED &amp; MODERATED BY</span>
          <strong>@Yourhost</strong>
          <p>As founder and host, I welcome questions, guide visitors through the research, elevate credible contributions, challenge unsupported claims, and protect the quality of the community experience.</p>
          <em>I am not here to tell anyone what to buy. I am here to help owners understand the evidence.</em>
        </aside>
      </section>

      <section className="proof-strip">
        <div className="container proof-grid">
          <div title="Distinct active symbols in the production companies table"><strong>{siteStats?.researchableSymbols.toLocaleString() ?? "—"}</strong><span>researchable symbols</span></div>
          <div title="Active exchange-listed catalog records"><strong>{siteStats?.listedSymbols.toLocaleString() ?? "—"}</strong><span>exchange-listed symbols</span></div>
          <div title="Distinct evidence documents; SEC links are deduplicated by filing accession"><strong>{siteStats?.uniquePrimarySources.toLocaleString() ?? "—"}</strong><span>unique primary documents</span></div>
          <div title="Published dossiers in the production research database"><strong>{siteStats?.publishedDossiers.toLocaleString() ?? "—"}</strong><span>published owner dossiers</span></div>
        </div>
        <p className="container proof-definition">Live production counts. Researchable symbols include {siteStats?.otcSymbols.toLocaleString() ?? "—"} OTC securities; primary documents are deduplicated by SEC filing accession or canonical source URL. {siteStats ? `${siteStats.claimSourceCoverage}% of published claims carry a source link.` : ""}</p>
      </section>

      <section className="container content-section">
        <div className="section-heading">
          <div><span className="kicker">COMMUNITY RESEARCH DEMAND</span><h2>Hot companies, ranked by owners.</h2><p className="section-intro">Verified member requests and privacy-preserving 30-day readership help determine which dossiers receive featured coverage.</p></div>
          <Link className="text-link" href="/companies">Explore all dossiers <span>→</span></Link>
        </div>
        <div className="company-grid">
          {rankedCompanies.map((company, index) => (
            <article className="company-card" key={company.ticker}>
            <Link className="company-card-link" href={dossierHref(company.ticker)} aria-label={`Open the ${company.name} dossier`}>
              <div className="card-top">
                <div className={`ticker-icon tint-${index + 1}`}>{company.ticker}</div>
                <div className="score-ring" style={{"--score": `${company.score * 3.6}deg`} as React.CSSProperties}><span>{company.score}</span></div>
              </div>
              <h3>{company.name}</h3>
              <p className="ticker-line">{company.ticker} · {company.sector}</p>
              <div className="card-update"><span>↗</span><div><small>LATEST UPDATE</small><p>{company.note}</p></div></div>
              <div className="card-meta"><span>{siteStats?.sourceCountsByTicker[company.ticker]?.toLocaleString() ?? "—"} primary sources</span><span>Updated {company.updated}</span></div>
            </Link>
            <div className="company-demand"><span>{index < 3 && (demand[company.ticker]?.demand_score ?? 0) > 0 ? "HOT COMPANY" : "RESEARCH DEMAND"}<small>{demand[company.ticker]?.vote_count ?? 0} member requests · {demand[company.ticker]?.page_views ?? 0} readers</small></span><button className={viewerVotes.has(company.ticker) ? "voted" : ""} disabled={demandBusy === company.ticker} onClick={() => toggleDemand(company.ticker)}>{demandBusy === company.ticker ? "Saving…" : viewerVotes.has(company.ticker) ? "✓ Requested" : "▲ Upvote"}</button></div>
            </article>
          ))}
        </div>
        {nextRequested.length > 0 && <div className="community-research-queue"><div><span className="kicker">NEXT IN THE RESEARCH QUEUE</span><strong>Community-requested companies beyond the featured dossiers</strong></div><nav>{nextRequested.map((item) => <Link href={dossierHref(item.ticker)} key={item.ticker}><b>{item.ticker}</b><span>{item.vote_count} requests · {item.page_views} readers</span></Link>)}</nav></div>}
      </section>

      <section className="dark-section">
        <div className="container">
          <div className="section-heading light">
            <div><span className="kicker">THE CHANGELOG</span><h2>What changed—and why it matters.</h2></div>
            <p>Every meaningful development, translated into thesis impact.</p>
          </div>
          <div className="change-table">
            {updates.map((update) => (
              <Link href={dossierHref(update.ticker)} className="change-row" key={update.ticker} aria-label={`Open the ${update.ticker} dossier`}>
                <span className="change-date">{update.date}</span>
                <span className="mini-ticker">{update.ticker}</span>
                <strong>{update.title}</strong>
                <span className="source-pill">{update.type}</span>
                <span className="impact">{update.impact} ↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container principle-section">
        <div className="principle-copy">
          <span className="kicker">A DIFFERENT STANDARD</span>
          <h2>Every claim earns its place.</h2>
          <p>Opinions are cheap. Understanding is built claim by claim, source by source, with clear labels for what is known, asserted, inferred, and still unanswered.</p>
          <Link className="button dark-button" href="/company/amc">Open the AMC dossier</Link>
        </div>
        <div className="claim-demo">
          <div className="claim-label"><span>✓</span> Independently verified</div>
          <blockquote>“AMC operated 226 IMAX screens across its U.S. and international circuits at June 30, 2026.”</blockquote>
          <div className="claim-sources">
            <span>01</span><div><strong>Q2 2026 Form 10-Q</strong><small>SEC filing · Premium-format table</small></div>
            <span>02</span><div><strong>2025 Form 10-K</strong><small>SEC filing · Theatre concepts and competition</small></div>
          </div>
          <button>View evidence <span>→</span></button>
        </div>
      </section>

      <AccessComparison />

    </main>
  );
}
