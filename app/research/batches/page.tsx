import Link from "next/link";
import { Header } from "../../ui";
import { sp500DossierBatch01, sp500DossierBatchAsOf, sp500DossierBatchSource } from "../../data/sp500DossierBatches";

function money(value: number) {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  return `$${Math.round(value / 1_000_000_000)}B`;
}

function dossierPath(ticker: string) {
  const primary = ticker.split("/")[0];
  return `/company/${primary.toLowerCase().replace(".", "-")}`;
}

export default function ResearchBatchesPage() {
  return <main className="research-batches-page">
    <Header />
    <section className="research-batch-hero">
      <div className="container">
        <span className="kicker">S&amp;P 500 DOSSIER PROGRAM</span>
        <h1>Thirty companies.<br/>One owner standard.</h1>
        <p>We are building complete, evidence-linked owner dossiers in descending market-cap batches. Alphabet’s two share classes share one company dossier.</p>
        <div className="research-batch-proof"><strong>Batch 01 · 30 complete</strong><span>Market capitalization snapshot: {sp500DossierBatchAsOf}</span><a href={sp500DossierBatchSource} target="_blank" rel="noreferrer">Nasdaq source ↗</a></div>
      </div>
    </section>
    <section className="container research-batch-section">
      <header><div><span className="kicker">BATCH 01</span><h2>Largest S&amp;P 500 companies</h2></div><p>Each dossier includes the business model, balanced thesis, six financial drivers, five material risks, four watchpoints, six owner questions, six comparables, and primary SEC and company sources.</p></header>
      <div className="research-batch-list">
        <div className="research-batch-head"><span>Rank</span><span>Company</span><span>Market cap</span><span>Status</span></div>
        {sp500DossierBatch01.map(company => <Link href={dossierPath(company.ticker)} key={company.rank}>
          <span>{String(company.rank).padStart(2, "0")}</span>
          <span><i>{company.ticker}</i><strong>{company.name}</strong></span>
          <span>{money(company.marketCap)}</span>
          <span className="batch-complete">Complete</span>
        </Link>)}
      </div>
      <aside className="research-batch-method"><strong>How ranking works</strong><p>Companies are ordered by the Nasdaq Stock Screener market-cap snapshot. Multiple listed share classes of the same operating company are consolidated into one research dossier so the batch contains 30 distinct businesses.</p></aside>
    </section>
  </main>;
}

