import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../ui";
import { learningGuides } from "./guides";

export const metadata: Metadata = {
  title: "Learn How to Research Stocks | Learn What You Own",
  description: "Evidence-first guides to researching stocks, reading SEC filings, evaluating insider activity, comparing companies, and understanding ownership.",
  alternates: { canonical: "https://learnwhatyouown.com/learn" },
  openGraph: {
    title: "Learn How to Research Stocks",
    description: "Practical, evidence-first investing education from Learn What You Own.",
    url: "https://learnwhatyouown.com/learn",
    type: "website",
  },
};

export default function LearnPage() {
  return <main>
    <Header />
    <section className="learn-hero">
      <div className="container learn-hero-grid">
        <div><span className="kicker">OWNER EDUCATION</span><h1>Learn how to research what you own.</h1><p>Practical guides for turning filings, financial statements, ownership data, and valuation comparisons into better questions.</p></div>
        <aside><strong>Evidence before opinion</strong><span>Each guide connects the research method to primary sources and tools you can use on LearnWhatYouOwn.</span></aside>
      </div>
    </section>
    <section className="container learn-directory">
      <header><div><span className="kicker">START WITH A QUESTION</span><h2>Build a repeatable owner process.</h2></div><p>These pages are organized around real investor questions—not disconnected keywords. Begin with the complete process or choose the part of your research that needs work.</p></header>
      <div className="learn-guide-grid">
        {learningGuides.map((guide, index) => <Link href={`/learn/${guide.slug}`} key={guide.slug}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <small>{guide.searchIntent}</small>
          <h2>{guide.title}</h2>
          <p>{guide.description}</p>
          <footer><b>{guide.readingTime}</b><em>Read guide →</em></footer>
        </Link>)}
      </div>
      <aside className="learn-disclaimer"><strong>Educational purpose</strong><p>These guides teach a research process. They do not provide individualized investment advice or recommend buying or selling any security.</p></aside>
      <aside className="learn-facts-reading"><div><span className="kicker">FREE PUBLIC READING</span><h2>Investigative Investing and the FACTS methodology</h2><p>Read the 15-page source document behind the Financial, Accounting, Credibility, Timing, and Sector framework, then apply it in the public FACTS research screen or your private workspace.</p></div><div><Link className="button dark-button" href="/facts">Explore FACTS</Link><a href="/research/fundamental-investing-facts-methodology-kai-tao.pdf" target="_blank" rel="noreferrer">Read the PDF ↗</a></div></aside>
    </section>
  </main>;
}
