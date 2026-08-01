"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "./ui";
import { companySlug, researchUniverse } from "./data/universe";
import { rankedCompanyMatches } from "./data/companySearch";
import { authenticatedFetch, loginPath } from "./supabase-browser";

const companies = [
  { ticker: "ONDS", name: "Ondas Holdings", sector: "Autonomous Systems", updated: "2h ago", sources: 2, score: 82, note: "New defense program award" },
  { ticker: "NVDA", name: "NVIDIA", sector: "Semiconductors", updated: "4h ago", sources: 2, score: 96, note: "Supply chain map refreshed" },
  { ticker: "AAPL", name: "Apple", sector: "Consumer Technology", updated: "Today", sources: 2, score: 96, note: "Supplier evidence map added" },
  { ticker: "AMZN", name: "Amazon", sector: "Commerce & Cloud", updated: "Today", sources: 2, score: 95, note: "AWS capital intensity reviewed" },
  { ticker: "TSLA", name: "Tesla", sector: "Automotive & Energy", updated: "Today", sources: 2, score: 94, note: "AI and energy thesis refreshed" },
  { ticker: "PLTR", name: "Palantir", sector: "Enterprise AI", updated: "3d ago", sources: 2, score: 95, note: "Commercial cohort review" },
  { ticker: "RKLB", name: "Rocket Lab", sector: "Space Systems", updated: "2d ago", sources: 2, score: 93, note: "Neutron milestone added" },
  { ticker: "BB", name: "BlackBerry", sector: "Infrastructure Software", updated: "Yesterday", sources: 2, score: 91, note: "QNX backlog analysis" },
  { ticker: "BE", name: "Bloom Energy", sector: "Clean Energy", updated: "Yesterday", sources: 2, score: 88, note: "Margin thesis revised" },
  { ticker: "BA", name: "Boeing", sector: "Aerospace & Defense", updated: "3d ago", sources: 2, score: 92, note: "Production recovery evidence reviewed" },
  { ticker: "CAT", name: "Caterpillar", sector: "Industrial Equipment", updated: "4d ago", sources: 2, score: 92, note: "Dealer inventory signals updated" },
  { ticker: "CRWV", name: "CoreWeave", sector: "AI Infrastructure", updated: "4d ago", sources: 2, score: 90, note: "Backlog and financing review" },
];

const updates = [
  { date: "Today", ticker: "ONDS", title: "Management expanded the defense opportunity", impact: "Bull case strengthened", type: "Management statement" },
  { date: "Today", ticker: "NVDA", title: "A key supplier raised capacity guidance", impact: "Dependency updated", type: "Primary source" },
  { date: "Yesterday", ticker: "BB", title: "QNX royalty backlog reached a new high", impact: "Thesis unchanged", type: "Company filing" },
];

const dossierHref = (ticker: string) => `/company/${companySlug(ticker)}`;
type Demand = { ticker: string; vote_count: number; page_views: number; demand_score: number };

export default function Home() {
  const [query, setQuery] = useState("");
  const [demand, setDemand] = useState<Record<string, Demand>>({});
  const [viewerVotes, setViewerVotes] = useState<Set<string>>(new Set());
  const [demandBusy, setDemandBusy] = useState("");
  const matches = useMemo(
    () => rankedCompanyMatches(researchUniverse, query).slice(0, 8),
    [query]
  );
  useEffect(() => {
    authenticatedFetch("/api/research-demand", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const payload = await response.json() as { companies?: Demand[]; viewerVotes?: string[] };
      setDemand(Object.fromEntries((payload.companies ?? []).map((item) => [item.ticker, item])));
      setViewerVotes(new Set(payload.viewerVotes ?? []));
    }).catch(() => undefined);
  }, []);
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
    if (response.status === 401) { window.location.href = loginPath("/"); return; }
    if (response.ok) {
      setViewerVotes((current) => { const next = new Set(current); voted ? next.delete(ticker) : next.add(ticker); return next; });
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
              placeholder="Search a company, ticker, executive, or theme"
              aria-label="Search companies"
              autoComplete="off"
            />
            <span className="keycap">⌘ K</span>
            {matches.length > 0 && (
              <div className="search-results">
                {matches.map((company) => (
                  <Link href={company.ticker === "ONDS" ? "/company/onds" : `/company/${companySlug(company.ticker)}`} key={company.ticker}>
                    <strong>{company.ticker}</strong>
                    <span>{company.name}</span>
                    <small>{company.sector}</small>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="popular">Popular <Link href={dossierHref("ONDS")}>ONDS</Link><Link href={dossierHref("NVDA")}>NVDA</Link><Link href="/companies">AI infrastructure</Link><Link href={dossierHref("BB")}>QNX</Link></div>
        </div>
      </section>

      <section className="proof-strip">
        <div className="container proof-grid">
          <div><strong>{researchUniverse.length.toLocaleString()}</strong><span>researchable tickers</span></div>
          <div><strong>4</strong><span>index memberships unified</span></div>
          <div><strong>8,903</strong><span>primary sources</span></div>
          <div><strong>100%</strong><span>claims cited</span></div>
        </div>
      </section>

      <section className="container content-section">
        <div className="section-heading">
          <div><span className="kicker">COMMUNITY RESEARCH DEMAND</span><h2>Hot companies, ranked by owners.</h2><p className="section-intro">Verified member requests and privacy-preserving 30-day readership determine which twelve dossiers rise to the top.</p></div>
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
              <div className="card-meta"><span>{company.sources} sources</span><span>Updated {company.updated}</span></div>
            </Link>
            <div className="company-demand"><span>{index < 3 && (demand[company.ticker]?.demand_score ?? 0) > 0 ? "HOT COMPANY" : "RESEARCH DEMAND"}<small>{demand[company.ticker]?.vote_count ?? 0} member requests · {demand[company.ticker]?.page_views ?? 0} readers</small></span><button className={viewerVotes.has(company.ticker) ? "voted" : ""} disabled={demandBusy === company.ticker} onClick={() => toggleDemand(company.ticker)}>{demandBusy === company.ticker ? "Saving…" : viewerVotes.has(company.ticker) ? "✓ Requested" : "▲ Upvote"}</button></div>
            </article>
          ))}
        </div>
        {nextRequested.length > 0 && <div className="community-research-queue"><div><span className="kicker">NEXT IN THE RESEARCH QUEUE</span><strong>Community-requested companies beyond the featured twelve</strong></div><nav>{nextRequested.map((item) => <Link href={dossierHref(item.ticker)} key={item.ticker}><b>{item.ticker}</b><span>{item.vote_count} requests · {item.page_views} readers</span></Link>)}</nav></div>}
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
          <Link className="button dark-button" href="/company/onds">Open the ONDS dossier</Link>
        </div>
        <div className="claim-demo">
          <div className="claim-label"><span>✓</span> Independently verified</div>
          <blockquote>“Ondas operates two distinct business segments: private wireless networks and autonomous drone platforms.”</blockquote>
          <div className="claim-sources">
            <span>01</span><div><strong>2024 Form 10-K</strong><small>SEC filing · p. 6</small></div>
            <span>02</span><div><strong>Investor presentation</strong><small>Company primary source · May 2025</small></div>
          </div>
          <button>View evidence <span>→</span></button>
        </div>
      </section>

    </main>
  );
}
