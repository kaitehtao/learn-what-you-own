import type { Metadata } from "next";
import Link from "next/link";
import ycSummer2026 from "../../data/ycSummer2026.json";
import { Header } from "../../ui";
import { YcBatchExplorer, type YcCompany } from "./YcBatchExplorer";

export const metadata: Metadata = {
  title: "Y Combinator Company Research by Class | Learn What You Own",
  description: "Explore verified Y Combinator class rosters, founder profiles, company descriptions, and evidence-linked private-company research.",
  alternates: { canonical: "https://learnwhatyouown.com/emerging-companies/y-combinator" },
};

export default function YCombinatorClassesPage() {
  return <main><Header />
    <section className="emerging-hero yc-hero"><div className="container"><span className="kicker">PRIVATE MARKET CLASS RESEARCH</span><h1>Explore every<br/>Y Combinator class.</h1><p>Start with the official Summer 2026 roster, then build evidence-linked private-company dossiers and a transparent, research-backed ranking within each class.</p><div className="emerging-tabs"><Link href="/emerging-companies">IPOs &amp; approved private dossiers</Link><Link className="active" href="/emerging-companies/y-combinator">Y Combinator classes</Link></div></div></section>
    <nav className="container yc-class-tabs" aria-label="Y Combinator classes"><strong>CLASSES</strong><Link className="active" href="/emerging-companies/y-combinator">Summer 2026 <span>{ycSummer2026.companies.length}</span></Link><span>Future classes will appear here as verified rosters.</span></nav>
    <YcBatchExplorer companies={ycSummer2026.companies as YcCompany[]} sourceAsOf={ycSummer2026.sourceAsOf} />
  </main>;
}
