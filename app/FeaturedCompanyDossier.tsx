"use client";

import Link from "next/link";
import { useState } from "react";
import type { ResearchCompany } from "./data/universe";
import type { FeaturedDossier } from "./data/featuredDossiers";
import { ResearchDemandButton } from "./ResearchDemandButton";
import { Header } from "./ui";
import { MarketDataPanel } from "./MarketDataPanel";
import { SecFilingsPanel } from "./SecFilingsPanel";
import { WatchlistButton } from "./WatchlistButton";
import { EarningsCallsPanel } from "./EarningsCallsPanel";
import { CompanyConversations } from "./CompanyConversations";
import { ResearchFoundationPanel } from "./ResearchFoundationPanel";
import { CompanyNewsPanel } from "./CompanyNewsPanel";
import { ExternalIntelligencePanel } from "./ExternalIntelligencePanel";
import { CompanyFollowerCount } from "./CompanyFollowerCount";
import { CompanyMarketSnapshot } from "./CompanyMarketSnapshot";
import { StockOwnershipPanel } from "./StockOwnershipPanel";
import { AccessComparison } from "./AccessComparison";
import { ComparableAnalysisPanel } from "./ComparableAnalysisPanel";
import { HistoricalValuationPanel } from "./HistoricalValuationPanel";
import { PublicFactsPanel } from "./PublicFactsPanel";
import { CompanyLogo } from "./CompanyLogo";
import { ExternalResearchLinks } from "./ExternalResearchLinks";

function displayName(name: string, ticker: string) {
  if (ticker.toUpperCase() === "AMC") return "AMC Entertainment Holdings, Inc.";
  if (ticker.toUpperCase() === "CRWV") return "CoreWeave, Inc.";
  if (ticker.toUpperCase() === "ORCL") return "Oracle Corporation";
  if (ticker.toUpperCase() === "SPCX") return "SpaceX (Space Exploration Technologies Corp.)";
  if (ticker.toUpperCase() === "TSLA") return "Tesla, Inc.";
  const formatted = name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace("Nvidia", "NVIDIA").replace("Amazon.Com", "Amazon.com");
  const firstWord = formatted.split(/\s/, 1)[0];
  const normalized = (value: string) => value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return normalized(firstWord) === normalized(ticker) ? `${ticker}${formatted.slice(firstWord.length)}` : formatted;
}

export function FeaturedCompanyDossier({ company, dossier }: { company: ResearchCompany; dossier: FeaturedDossier }) {
  const [sourceIndex, setSourceIndex] = useState<number | null>(null);
  const source = sourceIndex === null ? null : dossier.sources[sourceIndex];
  const hasPerformance = Boolean(dossier.performance);
  const hasComparables = Boolean(dossier.comparables?.length);
  const comparableSourceLabel = (sourceUrl: string) => sourceUrl.includes("stockanalysis.com")
    ? "StockAnalysis"
    : sourceUrl.includes("sec.gov")
      ? "SEC filing"
      : "primary source";
  const sectionNumber = (base: number) => String(base + (hasPerformance ? 1 : 0) + (hasComparables && base >= 4 ? 1 : 0)).padStart(2, "0");

  return <main className="dossier-page">
    <Header />
    <div className="container breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/companies">Companies</Link><span>/</span><strong>{displayName(company.name, company.ticker)}</strong></div>
    <section className="company-hero">
      <div className="container dossier-head">
        <div className="dossier-identity"><CompanyLogo ticker={company.ticker} companyName={displayName(company.name, company.ticker)} size="hero" eager /><div><div className="eyebrow">{company.exchange} · {company.ticker}</div><h1>{displayName(company.name, company.ticker)}</h1><p>{dossier.description}</p></div></div>
        <div className="dossier-actions"><WatchlistButton ticker={company.ticker}/><ResearchDemandButton ticker={company.ticker}/><Link className="share-button" href={`/workspace?ticker=${encodeURIComponent(company.ticker)}`}>Private workspace</Link><Link className="share-button" href={`/contribute?ticker=${encodeURIComponent(company.ticker)}`}>Contribute Research ↗</Link></div>
      </div>
      <CompanyMarketSnapshot ticker={company.ticker} />
      <div className="container metrics-bar featured-metrics">
        <div><small>INDEX MEMBERSHIP</small><strong>{company.memberships.join(" · ")}</strong></div>
        <div><small>SECTOR</small><strong>{company.sector}</strong></div>
        <div><small>PRIMARY SOURCES</small><strong>{dossier.sources.length}</strong><span>Linked below</span></div>
        <div><small>PEOPLE FOLLOWING</small><CompanyFollowerCount ticker={company.ticker} /></div>
        <div><small>DOSSIER STATUS</small><strong className="positive">Flagship coverage</strong><span>Structured owner research</span></div>
        <div><small>DOSSIER LAST UPDATED</small><strong>{dossier.reviewed ?? "July 2026"}</strong><span>Primary-source editorial review</span></div>
      </div>
    </section>
    <div className="dossier-nav"><div className="container"><a href="#market-data">Market data</a><a href="#external-research">Research links</a><a href="#facts-methodology">FACTS</a><a href="#valuation-history">Valuation history</a><a href="#ownership">Ownership</a><a href="#research-foundation">Facts &amp; relationships</a><a href="#external-intelligence">External data</a><a href="#earnings-calls">Calls</a><a href="#news">News</a><a href="#conversations">Conversations</a><a href="#summary">Summary</a>{hasPerformance && <a href="#performance">Performance</a>}<a href="#thesis">Thesis</a><a href="#financials">Drivers</a>{hasComparables && <a href="#comparables">Comparables</a>}<a href="#risks">Risks</a><a href="#changes">Monitor</a><a href="#filings">Filings</a></div></div>
    <div className="container market-data-wide">
      <MarketDataPanel ticker={company.ticker} exchange={company.exchange} />
    </div>
    <div className="container external-research-wide">
      <ExternalResearchLinks ticker={company.ticker} exchange={company.exchange} />
    </div>
    <div className="container public-facts-wide">
      <PublicFactsPanel ticker={company.ticker} />
    </div>
    <div className="container historical-valuation-wide">
      <HistoricalValuationPanel ticker={company.ticker} />
    </div>
    <div className="container stock-ownership-wide">
      <StockOwnershipPanel ticker={company.ticker} />
    </div>
    <div className="container research-foundation-wide">
      <ResearchFoundationPanel ticker={company.ticker} companyName={displayName(company.name, company.ticker)} editorialUpdatedAt={dossier.reviewed ?? "July 2026"} />
    </div>
    <div className="container external-intelligence-wide">
      <ExternalIntelligencePanel ticker={company.ticker} companyName={displayName(company.name, company.ticker)} sector={company.sector} />
    </div>
    <div className="container earnings-calls-wide">
      <EarningsCallsPanel ticker={company.ticker} investorRelationsUrl={dossier.evidenceReview?.officialMaterialsUrl ?? dossier.sources.find(sourceItem => sourceItem.meta.toLowerCase().includes("company"))?.href} earningsUpdatesUrl={dossier.evidenceReview?.earningsUpdatesUrl} transcriptPolicy={dossier.evidenceReview?.transcriptPolicy} />
    </div>
    <div className="container company-news-wide">
      <CompanyNewsPanel ticker={company.ticker} companyName={displayName(company.name, company.ticker)} newsroomUrl={dossier.newsroomUrl} />
    </div>
    <div className="container dossier-layout">
      <article>
        <section className="dossier-section" id="summary">
          <div className="section-title"><div><span className="section-number">01</span><h2>Owner’s summary</h2></div><span className="reviewed">Evidence-linked owner research</span></div>
          <p className="lede">{dossier.lede}</p>
          <div className="summary-grid">
            <div><small>WHAT IT SELLS</small><p>{dossier.sells}</p><button onClick={() => setSourceIndex(0)}>Primary source [1]</button></div>
            <div><small>HOW IT MAKES MONEY</small><p>{dossier.revenueModel}</p><button onClick={() => setSourceIndex(0)}>Primary source [1]</button></div>
            <div><small>WHY THE OPPORTUNITY EXISTS</small><p>{dossier.opportunity}</p><button onClick={() => setSourceIndex(1)}>Company materials [2]</button></div>
            <div><small>WHAT MUST GO RIGHT</small><p>{dossier.mustGoRight}</p><button onClick={() => setSourceIndex(0)}>Risk factors [1]</button></div>
          </div>
          <div className="editor-note"><span>Editor’s note</span><p>{dossier.editorNote}</p></div>
        </section>
        {dossier.performance && <section className="dossier-section" id="performance">
          <div className="section-title"><div><span className="section-number">02</span><h2>Performance—and what drove it</h2></div><span className="reviewed">Price is evidence, not the thesis</span></div>
          <div className="performance-summary"><div><small>{dossier.performance.label}</small><strong>{dossier.performance.value}</strong><span>{dossier.performance.asOf}</span></div><p>{dossier.performance.detail}</p></div>
          <div className="performance-drivers">{dossier.performance.drivers.map((driver, index) => <a href={driver.sourceUrl} target="_blank" rel="noreferrer" key={driver.title}><span>0{index + 1}</span><div><h3>{driver.title}</h3><p>{driver.detail}</p><em>Open supporting evidence ↗</em></div></a>)}</div>
        </section>}
        <section className="dossier-section" id="thesis">
          <div className="section-title"><div><span className="section-number">{sectionNumber(2)}</span><h2>The investment debate</h2></div><span className="reviewed">Balanced thesis</span></div>
          {dossier.evidenceReview && <div className="dossier-evidence-ledger">
            <div><span className="kicker">FILING &amp; CALL EVIDENCE LEDGER</span><h3>Verify the bull and bear case against the latest primary record</h3><p>{dossier.evidenceReview.transcriptPolicy}</p></div>
            <nav>
              <a href={dossier.evidenceReview.annualFilingsUrl} target="_blank" rel="noreferrer"><small>ANNUAL</small><strong>10-K filings</strong><em>Open SEC ↗</em></a>
              <a href={dossier.evidenceReview.quarterlyFilingsUrl} target="_blank" rel="noreferrer"><small>QUARTERLY</small><strong>10-Q filings</strong><em>Open SEC ↗</em></a>
              <a href={dossier.evidenceReview.earningsUpdatesUrl} target="_blank" rel="noreferrer"><small>EARNINGS</small><strong>8-K updates</strong><em>Open SEC ↗</em></a>
              <a href={dossier.evidenceReview.officialMaterialsUrl} target="_blank" rel="noreferrer"><small>COMMENTARY</small><strong>Official call materials</strong><em>Open company ↗</em></a>
              <a href={dossier.evidenceReview.proxyFilingsUrl} target="_blank" rel="noreferrer"><small>GOVERNANCE</small><strong>Proxy filings</strong><em>Open SEC ↗</em></a>
            </nav>
            <span>Evidence ledger reviewed {dossier.evidenceReview.reviewedAt}</span>
          </div>}
          <div className="debate-grid">
            <div className="bull-card"><span className="debate-label">WHY OWN IT</span><h3>{dossier.bullTitle}</h3><ul>{dossier.bull.map(item => <li key={item}>{item}</li>)}</ul><button onClick={() => setSourceIndex(1)}>Open company sources →</button></div>
            <div className="bear-card"><span className="debate-label">WHY NOT OWN IT</span><h3>{dossier.bearTitle}</h3><ul>{dossier.bear.map(item => <li key={item}>{item}</li>)}</ul><button onClick={() => setSourceIndex(0)}>Open risk disclosures →</button></div>
          </div>
          <div className="thesis-breaker"><strong>THE THESIS BREAKER</strong><p>{dossier.thesisBreaker}</p><span>Monitor continuously · High significance</span></div>
        </section>
        <section className="dossier-section" id="financials">
          <div className="section-title"><div><span className="section-number">{sectionNumber(3)}</span><h2>Financial drivers</h2></div><span className="reviewed">What owners should measure</span></div>
          <div className="financial-driver-grid">{dossier.financialDrivers.map(driver => <div key={driver.label}><small>{driver.label}</small><strong>{driver.value}</strong><p>{driver.detail}</p></div>)}</div>
          <p className="research-caveat">Live price data appears above. Fundamental figures should be read directly from the linked SEC filings until an automated, filing-grounded financial model is added.</p>
        </section>
        {dossier.comparables?.length ? <section className="dossier-section" id="comparables">
          <div className="section-title"><div><span className="section-number">{String(4 + (hasPerformance ? 1 : 0)).padStart(2, "0")}</span><h2>Competitors &amp; comparables</h2></div><span className="reviewed">Valuation needs capital-structure context</span></div>
          <p className="comparables-intro">Compare scale, valuation, balance-sheet resilience, and operating quality—not ticker names alone. Public peers are measured on one filing-grounded template; private companies and strategic competitors remain in the selection record below.</p>
          <ComparableAnalysisPanel ticker={company.ticker} />
          <div className="peer-selection-heading"><span className="kicker">PEER SELECTION &amp; CAVEATS</span><h3>Why each company belongs in the comparison</h3></div>
          <div className="comparables-table"><div className="comparables-head"><span>Company</span><span>Relationship</span><span>Valuation snapshot</span><span>Financial status</span></div>{dossier.comparables.map(item => <a href={item.sourceUrl} target="_blank" rel="noreferrer" key={item.name}><span><b className="comparables-field-label">Company</b><strong>{item.name}</strong><small>{item.ticker} · {item.ownership}</small></span><span><b className="comparables-field-label">Relationship</b>{item.relationship}</span><span><b className="comparables-field-label">Valuation snapshot</b>{item.valuation}</span><span><b className="comparables-field-label">Financial status</b>{item.financialStatus}<em>View {comparableSourceLabel(item.sourceUrl)} ↗</em></span></a>)}</div>
          <p className="comparables-source-note">Third-party financial metrics are shown only as dated, attributed reference snapshots. Review the linked source and the company’s SEC filings before relying on a comparison.</p>
        </section> : null}
        <section className="dossier-section" id="risks">
          <div className="section-title"><div><span className="section-number">{sectionNumber(4)}</span><h2>Risks worth monitoring</h2></div><span className="reviewed">Ranked by owner significance</span></div>
          <div className="risk-list">{dossier.risks.map((risk, index) => <div className="risk-row" key={risk.title}><span className="risk-rank">0{index + 1}</span><div><h3>{risk.title}</h3><p>{risk.text}</p></div><span className={`risk-level ${risk.level.toLowerCase()}`}>{risk.level}</span><div className="risk-signal"><small>LEADING INDICATOR</small><strong>{risk.signal}</strong></div></div>)}</div>
        </section>
        <section className="dossier-section" id="changes">
          <div className="section-title"><div><span className="section-number">{sectionNumber(5)}</span><h2>What to monitor</h2></div><span className="reviewed">Living thesis watchpoints</span></div>
          <div className="timeline">{dossier.monitor.map((item, index) => <div key={item.title}><span>0{index + 1}</span><i/><article><em className={item.impact === "BEAR CASE" ? "negative" : item.impact === "NEUTRAL" ? "neutral-tag" : "bullish-tag"}>{item.impact}</em><h3>{item.title}</h3><p>{item.text}</p></article></div>)}</div>
        </section>
        <section className="dossier-section" id="filings">
          <div className="section-title"><div><span className="section-number">{sectionNumber(6)}</span><h2>Research &amp; filings</h2></div><span className="reviewed">Official primary sources</span></div>
          <SecFilingsPanel ticker={company.ticker}/>
          <div className="document-list">{dossier.sources.map((item) => <a href={item.href} target="_blank" rel="noreferrer" key={item.title}><span className="document-type">{item.href.includes("sec.gov") || item.meta.toLowerCase().includes("sec filing") ? "SEC" : "IR"}</span><span><strong>{item.title}</strong><small>{item.meta}</small></span><em>Open source ↗</em></a>)}</div>
        </section>
      </article>
      <aside className="dossier-aside">
        <div className="aside-card"><small>DOSSIER COMPLETENESS</small><div className="completion"><strong>{dossier.completeness ?? 76}%</strong><span><i style={{width:`${dossier.completeness ?? 76}%`}}/></span></div><ul><li className="done">Business model</li><li className="done">Investment debate</li><li className="done">Key risks</li><li className="done">Primary sources</li><li className={(dossier.completeness ?? 76) >= 90 ? "done" : undefined}>Management &amp; capital allocation</li></ul></div>
        <div className="aside-card"><small>KEY QUESTIONS</small><ol>{dossier.questions.map(question => <li key={question}>{question}</li>)}</ol></div>
        <div className="aside-card"><small>COMPETITIVE SET</small><p>{dossier.competitors}</p></div>
        <div className="aside-card"><small>DISCLOSURE</small><p>Educational prototype research, not individualized investment advice. Verify all figures in primary filings.</p></div>
      </aside>
    </div>
    {source && <div className="source-overlay" onClick={() => setSourceIndex(null)}><aside className="source-drawer" onClick={event => event.stopPropagation()}><button className="close" onClick={() => setSourceIndex(null)}>×</button><span className="kicker">PRIMARY SOURCE {String((sourceIndex ?? 0) + 1).padStart(2,"0")}</span><h2>{source.title}</h2><p className="source-meta">{source.meta}</p><blockquote>{source.excerpt}</blockquote><div className="verification-box"><span>✓</span><div><strong>Official source</strong><p>Use the original filing or company publication to verify current details.</p></div></div><a className="button dark-button" href={source.href} target="_blank" rel="noreferrer">Open original source ↗</a></aside></div>}
    <div className="container"><CompanyConversations ticker={company.ticker}/></div>
    <AccessComparison />
  </main>;
}
