import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../ui";
import { FactsScreener } from "./FactsScreener";

export const metadata: Metadata = {
  title: "FACTS Investment Research | Learn What You Own",
  description: "Apply the Financial, Accounting, Credibility, Timing, and Sector framework to source-linked company research.",
  alternates: { canonical: "https://learnwhatyouown.com/facts" },
};

const factsPdf = "/research/fundamental-investing-facts-methodology-kai-tao.pdf";

export default function FactsPage() {
  return <main className="facts-page">
    <Header />
    <section className="facts-hero"><div className="container">
      <div>
        <span className="kicker">INVESTIGATIVE INVESTING</span>
        <h1>Find the idea.<br />Test the FACTS.<br />Write the decision.</h1>
        <p>Financial, Accounting, Credibility, Timing, and Sector organize the evidence. Your private workspace turns that evidence into a falsifiable thesis and action plan.</p>
        <div><Link className="button dark-button" href="/workspace">Open private FACTS workspace</Link><Link className="button light-button" href="/learn">Learn the research process</Link></div>
      </div>
      <aside><strong>FACTS</strong><ol><li><b>F</b> Financial</li><li><b>A</b> Accounting</li><li><b>C</b> Credibility</li><li><b>T</b> Timing</li><li><b>S</b> Sector</li></ol></aside>
    </div></section>

    <section className="container facts-publication">
      <div>
        <span className="kicker">FOUNDATIONAL READING</span>
        <h2>Read the original FACTS methodology.</h2>
        <p><em>Fundamental Investing</em> explains the investigative process behind the FACTS framework and is available here as a free public resource. The PDF opens on Learn What You Own, so readers can study the source alongside the research tools it inspired.</p>
        <small>15-page PDF · Original document preserved unchanged</small>
      </div>
      <aside><a className="button dark-button" href={factsPdf} target="_blank" rel="noreferrer">Read the full PDF</a><a href={factsPdf} download>Download a copy ↓</a></aside>
    </section>

    <section className="container facts-workflow">
      <article><span>01</span><h2>Generate ideas</h2><p>Use capitalization, index, earnings surprises, insider activity, valuation, and financial flexibility to narrow the universe.</p></article>
      <article><span>02</span><h2>Investigate</h2><p>Read filings and calls, interview management, and independently test the story with customers, suppliers, distributors, competitors, and experts.</p></article>
      <article><span>03</span><h2>Decide and review</h2><p>Compare consensus with your variant view, model scenarios, define entry and exit rules, journal the decision, and complete a postmortem.</p></article>
    </section>

    <section className="container"><FactsScreener /></section>
    <section className="container facts-signal-tools">
      <header><span className="kicker">SPECIALIZED SIGNAL SCREENS</span><h2>Move from a broad list to an investable question</h2></header>
      <div>
        <Link href="/earnings"><strong>Earnings inflections</strong><p>Street consensus, community whisper, revisions, dispersion, actual results, and surprise.</p><span>Open earnings intelligence →</span></Link>
        <Link href="/insider-activity"><strong>Insider conviction</strong><p>Comparable open-market purchases and sales from SEC Forms 3, 4, and 5.</p><span>Open insider screen →</span></Link>
        <Link href="/comps"><strong>Valuation and flexibility</strong><p>Market cap, enterprise value, growth, margins, cash, debt, and current multiples.</p><span>Build a comp table →</span></Link>
      </div>
    </section>
  </main>;
}
