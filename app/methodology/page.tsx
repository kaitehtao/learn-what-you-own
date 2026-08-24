import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../ui";

export const metadata: Metadata = {
  title: "Research Methodology, Coverage and Data Definitions | Learn What You Own",
  description: "How Learn What You Own labels dossier completeness, calculates filing-grounded metrics, records freshness, and separates evidence from analysis.",
  alternates: { canonical: "https://learnwhatyouown.com/methodology" },
};

const layers = [
  ["Complete", "The required source-backed fields for that layer are present and the refresh date is visible."],
  ["Partial", "Useful evidence exists, but one or more required fields, periods, or independently verified relationships remain missing."],
  ["Unavailable", "The platform has no approved evidence for that layer. It does not substitute a guess."],
];

export default function MethodologyPage() {
  return <main><Header /><section className="methodology-hero"><div className="container"><span className="kicker">TRANSPARENT BY DESIGN</span><h1>Research methodology,<br />not a black box.</h1><p>Every dossier should tell you what is covered, when it was checked, where each fact came from, and which conclusions remain analysis rather than evidence.</p><div><Link className="button dark-button" href="/companies">Explore company dossiers</Link><Link href="/facts">Read the FACTS framework →</Link></div></div></section>
    <section className="container methodology-page">
      <div className="methodology-intro"><span className="kicker">THE COVERAGE CONTRACT</span><h2>What the status labels mean</h2><p>A dossier can be useful without pretending to be complete. Coverage is measured by research layer, so a company may have complete SEC financial history and only partial supplier intelligence.</p></div>
      <div className="methodology-status-grid">{layers.map(([title, detail]) => <article key={title}><b className={`coverage-state ${title.toLowerCase()}`}>{title}</b><h3>{title}</h3><p>{detail}</p></article>)}</div>
      <section><span className="kicker">SOURCE HIERARCHY</span><h2>Evidence closest to the issuer comes first</h2><ol className="methodology-steps"><li><strong>Regulatory filings</strong><span>SEC EDGAR accessions, XBRL Company Facts, proxy statements, Forms 3/4/5, 13D/G and other filed records.</span></li><li><strong>Official company materials</strong><span>Investor-relations releases, presentations, prepared remarks, transcripts the issuer is authorized to publish, and official websites.</span></li><li><strong>Attributed third-party research</strong><span>External journalism and public data are labeled separately, dated, and linked to the original publisher.</span></li><li><strong>Community and editorial analysis</strong><span>Arguments, models, estimates, and interviews remain visibly distinct from filed facts and require contributor disclosures.</span></li></ol></section>
      <section><span className="kicker">CALCULATIONS</span><h2>Definitions travel with the number</h2><div className="methodology-definition-grid"><article><h3>Market capitalization</h3><p>Current quoted price multiplied by the latest available share count. The displayed date and data provider determine whether it is live or delayed.</p></article><article><h3>Enterprise value</h3><p>Market capitalization plus total debt and preferred interests, less cash and cash equivalents, using consistently dated balance-sheet inputs.</p></article><article><h3>Valuation multiples</h3><p>Market cap or enterprise value divided by the stated trailing, forward, or annualized financial measure. Negative or unavailable denominators are shown as unavailable, not distorted.</p></article><article><h3>Quarterly comparisons</h3><p>Income and cash-flow facts compare equivalent standalone or year-to-date periods. Balance-sheet facts compare period-end observations. Labels state the comparison basis.</p></article></div></section>
      <section><span className="kicker">FRESHNESS &amp; CORRECTIONS</span><h2>The record changes when the evidence changes</h2><p>Automated monitors check accepted 10-K, 10-Q, proxy and material 8-K filings. Filed facts and objective quarter comparisons may update automatically; changes to bull cases, bear cases, risks, valuation framing, and community claims retain their own editorial status. Corrections preserve a review trail rather than silently rewriting history.</p><p><Link href="/community-guidelines">Review the contribution and correction standard →</Link></p></section>
      <aside className="methodology-limit"><strong>Important limitation</strong><p>Completeness describes the platform record—not certainty about the company or the future. Learn What You Own provides research and education, not individualized investment advice.</p></aside>
    </section>
  </main>;
}
