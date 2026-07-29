"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "../ui";
import { companySlug, indexCounts, researchUniverse, researchUniverseAsOf, universeSources } from "../data/universe";

const PAGE_SIZE = 40;
const sectors = [...new Set(researchUniverse.map((company) => company.sector))].sort();

function displayName(name: string) {
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace("3m", "3M").replace("At&t", "AT&T").replace("Cvs", "CVS")
    .replace("Ibm", "IBM").replace("Hp Inc", "HP Inc");
}

export default function Companies() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [membership, setMembership] = useState("All companies");
  const [sort, setSort] = useState("Ticker A–Z");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = researchUniverse.filter((company) => {
      const matchesSearch = !normalized || `${company.ticker} ${company.name} ${company.sector} ${company.memberships.join(" ")}`.toLowerCase().includes(normalized);
      const matchesSector = sector === "All sectors" || company.sector === sector;
      const matchesMembership = membership === "All companies" || company.memberships.includes(membership as "S&P 500" | "Russell 2000" | "Russell 3000" | "Nasdaq-100 (QQQ)");
      return matchesSearch && matchesSector && matchesMembership;
    });
    return [...result].sort((a, b) => {
      if (sort === "Company A–Z") return a.name.localeCompare(b.name);
      if (sort === "Largest index weight") return Math.max(...Object.values(b.indexWeights)) - Math.max(...Object.values(a.indexWeights));
      return a.ticker.localeCompare(b.ticker);
    });
  }, [query, sector, membership, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  return <main><Header />
    <section className="directory-hero"><div className="container"><span className="kicker">THE RESEARCH UNIVERSE</span><h1>Every ticker is a door<br />into a real business.</h1><p>One unified library spanning large-cap leaders and smaller public companies—organized for understanding, not separated into market silos.</p><div className="directory-search">⌕ <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder={`Search ${researchUniverse.length.toLocaleString()} tickers and companies`} aria-label="Search the company research universe" /></div><div className="universe-note"><span>Universe verified {researchUniverseAsOf}</span><span>{researchUniverse.length.toLocaleString()} securities</span><span>Membership clearly labeled</span></div></div></section>
    <section className="container directory-section">
      <div className="index-callout"><div><span className="ticker-icon tint-1">ONDS</span><div><small>FOUNDING DOSSIER · EXTENDED COVERAGE</small><strong>Ondas Holdings</strong><p>Our fully developed prototype shows the research standard every company page will grow into.</p></div></div><Link href="/company/onds">Open flagship dossier →</Link></div>
      <div className="universe-explainer expanded"><div><span className="membership-badge sp-badge">S&P 500</span><p>{indexCounts["S&P 500"]} securities</p></div><div><span className="membership-badge qqq-badge">Nasdaq-100 (QQQ)</span><p>{indexCounts["Nasdaq-100 (QQQ)"]} securities</p></div><div><span className="membership-badge r3000-badge">Russell 3000</span><p>{indexCounts["Russell 3000"].toLocaleString()} securities</p></div><div><span className="membership-badge russell-badge">Russell 2000</span><p>{indexCounts["Russell 2000"].toLocaleString()} securities</p></div><strong>One deduplicated company library.</strong></div>
      <div className="filter-row"><strong>{filtered.length.toLocaleString()} securities</strong><div><select value={membership} onChange={(event) => {setMembership(event.target.value); setPage(1);}}><option>All companies</option><option>S&P 500</option><option>Nasdaq-100 (QQQ)</option><option>Russell 3000</option><option>Russell 2000</option></select><select value={sector} onChange={(event) => { setSector(event.target.value); setPage(1); }}><option>All sectors</option>{sectors.map((item) => <option key={item}>{item}</option>)}</select><select value={sort} onChange={(event) => {setSort(event.target.value); setPage(1);}}><option>Ticker A–Z</option><option>Company A–Z</option><option>Largest index weight</option></select></div></div>
      <div className="directory-table"><div className="directory-row universe-row directory-labels"><span>COMPANY</span><span>INDEX MEMBERSHIP</span><span>SECTOR</span><span>EXCHANGE</span><span /></div>{visible.map((company) => <Link href={`/company/${companySlug(company.ticker)}`} className="directory-row universe-row" key={company.ticker}><span className="company-cell"><i>{company.ticker}</i><span><strong>{displayName(company.name)}</strong><small>{company.ticker}</small></span></span><span className="membership-list">{company.memberships.map((index) => <em className={`membership-badge ${index === "S&P 500" ? "sp-badge" : index === "Russell 2000" ? "russell-badge" : index === "Russell 3000" ? "r3000-badge" : "qqq-badge"}`} key={index}>{index}</em>)}</span><span>{company.sector}</span><span>{company.exchange}</span><span>→</span></Link>)}</div>
      {visible.length === 0 && <div className="directory-empty"><strong>No companies found.</strong><p>Try another ticker, company name, sector, or index-membership filter.</p></div>}
      <div className="pagination"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>← Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next →</button></div>
      <p className="index-source">Constituent data reflects active listed equity holdings of index-tracking funds as of {researchUniverseAsOf}. Membership changes over time. {universeSources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.label}>{source.label} ↗</a>)}</p>
    </section>
  </main>;
}
