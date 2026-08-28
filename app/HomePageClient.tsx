"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "./ui";
import { companySlug, researchUniverse } from "./data/universe";
import { normalizedTicker, rankedCompanyMatches } from "./data/companySearch";
import { authenticatedFetch, loginPath } from "./supabase-browser";
import { AccessComparison } from "./AccessComparison";
import { followingLabel, type CompanyDemand, type CompanyFollower } from "./company-followers";
import { formatMarketCap, formatStockPrice, type CompanyMarketSnapshot } from "./market-snapshot";
import { CompanyLogo } from "./CompanyLogo";

const companies = [
  { ticker: "AMC", name: "AMC Entertainment", sector: "Theatrical Exhibition", updated: "Today", score: 100, note: "Q2 performance, debt actions, and comparables verified" },
  { ticker: "NVDA", name: "NVIDIA", sector: "Semiconductors", updated: "Today", score: 100, note: "Architecture transitions, cash conversion, and comparables reviewed" },
  { ticker: "AAPL", name: "Apple", sector: "Consumer Technology", updated: "Today", score: 100, note: "Supplier evidence, services economics, and capital returns reviewed" },
  { ticker: "AMZN", name: "Amazon", sector: "Commerce & Cloud", updated: "Today", score: 100, note: "AWS capital intensity, retail economics, and comparables reviewed" },
  { ticker: "TSLA", name: "Tesla", sector: "Automotive & Energy", updated: "Today", score: 100, note: "Q2 filing, performance, autonomy, and energy economics reviewed" },
  { ticker: "PLTR", name: "Palantir", sector: "Enterprise AI", updated: "Today", score: 100, note: "Commercial cohorts, dilution, and competitive positioning reviewed" },
  { ticker: "RKLB", name: "Rocket Lab", sector: "Space Systems", updated: "Today", score: 100, note: "Neutron milestones, liquidity, and launch comparables reviewed" },
  { ticker: "SPCX", name: "SpaceX", sector: "Space, Connectivity & AI", updated: "Today", score: 100, note: "IPO prospectus, segment economics, governance, and capital needs reviewed" },
  { ticker: "BB", name: "BlackBerry", sector: "Infrastructure Software", updated: "Today", score: 100, note: "QNX backlog, cash conversion, and comparables reviewed" },
  { ticker: "BE", name: "Bloom Energy", sector: "Clean Energy", updated: "Today", score: 100, note: "Margin bridge, backlog quality, and project comparables reviewed" },
  { ticker: "BA", name: "Boeing", sector: "Aerospace & Defense", updated: "Today", score: 100, note: "Production recovery, working capital, and peers reviewed" },
  { ticker: "CAT", name: "Caterpillar", sector: "Industrial Equipment", updated: "Today", score: 100, note: "Dealer inventory, services mix, and cycle comparables reviewed" },
  { ticker: "CRWV", name: "CoreWeave", sector: "AI Infrastructure", updated: "Today", score: 100, note: "Backlog, financing, supply chain, and comparables reviewed" },
  { ticker: "ORCL", name: "Oracle", sector: "Enterprise Software & Cloud", updated: "Today", score: 100, note: "FY2026 cloud, backlog, and financing review" },
  { ticker: "RCL", name: "Royal Caribbean", sector: "Cruise & Vacation", updated: "Today", score: 100, note: "Yield, fleet returns, liquidity, and travel comparables reviewed" },
  { ticker: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors", updated: "Today", score: 100, note: "Data center growth, product roadmap, cash conversion, and peers reviewed" },
  { ticker: "MSFT", name: "Microsoft", sector: "Cloud & Software", updated: "Today", score: 100, note: "Azure growth, backlog, AI capital intensity, and platform peers reviewed" },
  { ticker: "GOOG", name: "Alphabet", sector: "Digital Platforms & Cloud", updated: "Today", score: 100, note: "Search, Cloud, AI investment, regulation, and peers reviewed" },
  { ticker: "META", name: "Meta Platforms", sector: "Digital Advertising & AI", updated: "Today", score: 100, note: "Ad economics, engagement, AI capex, Reality Labs, and peers reviewed" },
];

const updates = [
  { date: "Today", ticker: "AMD", title: "Q1 data-center growth and cash conversion reviewed", impact: "Founding benchmark dossier published", type: "Company results" },
  { date: "Today", ticker: "MSFT", title: "FY2026 cloud growth and commercial backlog reviewed", impact: "Founding benchmark dossier published", type: "Company results" },
  { date: "Today", ticker: "GOOG", title: "Q1 Search, Cloud, acquisitions, and commitments reviewed", impact: "Founding benchmark dossier published", type: "SEC filing" },
  { date: "Today", ticker: "META", title: "Q1 advertising, engagement, cash flow, and AI investment reviewed", impact: "Founding benchmark dossier published", type: "Company results" },
  { date: "Today", ticker: "AMC", title: "Record Q2 economics and premium-format footprint reviewed", impact: "Recovery evidence strengthened", type: "SEC filing" },
  { date: "Today", ticker: "SPCX", title: "IPO prospectus and three-segment economics reviewed", impact: "Founding public dossier published", type: "SEC filing" },
  { date: "Today", ticker: "TSLA", title: "Q2 filing and 2026 capital plan reviewed", impact: "Cash-return debate updated", type: "SEC filing" },
  { date: "Today", ticker: "NVDA", title: "A key supplier raised capacity guidance", impact: "Dependency updated", type: "Primary source" },
  { date: "Yesterday", ticker: "BB", title: "QNX royalty backlog reached a new high", impact: "Thesis unchanged", type: "Company filing" },
];

const dossierHref = (ticker: string) => `/company/${companySlug(ticker)}`;
const searchExamples = ["AMC", "NVIDIA", "Semiconductors", "S&P 500"];
type Demand = CompanyDemand;
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

export default function HomePageClient() {
  const [query, setQuery] = useState("");
  const [demand, setDemand] = useState<Record<string, Demand>>({});
  const [viewerVotes, setViewerVotes] = useState<Set<string>>(new Set());
  const [demandBusy, setDemandBusy] = useState("");
  const [catalogSearch, setCatalogSearch] = useState<{ query: string; matches: SearchMatch[] }>({ query: "", matches: [] });
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});
  const [marketSnapshots, setMarketSnapshots] = useState<Record<string, CompanyMarketSnapshot | null>>({});
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
    const focusSearchFromHash = () => {
      if (window.location.hash !== "#company-search") return;
      const input = document.getElementById("company-search-input") as HTMLInputElement | null;
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.requestAnimationFrame(() => input?.focus({ preventScroll: true }));
    };
    focusSearchFromHash();
    window.addEventListener("hashchange", focusSearchFromHash);
    return () => window.removeEventListener("hashchange", focusSearchFromHash);
  }, []);
  useEffect(() => {
    authenticatedFetch("/api/research-demand", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const payload = await response.json() as { companies?: Demand[]; viewerVotes?: string[] };
      setDemand(Object.fromEntries((payload.companies ?? []).map((item) => [item.ticker, item])));
      setViewerVotes(new Set(payload.viewerVotes ?? []));
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    const tickers = companies.map((company) => company.ticker).join(",");
    fetch(`/api/market-snapshot?tickers=${encodeURIComponent(tickers)}`)
      .then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json() as { snapshots?: Record<string, CompanyMarketSnapshot | null> };
        setMarketSnapshots(payload.snapshots ?? {});
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    fetch("/api/site-stats").then(async (response) => {
      if (response.ok) setSiteStats(await response.json() as SiteStats);
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    fetch("/api/company-followers", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const payload = await response.json() as { companies?: CompanyFollower[] };
      setFollowerCounts(Object.fromEntries((payload.companies ?? []).map((item) => [item.ticker, item.follower_count])));
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    const search = query.trim();
    if (!search) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q: search, pageSize: "10" });
      Promise.all(["listed", "otc"].map((market) => fetch(`/api/universe?market=${market}&${params}`, { signal: controller.signal }).then(async (response) => response.ok ? await response.json() as { companies?: Array<{ ticker: string; name: string; sector: string; exchange: string }> } : { companies: [] })))
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
    .filter((item) => item.vote_count > 0 && !companies.some((company) => company.ticker === item.ticker) && researchUniverse.some((company) => company.ticker === item.ticker))
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
          <div className="eyebrow"><span className="status-dot" /> Public research is free. Your owner workspace is free.</div>
          <h1>Understand what you own.<br /><em>Make the research yours.</em></h1>
          <p className="hero-copy">Browse every public dossier without an account. Create a free account to contribute research, earn rewards, monitor a watchlist, receive earnings alerts, send public and private messages, take notes, and track what you own.</p>
          <div className="hero-account-pitch" aria-label="Free account benefits">
            <div className="hero-account-actions">
              <Link className="hero-primary-cta" href="/login?mode=signup">Create my free account <span>→</span></Link>
              <Link className="hero-secondary-cta" href="/login">Existing member sign in</Link>
              <Link className="hero-browse-cta" href="/companies">Browse public dossiers</Link>
            </div>
            <p className="hero-account-proof">Free to join <span>·</span> No credit card <span>·</span> Your portfolio stays private</p>
            <div className="hero-benefit-grid">
              <div><strong>Watchlists + portfolio</strong><span>Track holdings privately</span></div>
              <div><strong>Earnings alerts</strong><span>Know what is coming</span></div>
              <div><strong>Research notebook</strong><span>Save claims and sources</span></div>
              <div><strong>Community rewards</strong><span>Earn points for value</span></div>
            </div>
          </div>
          <div className="hero-search-divider"><span>Or search the public research universe</span></div>
          <div className="search-shell" id="company-search">
            <span className="search-icon">⌕</span>
            <input
              id="company-search-input"
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
                    <small>{company.sector} · {followingLabel(followerCounts[company.ticker] ?? 0)}</small>
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
                <CompanyLogo ticker={company.ticker} companyName={company.name} size="card" eager={index < 3} />
                <div className="score-ring" style={{"--score": `${company.score * 3.6}deg`} as React.CSSProperties}><span>{company.score}</span></div>
              </div>
              <h3>{company.name}</h3>
              <p className="ticker-line">{company.ticker} · {company.sector}</p>
              <div className="card-market-data" aria-label={`${company.ticker} market data`}>
                <div><small>CURRENT PRICE</small><strong>{marketSnapshots[company.ticker] === undefined ? "Loading…" : formatStockPrice(marketSnapshots[company.ticker]?.price)}</strong></div>
                <div><small>MARKET CAP</small><strong>{marketSnapshots[company.ticker] === undefined ? "Loading…" : formatMarketCap(marketSnapshots[company.ticker]?.marketCap)}</strong></div>
              </div>
              <div className="card-update"><span>↗</span><div><small>LATEST UPDATE</small><p>{company.note}</p></div></div>
              <div className="card-meta"><span>{siteStats?.sourceCountsByTicker[company.ticker]?.toLocaleString() ?? "—"} primary sources</span><span>Updated {company.updated}</span></div>
            </Link>
            <div className="company-demand"><span>{index < 3 && (demand[company.ticker]?.demand_score ?? 0) > 0 ? "HOT COMPANY" : "RESEARCH DEMAND"}<small>{followingLabel(followerCounts[company.ticker] ?? 0)} · {demand[company.ticker]?.vote_count ?? 0} research requests · {demand[company.ticker]?.page_views ?? 0} readers</small></span><button className={viewerVotes.has(company.ticker) ? "voted" : ""} disabled={demandBusy === company.ticker} onClick={() => toggleDemand(company.ticker)}>{demandBusy === company.ticker ? "Saving…" : viewerVotes.has(company.ticker) ? "✓ Requested" : "▲ Upvote"}</button></div>
            </article>
          ))}
        </div>
        {nextRequested.length > 0 && <div className="community-research-queue"><div><span className="kicker">MOST REQUESTED RESEARCH</span><strong>Companies members have explicitly asked us to prioritize</strong></div><nav>{nextRequested.map((item) => <Link href={dossierHref(item.ticker)} key={item.ticker}><b>{item.ticker}</b><span>{followingLabel(followerCounts[item.ticker] ?? 0)} · {item.vote_count} member requests · {item.page_views} readers</span></Link>)}</nav></div>}
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
