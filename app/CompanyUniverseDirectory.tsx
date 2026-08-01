"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { companySlug, indexCounts } from "./data/universe";
import {
  listedSecurityCount,
  listedUniverseAsOf,
  officialExchangeCounts,
  officialUniverseSources,
  otcIssueTypeCounts,
  otcSecurityCount,
  otcUniverseAsOf,
} from "./data/exchangeUniverseMeta.generated";
import { Header } from "./ui";

type CatalogCompany = {
  ticker: string;
  name: string;
  sector: string;
  exchange: string;
  market_cap: number | null;
  memberships_json: string;
  cik: string | null;
  security_type: string;
  security_description: string;
  universe_source_url: string;
  universe_source_as_of: string;
  dossier_status: string | null;
};

type Payload = { total: number; page: number; pageSize: number; companies: CatalogCompany[] };
const PAGE_SIZE = 40;

function displayName(name: string) {
  if (name !== name.toUpperCase()) return name;
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function memberships(company: CatalogCompany) {
  try { return JSON.parse(company.memberships_json) as string[]; } catch { return []; }
}

export function CompanyUniverseDirectory({ market }: { market: "listed" | "otc" }) {
  const otc = market === "otc";
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [exchange, setExchange] = useState("");
  const [securityType, setSecurityType] = useState("");
  const [membership, setMembership] = useState("");
  const [sort, setSort] = useState("ticker");
  const [direction, setDirection] = useState("asc");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState<Payload>({ total: otc ? otcSecurityCount : listedSecurityCount, page: 1, pageSize: PAGE_SIZE, companies: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedQuery(query); setPage(1); }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams({ market, page: String(page), pageSize: String(PAGE_SIZE), sort, direction });
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (exchange) params.set("exchange", exchange);
    if (securityType) params.set("securityType", securityType);
    if (membership) params.set("membership", membership);
    return `/api/universe?${params}`;
  }, [market, page, sort, direction, debouncedQuery, exchange, securityType, membership]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(requestUrl, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
      setPayload(await response.json() as Payload);
      setError("");
    }).catch((reason) => { if (reason.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Catalog unavailable"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [requestUrl]);

  const pageCount = Math.max(1, Math.ceil(payload.total / PAGE_SIZE));
  const title = otc ? "OTC equities, kept in their own research lane." : "The full NYSE and Nasdaq catalog.";
  const asOf = otc ? otcUniverseAsOf : listedUniverseAsOf;

  return <main><Header />
    <section className={`directory-hero ${otc ? "otc-directory-hero" : ""}`}><div className="container">
      <span className="kicker">{otc ? "OTC / PINK MARKET DIRECTORY" : "NYSE + NASDAQ DIRECTORY"}</span>
      <h1>{title}</h1>
      <p>{otc ? "Search FINRA’s current OTC equity directory. OTC is not a national securities exchange, and not every OTC security is in the Pink market; instrument type and research status stay visible so unlike securities are not blurred together." : "All current SEC ticker/exchange associations for NYSE and Nasdaq, cross-checked against Nasdaq Trader’s symbol directory. A catalog entry is not presented as a completed dossier until its evidence has been researched and verified."}</p>
      <div className="directory-search">⌕ <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={otc ? `Search ${otcSecurityCount.toLocaleString()} OTC symbols or issuers` : `Search ${listedSecurityCount.toLocaleString()} NYSE and Nasdaq securities`} aria-label={otc ? "Search OTC securities" : "Search NYSE and Nasdaq securities"} autoComplete="off" /></div>
      <div className="universe-note"><span>Official data {asOf}</span><span>{(otc ? otcSecurityCount : listedSecurityCount).toLocaleString()} securities</span><span>{otc ? "FINRA source" : "SEC + Nasdaq Trader sources"}</span></div>
    </div></section>
    <section className="container directory-section">
      <div className="market-switcher"><Link className={!otc ? "active" : ""} href="/companies">NYSE &amp; Nasdaq <span>{listedSecurityCount.toLocaleString()}</span></Link><Link className={otc ? "active otc" : ""} href="/otc">OTC / Pink Market <span>{otcSecurityCount.toLocaleString()}</span></Link><Link href="/emerging-companies">IPOs &amp; private <span>Approved</span></Link></div>
      {!otc && <div className="universe-explainer expanded"><div><span className="membership-badge coverage-badge">NYSE</span><p>{officialExchangeCounts.NYSE.toLocaleString()} securities</p></div><div><span className="membership-badge qqq-badge">NASDAQ</span><p>{officialExchangeCounts.NASDAQ.toLocaleString()} securities</p></div><div><span className="membership-badge sp-badge">S&amp;P 500</span><p>{indexCounts["S&P 500"]} members tagged</p></div><strong>Catalog coverage is separate from dossier completion.</strong></div>}
      {otc && <aside className="otc-disclosure"><strong>OTC does not mean “Pink Sheet” in every case.</strong><p>This directory includes all current issues in FINRA’s OTC security master, including common shares, ADRs, preferreds, funds, units, warrants, and other instruments. The issue-type filter shows what each symbol represents. A future OTC Markets tier feed would be required to label Pink Current, OTCQB, or OTCQX tiers.</p></aside>}
      <div className="filter-row catalog-filter-row"><strong>{loading ? "Loading…" : `${payload.total.toLocaleString()} securities`}</strong><div className="directory-controls">
        {!otc && <label><span>Exchange</span><select value={exchange} onChange={(event) => { setExchange(event.target.value); setPage(1); }}><option value="">NYSE + Nasdaq</option><option>NYSE</option><option>NASDAQ</option></select></label>}
        {!otc && <label><span>Index member</span><select value={membership} onChange={(event) => { setMembership(event.target.value); setPage(1); }}><option value="">All securities</option><option>S&amp;P 500</option><option>Nasdaq-100 (QQQ)</option><option>Russell 3000</option><option>Russell 2000</option></select></label>}
        {otc && <label><span>Issue type</span><select value={securityType} onChange={(event) => { setSecurityType(event.target.value); setPage(1); }}><option value="">All OTC issue types</option>{otcIssueTypeCounts.map(([type, count]) => <option value={type} key={type}>{type} ({count.toLocaleString()})</option>)}</select></label>}
        <label><span>Sort by</span><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="ticker">Ticker</option><option value="company">Company</option>{!otc && <option value="market_cap">Market cap</option>}</select></label>
        <label><span>Direction</span><select value={direction} onChange={(event) => { setDirection(event.target.value); setPage(1); }}><option value="asc">Ascending</option><option value="desc">Descending</option></select></label>
      </div></div>
      {error && <div className="directory-empty"><strong>Catalog temporarily unavailable.</strong><p>{error}</p></div>}
      {!error && <div className={`directory-table catalog-table ${otc ? "otc-table" : ""}`}><div className="directory-row catalog-row directory-labels"><span>SECURITY / ISSUER</span><span>{otc ? "ISSUE TYPE" : "CIK / INDEX MEMBERSHIP"}</span><span>RESEARCH STATUS</span><span>MARKET</span><span /></div>{payload.companies.map((company) => {
        const tags = memberships(company);
        return <Link href={`/company/${companySlug(company.ticker)}`} className="directory-row catalog-row" key={company.ticker}><span className="company-cell"><i>{company.ticker}</i><span><strong>{displayName(company.name)}</strong><small>{company.security_description !== company.name ? company.security_description : company.sector}</small></span></span><span>{otc ? company.security_type : <><small className="catalog-cik">CIK {company.cik ?? "not available"}</small><span className="catalog-memberships">{tags.length ? tags.join(" · ") : "No tracked index membership"}</span></>}</span><span className={`catalog-status ${company.dossier_status === "published" ? "published" : ""}`}>{company.dossier_status === "published" ? "Published dossier" : company.dossier_status ? `${company.dossier_status} dossier` : "Catalogued · not researched"}</span><span>{company.exchange}</span><span>→</span></Link>;
      })}</div>}
      {!loading && !error && payload.companies.length === 0 && <div className="directory-empty"><strong>No securities found.</strong><p>Try a different symbol, issuer name, exchange, index, or issue type.</p></div>}
      <div className="pagination"><button disabled={page === 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>← Previous</button><span>Page {page.toLocaleString()} of {pageCount.toLocaleString()}</span><button disabled={page >= pageCount || loading} onClick={() => setPage((current) => current + 1)}>Next →</button></div>
      <p className="index-source">Universe entries are discovery records, not investment recommendations or verified dossiers. Listings and OTC eligibility change over time. {officialUniverseSources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.label}>{source.label} ↗</a>)}</p>
    </section>
  </main>;
}
