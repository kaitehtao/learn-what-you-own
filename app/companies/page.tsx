"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "../ui";
import { companySlug, sp500AsOf, sp500Companies, sp500SourceUrl } from "../data/sp500";

const PAGE_SIZE = 40;
const sectors = [...new Set(sp500Companies.map((company) => company.sector))].sort();

function displayName(name: string) {
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace("3m", "3M").replace("At&t", "AT&T").replace("Cvs", "CVS")
    .replace("Ibm", "IBM").replace("Hp Inc", "HP Inc");
}

export default function Companies() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [sort, setSort] = useState("Index weight");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = sp500Companies.filter((company) => {
      const matchesSearch = !normalized || `${company.ticker} ${company.name} ${company.sector}`.toLowerCase().includes(normalized);
      return matchesSearch && (sector === "All sectors" || company.sector === sector);
    });
    return [...result].sort((a, b) => {
      if (sort === "Ticker A–Z") return a.ticker.localeCompare(b.ticker);
      if (sort === "Company A–Z") return a.name.localeCompare(b.name);
      return b.weight - a.weight;
    });
  }, [query, sector, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  return <main><Header />
    <section className="directory-hero"><div className="container"><span className="kicker">S&P 500 COMPANY LIBRARY</span><h1>Five hundred businesses.<br />One research standard.</h1><p>Start with every company in the S&P 500—503 listed share classes—organized for research rather than trading.</p><div className="directory-search">⌕ <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search 503 tickers and companies" aria-label="Search S&P 500 companies" /></div><div className="universe-note"><span>Index universe verified {sp500AsOf}</span><span>503 securities</span><span>11 sectors</span></div></div></section>
    <section className="container directory-section">
      <div className="index-callout"><div><span className="ticker-icon tint-1">ON</span><div><small>FOUNDING DOSSIER · OUTSIDE THE S&P 500</small><strong>Ondas Holdings</strong><p>Our fully developed prototype shows the research standard the S&P 500 library will grow into.</p></div></div><Link href="/company/onds">Open flagship dossier →</Link></div>
      <div className="filter-row"><strong>{filtered.length} securities</strong><div><select value={sector} onChange={(event) => { setSector(event.target.value); setPage(1); }}><option>All sectors</option>{sectors.map((item) => <option key={item}>{item}</option>)}</select><select value={sort} onChange={(event) => {setSort(event.target.value); setPage(1);}}><option>Index weight</option><option>Ticker A–Z</option><option>Company A–Z</option></select></div></div>
      <div className="directory-table"><div className="directory-row sp500-row directory-labels"><span>COMPANY</span><span>SECTOR</span><span>EXCHANGE</span><span>INDEX WEIGHT</span><span /></div>{visible.map((company) => <Link href={`/company/${companySlug(company.ticker)}`} className="directory-row sp500-row" key={company.ticker}><span className="company-cell"><i>{company.ticker.slice(0,2)}</i><span><strong>{displayName(company.name)}</strong><small>{company.ticker}</small></span></span><span>{company.sector}</span><span>{company.exchange}</span><span className="weight-cell"><i><b style={{width: `${Math.max(3, Math.min(100, company.weight / 7.75 * 100))}%`}} /></i>{company.weight.toFixed(2)}%</span><span>→</span></Link>)}</div>
      {visible.length === 0 && <div className="directory-empty"><strong>No companies found.</strong><p>Try another ticker, company name, or sector.</p></div>}
      <div className="pagination"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>← Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next →</button></div>
      <p className="index-source">Constituent data reflects the listed equity holdings of an S&P 500 index-tracking fund as of {sp500AsOf}. Index membership and weights change over time. <a href={sp500SourceUrl} target="_blank" rel="noreferrer">Open source data ↗</a></p>
    </section>
  </main>;
}
