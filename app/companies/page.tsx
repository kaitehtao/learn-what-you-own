"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "../ui";
import { companySlug, indexCounts, researchUniverse, researchUniverseAsOf, universeSources } from "../data/universe";
import { companySearchScore, rankedCompanyMatches } from "../data/companySearch";

const PAGE_SIZE = 40;
const sectors = [...new Set(researchUniverse.map((company) => company.sector))].sort();
const indexOrder = ["S&P 500", "Nasdaq-100 (QQQ)", "Russell 3000", "Russell 2000", "Extended Coverage"];

function displayName(name: string) {
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace("3m", "3M").replace("At&t", "AT&T").replace("Cvs", "CVS")
    .replace("Ibm", "IBM").replace("Hp Inc", "HP Inc");
}

function formatMarketCap(value: number | null) {
  if (value === null) return "Not available";
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

function indexWeightFor(company: (typeof researchUniverse)[number], selectedMembership: string) {
  if (selectedMembership !== "All companies" && selectedMembership !== "Extended Coverage") {
    const value = company.indexWeights[selectedMembership as keyof typeof company.indexWeights];
    return value && value > 0 ? value : null;
  }
  const availableWeights = Object.values(company.indexWeights).filter((value) => value > 0);
  return availableWeights.length ? Math.max(...availableWeights) : null;
}

export default function Companies() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [membership, setMembership] = useState("All companies");
  const [sort, setSort] = useState("Market cap");
  const [direction, setDirection] = useState("Descending");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matchingTickers = normalized
      ? new Set(rankedCompanyMatches(researchUniverse, normalized).map((company) => company.ticker))
      : null;
    const result = researchUniverse.filter((company) => {
      const matchesSearch = !matchingTickers || matchingTickers.has(company.ticker);
      const matchesSector = sector === "All sectors" || company.sector === sector;
      const matchesMembership = membership === "All companies" || company.memberships.includes(membership as "S&P 500" | "Russell 2000" | "Russell 3000" | "Nasdaq-100 (QQQ)" | "Extended Coverage");
      return matchesSearch && matchesSector && matchesMembership;
    });
    const multiplier = direction === "Ascending" ? 1 : -1;
    return [...result].sort((a, b) => {
      if (normalized) {
        const relevanceDifference = companySearchScore(b, normalized) - companySearchScore(a, normalized);
        if (relevanceDifference !== 0) return relevanceDifference;
      }
      if (sort === "Market cap") {
        if (a.marketCap === null) return b.marketCap === null ? a.ticker.localeCompare(b.ticker) : 1;
        if (b.marketCap === null) return -1;
        return (a.marketCap - b.marketCap) * multiplier || a.ticker.localeCompare(b.ticker);
      }
      if (sort === "Index weight") {
        const aWeight = indexWeightFor(a, membership);
        const bWeight = indexWeightFor(b, membership);
        if (aWeight === null) return bWeight === null ? a.ticker.localeCompare(b.ticker) : 1;
        if (bWeight === null) return -1;
        return (aWeight - bWeight) * multiplier || a.ticker.localeCompare(b.ticker);
      }
      if (sort === "Company") return a.name.localeCompare(b.name) * multiplier;
      if (sort === "Index membership") {
        const aRank = Math.min(...a.memberships.map((item) => indexOrder.indexOf(item)));
        const bRank = Math.min(...b.memberships.map((item) => indexOrder.indexOf(item)));
        return (aRank - bRank) * multiplier || a.ticker.localeCompare(b.ticker);
      }
      return a.ticker.localeCompare(b.ticker) * multiplier;
    });
  }, [query, sector, membership, sort, direction]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  return <main><Header />
    <section className="directory-hero"><div className="container"><span className="kicker">THE RESEARCH UNIVERSE</span><h1>Every ticker is a door<br />into a real business.</h1><p>One unified library spanning large-cap leaders and smaller public companies—organized for understanding, not separated into market silos.</p><div className="directory-search">⌕ <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder={`Search ${researchUniverse.length.toLocaleString()} tickers and companies`} aria-label="Search the company research universe" autoComplete="off" /></div><div className="universe-note"><span>Universe verified {researchUniverseAsOf}</span><span>{researchUniverse.length.toLocaleString()} securities</span><span>Membership clearly labeled</span></div></div></section>
    <section className="container directory-section">
      <div className="index-callout"><div><span className="ticker-icon tint-1">ONDS</span><div><small>FOUNDING DOSSIER · EXTENDED COVERAGE</small><strong>Ondas Holdings</strong><p>Our fully developed prototype shows the research standard every company page will grow into.</p></div></div><Link href="/company/onds">Open flagship dossier →</Link></div>
      <div className="emerging-callout"><div><span>PRE-IPO</span><div><strong>Research companies before a public ticker exists.</strong><p>Browse approved upcoming IPO and private-company dossiers, including issuer roadshow materials.</p></div></div><Link href="/emerging-companies">Open IPO &amp; private directory →</Link></div>
      <div className="universe-explainer expanded"><div><span className="membership-badge sp-badge">S&P 500</span><p>{indexCounts["S&P 500"]} securities</p></div><div><span className="membership-badge qqq-badge">Nasdaq-100 (QQQ)</span><p>{indexCounts["Nasdaq-100 (QQQ)"]} securities</p></div><div><span className="membership-badge r3000-badge">Russell 3000</span><p>{indexCounts["Russell 3000"].toLocaleString()} securities</p></div><div><span className="membership-badge russell-badge">Russell 2000</span><p>{indexCounts["Russell 2000"].toLocaleString()} securities</p></div><strong>One deduplicated company library.</strong></div>
      <div className="filter-row"><strong>{filtered.length.toLocaleString()} securities</strong><div className="directory-controls"><label><span>Index member</span><select value={membership} onChange={(event) => {setMembership(event.target.value); setPage(1);}}><option>All companies</option><option>Extended Coverage</option><option>S&P 500</option><option>Nasdaq-100 (QQQ)</option><option>Russell 3000</option><option>Russell 2000</option></select></label><label><span>Sector</span><select value={sector} onChange={(event) => { setSector(event.target.value); setPage(1); }}><option>All sectors</option>{sectors.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Sort by</span><select value={sort} onChange={(event) => {setSort(event.target.value); setPage(1);}}><option>Market cap</option><option>Index weight</option><option>Index membership</option><option>Company</option><option>Ticker</option></select></label><label><span>Direction</span><select value={direction} onChange={(event) => {setDirection(event.target.value); setPage(1);}}><option>Descending</option><option>Ascending</option></select></label></div></div>
      <div className="directory-table"><div className="directory-row universe-row directory-labels"><span>COMPANY</span><span>MARKET CAP</span><span>INDEX MEMBERSHIP · WEIGHT</span><span>SECTOR</span><span>EXCHANGE</span><span /></div>{visible.map((company) => <Link href={`/company/${companySlug(company.ticker)}`} className="directory-row universe-row" key={company.ticker}><span className="company-cell"><i>{company.ticker}</i><span><strong>{displayName(company.name)}</strong></span></span><span className="market-cap-cell">{formatMarketCap(company.marketCap)}</span><span className="membership-list">{company.memberships.map((index) => { const weight = company.indexWeights[index]; return <em className={`membership-badge weighted-badge ${index === "S&P 500" ? "sp-badge" : index === "Russell 2000" ? "russell-badge" : index === "Russell 3000" ? "r3000-badge" : index === "Extended Coverage" ? "coverage-badge" : "qqq-badge"}`} key={index}><span>{index}</span>{index !== "Extended Coverage" && <b>{weight && weight > 0 ? `${weight.toFixed(3)}%` : "N/A"}</b>}</em>; })}</span><span>{company.sector}</span><span>{company.exchange}</span><span>→</span></Link>)}</div>
      {visible.length === 0 && <div className="directory-empty"><strong>No companies found.</strong><p>Try another ticker, company name, sector, or index-membership filter.</p></div>}
      <div className="pagination"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>← Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next →</button></div>
      <p className="index-source">Constituent data reflects active listed equity holdings of index-tracking funds as of {researchUniverseAsOf}. Market caps are a July 30, 2026 snapshot and change with market prices. Membership changes over time. {universeSources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.label}>{source.label} ↗</a>)}</p>
    </section>
  </main>;
}
