import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../ui";
import { SecFilingsPanel } from "../../SecFilingsPanel";
import { MarketDataPanel } from "../../MarketDataPanel";
import { WatchlistButton } from "../../WatchlistButton";
import { companySlug, researchUniverse, tickerFromSlug } from "../../data/universe";

function displayName(name: string) {
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace("3m", "3M").replace("At&t", "AT&T").replace("Cvs", "CVS")
    .replace("Ibm", "IBM").replace("Hp Inc", "HP Inc");
}

export function generateStaticParams() {
  return researchUniverse.map((company) => ({ ticker: companySlug(company.ticker) }));
}

export default async function CompanyStarterPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: slug } = await params;
  const ticker = tickerFromSlug(slug);
  const company = researchUniverse.find((item) => item.ticker === ticker);
  if (!company) notFound();

  return <main><Header />
    <div className="container breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/companies">Companies</Link><span>/</span><strong>{company.ticker}</strong></div>
    <section className="starter-company-hero"><div className="container"><div className="starter-company-title"><span>{company.ticker}</span><div><small>{company.exchange} · {company.ticker}</small><h1>{displayName(company.name)}</h1><p>{company.sector}</p><div className="starter-memberships">{company.memberships.map((index) => <em className={`membership-badge ${index === "S&P 500" ? "sp-badge" : index === "Russell 2000" ? "russell-badge" : index === "Russell 3000" ? "r3000-badge" : index === "Extended Coverage" ? "coverage-badge" : "qqq-badge"}`} key={index}>{index === "Extended Coverage" ? index : `${index} member`}</em>)}</div></div></div><div className="starter-company-actions"><WatchlistButton ticker={company.ticker}/><Link href="/contribute">Contribute expertise →</Link></div></div></section>
    <section className="container starter-dossier">
      <div className="coverage-banner"><span>FOUNDING COVERAGE</span><h2>This owner’s manual is ready to be built.</h2><p>The company and ticker are now part of the research universe. Verified claims, sources, business-model analysis, theses, filings, and expert contributions will be added through the editorial workflow.</p></div>
      <div className="starter-metrics"><div><small>INDEX MEMBERSHIP</small><strong>{company.memberships.join(" · ")}</strong></div><div><small>SECTOR</small><strong>{company.sector}</strong></div><div><small>EXCHANGE</small><strong>{company.exchange}</strong></div><div><small>DOSSIER STATUS</small><strong className="amber-text">Not yet researched</strong></div></div>
      <MarketDataPanel ticker={company.ticker} exchange={company.exchange} />
      <div className="starter-sections">
        {["Owner’s summary","Business model","Why own it","Why not own it","Financial dashboard","What changed","Earnings & filings","Competitive landscape"].map((section, index) => <div key={section}><span>{String(index + 1).padStart(2,"0")}</span><strong>{section}</strong><em>{section === "Earnings & filings" ? "SEC links available" : "Awaiting research"}</em></div>)}
      </div>
      <SecFilingsPanel ticker={company.ticker} />
      <div className="coverage-actions"><div><span className="kicker">HELP BUILD THIS DOSSIER</span><h2>Know this business deeply?</h2><p>Submit a fact, source, correction, or question for management. Every contribution is reviewed before publication.</p></div><Link className="button dark-button" href="/contribute">Start a contribution →</Link></div>
    </section>
  </main>;
}
