import { desc } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "../../db";
import { emergingCompanyDossiers } from "../../db/schema";
import { Header } from "../ui";

export const dynamic = "force-dynamic";

export default async function EmergingCompaniesPage() {
  let dossiers: (typeof emergingCompanyDossiers.$inferSelect)[] = [];
  try {
    dossiers = await getDb().select().from(emergingCompanyDossiers).orderBy(desc(emergingCompanyDossiers.verifiedAt)).limit(100);
  } catch (error) {
    console.error("Emerging-company directory unavailable", error);
  }
  const ipos = dossiers.filter((item) => item.companyType === "upcoming_ipo");
  const privateCompanies = dossiers.filter((item) => item.companyType === "private");
  return <main><Header/>
    <section className="emerging-hero"><div className="container"><span className="kicker">BEFORE THE PUBLIC TICKER</span><h1>Upcoming IPOs and<br/>private-company research.</h1><p>Approved dossiers built from issuer materials, SEC filings, roadshows, and clearly attributed member research.</p><div className="emerging-tabs"><Link className="active" href="/emerging-companies">IPOs &amp; approved private dossiers</Link><Link href="/emerging-companies/y-combinator">Y Combinator classes</Link></div></div></section>
    <section className="container emerging-directory">
      <div className="emerging-section-heading"><div><span className="kicker">OFFERING PIPELINE</span><h2>Upcoming IPOs</h2></div><span>{ipos.length} approved</span></div>
      <div className="emerging-grid">{ipos.map((item)=><Link href={`/emerging-companies/${item.slug}`} className="emerging-card" key={item.slug}><span>UPCOMING IPO</span><h3>{item.companyName}</h3><strong>{item.proposedTicker||"Ticker not announced"}{item.proposedExchange?` · ${item.proposedExchange}`:""}</strong><p>{item.summary}</p><footer><em>{item.expectedIpoDate?`Expected ${item.expectedIpoDate}`:"Date not announced"}</em><b>Open dossier →</b></footer></Link>)}</div>
      {!ipos.length&&<div className="emerging-empty"><strong>No IPO dossiers approved yet.</strong><p>Members can submit an issuer source, S-1, expected date, and optional roadshow PDF for editorial review.</p></div>}
      <div className="emerging-section-heading private-heading"><div><span className="kicker">APPROVED PRIVATE COVERAGE</span><h2>Private companies</h2></div><span>{privateCompanies.length} approved</span></div>
      <div className="emerging-grid">{privateCompanies.map((item)=><Link href={`/emerging-companies/${item.slug}`} className="emerging-card private" key={item.slug}><span>PRIVATE COMPANY</span><h3>{item.companyName}</h3><strong>Approved research profile</strong><p>{item.summary}</p><footer><em>Verified by @{item.verifiedBy}</em><b>Open dossier →</b></footer></Link>)}</div>
      {!privateCompanies.length&&<div className="emerging-empty"><strong>No private-company dossiers approved yet.</strong><p>Private companies appear here only after an editor approves the source record and proposed dossier.</p></div>}
    </section>
  </main>;
}
