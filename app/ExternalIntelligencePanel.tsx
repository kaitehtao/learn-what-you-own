import Link from "next/link";
import { externalSourcesForCompany } from "./data/externalIntelligence";

export function ExternalIntelligencePanel({ ticker, companyName, sector }: { ticker: string; companyName: string; sector: string }) {
  const sources = externalSourcesForCompany(ticker, sector);

  return <section className="external-intelligence" id="external-intelligence">
    <div className="external-intelligence-heading">
      <div>
        <span className="kicker">FREE EXTERNAL DATA · BEYOND SEC FILINGS</span>
        <h2>Independent signals for {ticker}</h2>
        <p>Official open datasets can test the ownership story from outside the company. These are research paths—not claims that {companyName} has a matching record—and every company match must be verified before publication.</p>
      </div>
      <Link href={`/contribute?ticker=${encodeURIComponent(ticker)}&type=${encodeURIComponent("External dataset observation")}`}>Submit an external observation →</Link>
    </div>
    <div className="external-source-grid">
      {sources.map((source) => {
        const contributionHref = `/contribute?ticker=${encodeURIComponent(ticker)}&type=${encodeURIComponent("External dataset observation")}&claim=${encodeURIComponent(`I found a ${source.name} record connected to ${companyName}.`)}&why=${encodeURIComponent(`This ${source.category.toLowerCase()} evidence may add information not organized in the company's SEC filings.`)}&source=${encodeURIComponent(source.href)}`;
        return <article className="external-source-card" key={source.key}>
          <header><span>{source.category}</span><em>{source.access}</em></header>
          <h3>{source.name}</h3>
          <small>{source.publisher}</small>
          <p>{source.description}</p>
          <div><strong>OWNER’S USE</strong><span>{source.dossierUse}</span></div>
          <div className="external-source-caution"><strong>VERIFY BEFORE PUBLISHING</strong><span>{source.caution}</span></div>
          <footer><a href={source.href} target="_blank" rel="noreferrer">Open official dataset ↗</a><Link href={contributionHref}>Submit evidence</Link></footer>
        </article>;
      })}
    </div>
    <div className="external-intelligence-standard">
      <strong>Publication standard</strong>
      <span>Original record retained</span><span>Company identity matched</span><span>Observation date shown</span><span>Limitations disclosed</span><span>Moderator approved</span>
    </div>
  </section>;
}
