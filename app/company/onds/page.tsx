"use client";

import Link from "next/link";
import { useState } from "react";
import { Header } from "../../ui";
import { SecFilingsPanel } from "../../SecFilingsPanel";
import { WatchlistButton } from "../../WatchlistButton";

const risks = [
  { title: "Capital intensity & dilution", level: "High", text: "The company may require external capital before operations generate sustainable free cash flow.", signal: "Cash runway below 12 months" },
  { title: "Customer concentration", level: "High", text: "A small number of government and infrastructure customers can materially shift quarterly revenue.", signal: "Top customer above 25%" },
  { title: "Execution across two segments", level: "Medium", text: "Management must scale autonomous systems while commercializing private wireless networks.", signal: "Repeated milestone delays" },
];

const sources = [
  { id: 1, title: "2024 Form 10-K", meta: "SEC filing · Filed March 31, 2025", excerpt: "The company operates through Ondas Networks and Ondas Autonomous Systems, serving mission-critical private wireless and autonomous drone applications." },
  { id: 2, title: "Q1 2025 shareholder letter", meta: "Company publication · May 15, 2025", excerpt: "Management emphasized defense and public-safety programs as near-term commercial priorities for the autonomous systems segment." },
  { id: 3, title: "Investor presentation", meta: "Company presentation · May 2025", excerpt: "The company describes its opportunity around automated, high-frequency drone operations and mission-critical private networks." },
];

export default function OndasDossier() {
  const [source, setSource] = useState<(typeof sources)[0] | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(false);

  return (
    <main className="dossier-page">
      <Header />
      <div className="container breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/companies">Companies</Link><span>/</span><strong>Ondas Holdings</strong></div>
      <section className="company-hero">
        <div className="container dossier-head">
          <div className="dossier-identity">
            <div className="large-ticker">ONDS</div>
            <div><div className="eyebrow">NASDAQ · ONDS</div><h1>Ondas Holdings</h1><p>Autonomous systems and mission-critical private wireless networks.</p></div>
          </div>
          <div className="dossier-actions">
            <WatchlistButton ticker="ONDS"/>
            <button className="share-button">Share ↗</button>
          </div>
        </div>
        <div className="container metrics-bar">
          <div><small>MARKET CAP</small><strong>$1.24B</strong><span className="demo-label">DEMO</span></div>
          <div><small>REVENUE · TTM</small><strong>$24.8M</strong><span className="demo-label">DEMO</span></div>
          <div><small>CASH</small><strong>$31.2M</strong><span className="demo-label">DEMO</span></div>
          <div><small>DOSSIER SCORE</small><strong className="positive">82 / 100</strong><span>84 sources</span></div>
          <div><small>LAST REVIEWED</small><strong>Today</strong><span>Editor verified</span></div>
        </div>
      </section>

      <div className="dossier-nav"><div className="container"><a href="#summary">Summary</a><a href="#thesis">Thesis</a><a href="#financials">Financials</a><a href="#risks">Risks</a><a href="#changes">What changed</a><a href="#filings">Filings</a><a href="#ask">Ask AI</a></div></div>

      <div className="container dossier-layout">
        <article>
          <section className="dossier-section" id="summary">
            <div className="section-title"><div><span className="section-number">01</span><h2>Owner’s summary</h2></div><span className="reviewed">✓ Reviewed today</span></div>
            <p className="lede">Ondas is building two businesses around infrastructure that must remain reliable when ordinary networks or manual operations are not enough.</p>
            <div className="summary-grid">
              <div><small>WHAT IT SELLS</small><p>Private wireless systems and autonomous drone platforms for rail, defense, public safety, and industrial customers.</p><button onClick={() => setSource(sources[0])}>2 sources</button></div>
              <div><small>HOW IT MAKES MONEY</small><p>Hardware, software, deployment, support, and—increasingly—recurring autonomous-services revenue.</p><button onClick={() => setSource(sources[2])}>3 sources</button></div>
              <div><small>WHY THE OPPORTUNITY EXISTS</small><p>Critical operations need secure networks and automated aerial data collection beyond consumer-grade tools.</p><button onClick={() => setSource(sources[1])}>4 sources</button></div>
              <div><small>WHAT MUST GO RIGHT</small><p>Large programs must convert into repeatable deployments while cash burn and share dilution decline.</p><button onClick={() => setSource(sources[1])}>3 sources</button></div>
            </div>
            <div className="editor-note"><span>Editor’s note</span><p>The core debate is not whether the technology works. It is whether pilots and program wins can become a durable, well-financed commercial engine.</p></div>
          </section>

          <section className="dossier-section" id="thesis">
            <div className="section-title"><div><span className="section-number">02</span><h2>The investment debate</h2></div><span className="reviewed">12 claims · 19 sources</span></div>
            <div className="debate-grid">
              <div className="bull-card"><span className="debate-label">WHY OWN IT</span><h3>A scarce platform at an inflection point</h3><ul><li>Autonomous drone platforms address defense, security, and industrial workflows with growing urgency.</li><li>Regulatory approvals and field experience create meaningful barriers to entry.</li><li>A handful of scaled programs could change the company’s revenue profile.</li></ul><button onClick={() => setSource(sources[2])}>View 9 supporting sources →</button></div>
              <div className="bear-card"><span className="debate-label">WHY NOT OWN IT</span><h3>Potential can be expensive to finance</h3><ul><li>Commercial timing remains difficult to forecast and revenue is uneven.</li><li>Operating losses create financing and dilution risk.</li><li>Complexity across two segments may stretch management attention.</li></ul><button onClick={() => setSource(sources[0])}>View 10 supporting sources →</button></div>
            </div>
            <div className="thesis-breaker"><strong>THE THESIS BREAKER</strong><p>If announced programs fail to produce repeatable revenue before available capital tightens, technological progress may not translate into per-share value.</p><span>Monitor quarterly · High significance</span></div>
          </section>

          <section className="dossier-section" id="financials">
            <div className="section-title"><div><span className="section-number">03</span><h2>Financial pulse</h2></div><span className="demo-label">ILLUSTRATIVE PROTOTYPE DATA</span></div>
            <div className="chart-card">
              <div className="chart-heading"><div><small>REVENUE</small><strong>$24.8M</strong><span>Trailing twelve months</span></div><div className="legend"><span><i className="actual" /> Actual</span><span><i className="estimate" /> Estimate</span></div></div>
              <div className="bar-chart">{[22,30,25,38,48,42,61,76].map((height, index) => <div key={index} className={index > 5 ? "estimated-bar" : ""} style={{height: `${height}%`}}><span>{index < 4 ? `Q${index + 1} 24` : `Q${index - 3} 25`}</span></div>)}</div>
              <div className="financial-row"><div><small>GROSS MARGIN</small><strong>31.4%</strong><span className="positive">↑ 6.2 pts</span></div><div><small>OPERATING CASH FLOW</small><strong>($32.1M)</strong><span className="negative">Cash consuming</span></div><div><small>SHARE COUNT</small><strong>96.4M</strong><span className="negative">↑ 18% YoY</span></div></div>
            </div>
          </section>

          <section className="dossier-section" id="risks">
            <div className="section-title"><div><span className="section-number">04</span><h2>Risks worth monitoring</h2></div><span className="reviewed">Ranked by permanent-loss potential</span></div>
            <div className="risk-list">{risks.map((risk, index) => <div className="risk-row" key={risk.title}><span className="risk-rank">0{index + 1}</span><div><h3>{risk.title}</h3><p>{risk.text}</p></div><span className={`risk-level ${risk.level.toLowerCase()}`}>{risk.level}</span><div className="risk-signal"><small>LEADING INDICATOR</small><strong>{risk.signal}</strong></div></div>)}</div>
          </section>

          <section className="dossier-section" id="changes">
            <div className="section-title"><div><span className="section-number">05</span><h2>What changed</h2></div><span className="reviewed">Since last review</span></div>
            <div className="timeline">
              <div><span>JUL 24</span><i /><article><em className="bullish-tag">BULL CASE STRENGTHENED</em><h3>Defense program opportunity expanded</h3><p>Management disclosed a wider potential deployment scope. Evidence is promising, but the timing and economics remain unverified.</p><button onClick={() => setSource(sources[1])}>Open source ↗</button></article></div>
              <div><span>JUL 11</span><i /><article><em className="neutral-tag">MONITORING</em><h3>Balance-sheet runway reassessed</h3><p>Updated cash and operating-expense assumptions increased the importance of near-term program conversion.</p><button onClick={() => setSource(sources[0])}>Open source ↗</button></article></div>
            </div>
          </section>

          <section className="dossier-section">
            <div className="section-title"><div><span className="section-number">06</span><h2>Research & filings</h2></div><span className="reviewed">8 documents · 2 reports</span></div>
            <div className="document-list">
              <button onClick={() => setSource(sources[0])}><span className="document-type">10-K</span><span><strong>Annual report for fiscal 2024</strong><small>SEC filing · Filed March 31, 2025 · Approved</small></span><em>Open source ↗</em></button>
              <button onClick={() => setSource(sources[1])}><span className="document-type">LTR</span><span><strong>Q1 2025 shareholder letter</strong><small>Company publication · May 15, 2025 · Approved</small></span><em>Open source ↗</em></button>
              <Link href="/research/ondas-owner-manual"><span className="document-type report">RPT</span><span><strong>Ondas Holdings: The owner’s manual</strong><small>Founding research · Long-term thesis · Editor reviewed</small></span><em>Read report →</em></Link>
            </div>
            <SecFilingsPanel ticker="ONDS" />
          </section>

          <section className="ask-section" id="ask">
            <span className="kicker">ASK THE DOSSIER</span><h2>What do you need to understand?</h2><p>Answers are limited to approved ONDS research and cite the evidence used.</p>
            <div className="question-box"><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. What would invalidate the bull thesis?" onKeyDown={(e) => e.key === "Enter" && setAnswer(true)} /><button onClick={() => setAnswer(true)}>Ask →</button></div>
            <div className="prompt-chips">{["Explain the business", "Assess management credibility", "What changed this quarter?", "Compare competitors"].map(prompt => <button key={prompt} onClick={() => {setQuestion(prompt); setAnswer(true)}}>{prompt}</button>)}</div>
            {answer && <div className="ai-answer"><div className="ai-mark">LW</div><div><small>RESEARCH SYNTHESIS · 3 SOURCES</small><p>The most important thesis risk is a mismatch between <strong>commercial timing and available capital</strong>. The company has demonstrated technical and regulatory progress, but recurring program revenue must scale before financing needs materially dilute existing owners. <button onClick={() => setSource(sources[0])}>[1]</button> <button onClick={() => setSource(sources[1])}>[2]</button></p><span>This is an AI-assisted synthesis of approved sources, not investment advice.</span></div></div>}
          </section>
        </article>

        <aside className="dossier-aside">
          <div className="aside-card"><small>DOSSIER COMPLETENESS</small><div className="completion"><strong>82%</strong><span><i /></span></div><ul><li className="done">Business model</li><li className="done">Investment thesis</li><li className="done">Key risks</li><li className="done">Financial history</li><li>Management scorecard</li></ul></div>
          <div className="aside-card"><small>KEY QUESTIONS</small><ol><li>When do program wins become recurring revenue?</li><li>How much capital is needed to reach breakeven?</li><li>Which segment deserves most investment?</li></ol><Link href="#ask">Ask a question →</Link></div>
          <div className="aside-card"><small>EDITORIAL WORKFLOW</small><p>One proposed correction and one filing update are waiting for review.</p><Link href="/admin">Open editor preview →</Link></div>
          <div className="aside-card"><small>DISCLOSURE</small><p>Demonstration research only. Financial figures and events may be illustrative.</p></div>
        </aside>
      </div>

      {source && <div className="source-overlay" onClick={() => setSource(null)}><aside className="source-drawer" onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setSource(null)}>×</button><span className="kicker">SOURCE {String(source.id).padStart(2,"0")}</span><h2>{source.title}</h2><p className="source-meta">{source.meta}</p><blockquote>{source.excerpt}</blockquote><div className="verification-box"><span>✓</span><div><strong>Approved primary source</strong><p>Reviewed by an editor for provenance and relevance.</p></div></div><button className="button dark-button">Open original source ↗</button></aside></div>}
    </main>
  );
}
