"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Header } from "./ui";
import { companySlug, researchUniverse } from "./data/universe";

const companies = [
  { ticker: "ONDS", name: "Ondas Holdings", sector: "Autonomous Systems", updated: "2h ago", sources: 84, score: 82, note: "New defense program award" },
  { ticker: "NVDA", name: "NVIDIA", sector: "Semiconductors", updated: "4h ago", sources: 312, score: 96, note: "Supply chain map refreshed" },
  { ticker: "BB", name: "BlackBerry", sector: "Infrastructure Software", updated: "Yesterday", sources: 146, score: 91, note: "QNX backlog analysis" },
  { ticker: "BE", name: "Bloom Energy", sector: "Clean Energy", updated: "Yesterday", sources: 109, score: 88, note: "Margin thesis revised" },
  { ticker: "RKLB", name: "Rocket Lab", sector: "Space Systems", updated: "2d ago", sources: 167, score: 93, note: "Neutron milestone added" },
  { ticker: "PLTR", name: "Palantir", sector: "Enterprise AI", updated: "3d ago", sources: 221, score: 95, note: "Commercial cohort review" },
];

const updates = [
  { date: "Today", ticker: "ONDS", title: "Management expanded the defense opportunity", impact: "Bull case strengthened", type: "Management statement" },
  { date: "Today", ticker: "NVDA", title: "A key supplier raised capacity guidance", impact: "Dependency updated", type: "Primary source" },
  { date: "Yesterday", ticker: "BB", title: "QNX royalty backlog reached a new high", impact: "Thesis unchanged", type: "Company filing" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const matches = useMemo(
    () => {
      if (!query.length) return [];
      const normalized = query.toLowerCase();
      const founding = companies.filter((company) => `${company.ticker} ${company.name} ${company.sector}`.toLowerCase().includes(normalized)).map((company) => ({...company, founding: company.ticker === "ONDS"}));
      const indexMatches = researchUniverse.filter((company) => `${company.ticker} ${company.name} ${company.sector} ${company.memberships.join(" ")}`.toLowerCase().includes(normalized)).slice(0, 7).map((company) => ({...company, updated: company.memberships.join(" · "), sources: 0, score: 0, note: "Founding coverage", founding: false}));
      return [...founding, ...indexMatches].filter((company, index, all) => all.findIndex((item) => item.ticker === company.ticker) === index).slice(0, 8);
    },
    [query]
  );

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
          <div className="popular">Popular <Link href="/company/onds">ONDS</Link><Link href="/companies">NVDA</Link><Link href="/companies">AI infrastructure</Link><Link href="/companies">QNX</Link></div>
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
          <div><span className="kicker">RESEARCH, NOT NOISE</span><h2>Start with the businesses being studied.</h2></div>
          <Link className="text-link" href="/companies">Explore all dossiers <span>→</span></Link>
        </div>
        <div className="company-grid">
          {companies.map((company, index) => (
            <Link className="company-card" href={company.ticker === "ONDS" ? "/company/onds" : "/companies"} key={company.ticker}>
              <div className="card-top">
                <div className={`ticker-icon tint-${index + 1}`}>{company.ticker}</div>
                <div className="score-ring" style={{"--score": `${company.score * 3.6}deg`} as React.CSSProperties}><span>{company.score}</span></div>
              </div>
              <h3>{company.name}</h3>
              <p className="ticker-line">{company.ticker} · {company.sector}</p>
              <div className="card-update"><span>↗</span><div><small>LATEST UPDATE</small><p>{company.note}</p></div></div>
              <div className="card-meta"><span>{company.sources} sources</span><span>Updated {company.updated}</span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="dark-section">
        <div className="container">
          <div className="section-heading light">
            <div><span className="kicker">THE CHANGELOG</span><h2>What changed—and why it matters.</h2></div>
            <p>Every meaningful development, translated into thesis impact.</p>
          </div>
          <div className="change-table">
            {updates.map((update) => (
              <Link href={update.ticker === "ONDS" ? "/company/onds" : "/companies"} className="change-row" key={update.ticker}>
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
