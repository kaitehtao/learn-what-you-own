import Link from "next/link";

const dimensions = [
  { letter: "F", title: "Financial", copy: "Valuation history, comparable-company economics, filed cash generation, balance-sheet capacity, and scenario assumptions.", links: [["Valuation history", "#valuation-history"], ["Comparables", "#comparables"]] },
  { letter: "A", title: "Accounting", copy: "Revenue recognition, capitalized costs, deferred revenue, cash conversion, auditor changes, obligations, and GAAP versus adjusted earnings.", links: [["Filed facts", "#research-foundation"], ["SEC filings", "#filings"]] },
  { letter: "C", title: "Credibility", copy: "Management commitments, incentive alignment, proxy ownership, insider transactions, execution history, and communication quality.", links: [["Ownership", "#ownership"], ["Interviews", "/interviews"]] },
  { letter: "T", title: "Timing", copy: "Earnings, catalysts, seasonality, product cycles, contract milestones, leading indicators, and thesis-breaking triggers.", links: [["Earnings", "/earnings"], ["Monitor", "#changes"]] },
  { letter: "S", title: "Sector", copy: "Market structure, pricing power, growth, barriers, capacity, market share, supply chains, regulation, and disruption.", links: [["Relationships", "#research-foundation"], ["Company comparison", "/comps"]] },
] as const;

export function PublicFactsPanel({ ticker }: { ticker: string }) {
  return <section className="public-facts-panel" id="facts-methodology">
    <header className="public-facts-heading"><div><span className="kicker">FACTS INVESTMENT FRAMEWORK</span><h2>Five tests before conviction</h2><p>The public evidence map stays source-linked. Your scores, targets, channel checks, position rules, and decision journal remain private.</p></div><Link href={`/workspace?ticker=${encodeURIComponent(ticker)}`}>Open private FACTS worksheet →</Link></header>
    <div className="public-facts-grid">{dimensions.map((item) => <article key={item.letter}><header><i>{item.letter}</i><h3>{item.title}</h3></header><p>{item.copy}</p><footer>{item.links.map(([label, href]) => <Link href={href.startsWith("#") ? `/company/${ticker.toLowerCase()}${href}` : href} key={label}>{label} ↗</Link>)}</footer></article>)}</div>
    <footer className="public-facts-boundary"><div><strong>Public evidence map</strong><p>Primary evidence, methodology, company facts, ownership, sector context, and approved research.</p></div><div><strong>Private member workflow</strong><p>Judgment, scores, targets, entry and exit rules, source identities, sizing, and postmortems.</p></div></footer>
  </section>;
}
