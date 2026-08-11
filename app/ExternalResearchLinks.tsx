import { externalResearchLinks } from "./data/externalResearchLinks";

export function ExternalResearchLinks({ ticker, exchange }: { ticker: string; exchange: string }) {
  const links = externalResearchLinks(ticker, exchange);

  return <section className="external-research-links" id="external-research">
    <header>
      <div>
        <span className="kicker">SUPPLEMENTAL RESEARCH · THIRD-PARTY DESTINATIONS</span>
        <h2>Continue researching {ticker}</h2>
        <p>Open the same ticker across useful market-data, charting, fundamentals, analysis, and investor-conversation services. These links supplement the evidence in this dossier; third-party figures and opinions are not verified Learn What You Own claims.</p>
      </div>
    </header>
    <div className="external-research-link-grid">
      {links.map((link) => <a href={link.href} target="_blank" rel="noopener noreferrer" className="external-research-link" key={link.key}>
        <span className="external-research-mark" aria-hidden="true">{link.mark}</span>
        <span><small>{link.category}</small><strong>{link.name}</strong><em>{link.description}</em></span>
        <b aria-hidden="true">↗</b>
      </a>)}
    </div>
    <footer><strong>Research discipline</strong><span>Cross-check material figures against SEC filings and official company disclosures before relying on them.</span></footer>
  </section>;
}
