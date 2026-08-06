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
import { followingLabel, type CompanyFollower } from "./company-followers";
import { formatMarketCap } from "./market-snapshot";

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
  dossier_quality_tier: "starting_point" | "machine_enriched" | "editorial_review" | "benchmark_complete";
  dossier_quality_reviewed_at: string | null;
  dossier_source_count: number;
};

type QualitySummary = {
  total: number;
  starting_point: number;
  machine_enriched: number;
  editorial_review: number;
  benchmark_complete: number;
  zero_sources: number;
  five_plus_sources: number;
};
type QualityRule = { id:string;label:string;min_source_count:number;min_verified_claim_count:number;min_distinct_section_count:number;min_distinct_claim_type_count:number };
type Payload = { total: number; page: number; pageSize: number; companies: CatalogCompany[]; qualitySummary?: QualitySummary | null; qualityRule?: QualityRule | null };
const PAGE_SIZE = 40;

function displayName(name: string) {
  if (name !== name.toUpperCase()) return name;
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function memberships(company: CatalogCompany) {
  try { return JSON.parse(company.memberships_json) as string[]; } catch { return []; }
}

const qualityLabels = {
  starting_point: "Starting page",
  machine_enriched: "Research foundation",
  editorial_review: "Editorial review",
  benchmark_complete: "Benchmark-complete dossier",
} as const;

type DirectoryProps = { market: "listed" | "otc"; indexMembership?: "S&P 500" | "Russell 2000" | "" };

export function CompanyUniverseDirectory(props: DirectoryProps) {
  // A route-owned key prevents React from carrying the prior tab's client
  // filters into a different research universe during soft navigation.
  return <CompanyUniverseDirectoryClient key={`${props.market}:${props.indexMembership ?? ""}`} {...props} />;
}

function CompanyUniverseDirectoryClient({ market, indexMembership = "" }: DirectoryProps) {
  const otc = market === "otc";
  const indexFocused = !otc && Boolean(indexMembership);
  const sp500Focused = indexMembership === "S&P 500";
  const russellFocused = indexMembership === "Russell 2000";
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [exchange, setExchange] = useState("");
  const [securityType, setSecurityType] = useState("");
  const [membership, setMembership] = useState(indexMembership);
  const [qualityTier, setQualityTier] = useState("");
  const [sort, setSort] = useState(indexFocused ? "market_cap" : "ticker");
  const [direction, setDirection] = useState(indexFocused ? "desc" : "asc");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState<Payload>({ total: otc ? otcSecurityCount : listedSecurityCount, page: 1, pageSize: PAGE_SIZE, companies: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/company-followers", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json() as { companies?: CompanyFollower[] };
      setFollowerCounts(Object.fromEntries((data.companies ?? []).map((item) => [item.ticker, item.follower_count])));
    }).catch(() => undefined);
  }, []);

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
    if (qualityTier) params.set("qualityTier", qualityTier);
    return `/api/universe?${params}`;
  }, [market, page, sort, direction, debouncedQuery, exchange, securityType, membership, qualityTier]);

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
  const title = otc ? "OTC equities, kept in their own research lane." : sp500Focused ? "The S&P 500: 500 companies, represented by constituent ticker lines." : indexFocused ? `${indexMembership} companies, largest to smallest.` : "The full NYSE and Nasdaq catalog.";
  const asOf = otc ? otcUniverseAsOf : listedUniverseAsOf;
  const indexDescription = sp500Focused
    ? "The index name refers to 500 constituent companies. Each included security is shown as its own ticker line, so multiple share classes can make the ticker count greater than 500. Search the currently matched constituents and rank them by the latest available market capitalization."
    : `Search every active company tagged as a ${indexMembership} member in the research universe. The list uses the latest available market capitalization and automatically ranks companies from highest to lowest.`;

  return <main><Header />
    <section className={`directory-hero ${otc ? "otc-directory-hero" : ""}`}><div className="container">
      <span className="kicker">{otc ? "OTC / PINK MARKET DIRECTORY" : indexFocused ? `${indexMembership.toUpperCase()} RESEARCH UNIVERSE` : "NYSE + NASDAQ DIRECTORY"}</span>
      <h1>{title}</h1>
      <p>{otc ? "Search FINRA’s current OTC equity directory. OTC is not a national securities exchange, and not every OTC security is in the Pink market; instrument type and research status stay visible so unlike securities are not blurred together." : indexFocused ? indexDescription : "All current SEC ticker/exchange associations for NYSE and Nasdaq, cross-checked against Nasdaq Trader’s symbol directory. A catalog entry is not presented as a completed dossier until its evidence has been researched and verified."}</p>
      <div className="directory-search">⌕ <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={otc ? `Search ${otcSecurityCount.toLocaleString()} OTC symbols or issuers` : indexFocused ? `Search ${indexMembership} tickers or companies` : `Search ${listedSecurityCount.toLocaleString()} NYSE and Nasdaq securities`} aria-label={otc ? "Search OTC securities" : indexFocused ? `Search ${indexMembership} companies` : "Search NYSE and Nasdaq securities"} autoComplete="off" /></div>
      <div className="universe-note"><span>Official data {asOf}</span><span>{indexFocused ? loading ? "Loading live membership" : sp500Focused ? `${payload.total.toLocaleString()} constituent ticker lines currently matched` : `${payload.total.toLocaleString()} active members` : `${(otc ? otcSecurityCount : listedSecurityCount).toLocaleString()} securities`}</span><span>{otc ? "FINRA source" : indexFocused ? "Ranked by market cap" : "SEC + Nasdaq Trader sources"}</span></div>
    </div></section>
    <section className="container directory-section">
      <div className="market-switcher"><Link className={!otc && !indexFocused ? "active" : ""} href="/companies">NYSE &amp; Nasdaq <span>{listedSecurityCount.toLocaleString()}</span></Link><Link className={indexMembership === "S&P 500" ? "active" : ""} href="/research/sp-500">S&amp;P 500 <span>Research</span></Link><Link className={russellFocused ? "active" : ""} href="/research/russell-2000">Russell 2000 <span>Research</span></Link><Link className={otc ? "active otc" : ""} href="/otc">OTC / Pink <span>{otcSecurityCount.toLocaleString()}</span></Link></div>
      {!otc && <div className="universe-explainer expanded">{indexFocused ? <><div><span className={`membership-badge ${russellFocused ? "russell-badge" : "sp-badge"}`}>{indexMembership}</span><p>{loading ? "Loading membership" : sp500Focused ? `${payload.total.toLocaleString()} tracked ticker lines · 500 constituent companies` : `${payload.total.toLocaleString()} active members`}</p></div><div><span className="membership-badge coverage-badge">MARKET CAP</span><p>Highest to lowest by default</p></div><div><span className="membership-badge qqq-badge">LIVE DATA</span><p>Scheduled ranking refresh</p></div></> : <><div><span className="membership-badge coverage-badge">NYSE</span><p>{officialExchangeCounts.NYSE.toLocaleString()} securities</p></div><div><span className="membership-badge qqq-badge">NASDAQ</span><p>{officialExchangeCounts.NASDAQ.toLocaleString()} securities</p></div><div><span className="membership-badge sp-badge">S&amp;P 500</span><p>{indexCounts["S&P 500"]} members tagged</p></div></>}<strong>{sp500Focused ? "Ticker lines are securities; the index name counts constituent companies." : "Catalog coverage is separate from dossier completion."}</strong></div>}
      {indexFocused && payload.qualitySummary && <section className="russell-completion-panel">
        <header><div><span className="kicker">{indexMembership.toUpperCase()} DOSSIER COMPLETION PROGRAM</span><h2>{Number(payload.qualitySummary.benchmark_complete).toLocaleString()} benchmark complete · {(Number(payload.qualitySummary.total) - Number(payload.qualitySummary.benchmark_complete)).toLocaleString()} in progress</h2></div><strong>{((Number(payload.qualitySummary.benchmark_complete) / Math.max(1, Number(payload.qualitySummary.total))) * 100).toFixed(1)}%</strong></header>
        <div className="russell-completion-track" aria-label={`${indexMembership} benchmark dossier completion`}><i style={{width:`${(Number(payload.qualitySummary.benchmark_complete) / Math.max(1, Number(payload.qualitySummary.total))) * 100}%`}} /></div>
        <div className="russell-completion-stats"><div><strong>{Number(payload.qualitySummary.total).toLocaleString()}</strong><span>Active members tracked</span></div><div><strong>{Number(payload.qualitySummary.machine_enriched).toLocaleString()}</strong><span>Research foundations</span></div><div><strong>{Number(payload.qualitySummary.five_plus_sources).toLocaleString()}</strong><span>Five-plus primary sources</span></div><div><strong>{Number(payload.qualitySummary.starting_point).toLocaleString()}</strong><span>Queued starting pages</span></div></div>
        <p>A ticker advances only after exact SEC evidence is ingested. “Benchmark complete” is calculated from the active database rule{payload.qualityRule ? `: at least ${payload.qualityRule.min_source_count} distinct sources, ${payload.qualityRule.min_verified_claim_count} verified claims across ${payload.qualityRule.min_distinct_section_count} sections and ${payload.qualityRule.min_distinct_claim_type_count} evidence classes` : ""}. No ticker or completed count is manually embedded in this page.</p>
      </section>}
      {otc && <aside className="otc-disclosure"><strong>OTC does not mean “Pink Sheet” in every case.</strong><p>This directory includes all current issues in FINRA’s OTC security master, including common shares, ADRs, preferreds, funds, units, warrants, and other instruments. The issue-type filter shows what each symbol represents. A future OTC Markets tier feed would be required to label Pink Current, OTCQB, or OTCQX tiers.</p></aside>}
      <div className="filter-row catalog-filter-row"><strong>{loading ? "Loading…" : `${payload.total.toLocaleString()} securities`}</strong><div className="directory-controls">
        {!otc && <label><span>Exchange</span><select value={exchange} onChange={(event) => { setExchange(event.target.value); setPage(1); }}><option value="">NYSE + Nasdaq</option><option>NYSE</option><option>NASDAQ</option></select></label>}
        {!otc && !indexFocused && <label><span>Index member</span><select value={membership} onChange={(event) => { setMembership(event.target.value); setPage(1); }}><option value="">All securities</option><option>S&amp;P 500</option><option>Nasdaq-100 (QQQ)</option><option>Russell 3000</option><option>Russell 2000</option></select></label>}
        {!otc && <label><span>Research depth</span><select value={qualityTier} onChange={(event) => { setQualityTier(event.target.value); setPage(1); }}><option value="">All research stages</option><option value="benchmark_complete">Benchmark complete</option><option value="editorial_review">Editorial review</option><option value="machine_enriched">Research foundation</option><option value="starting_point">Starting page</option></select></label>}
        {otc && <label><span>Issue type</span><select value={securityType} onChange={(event) => { setSecurityType(event.target.value); setPage(1); }}><option value="">All OTC issue types</option>{otcIssueTypeCounts.map(([type, count]) => <option value={type} key={type}>{type} ({count.toLocaleString()})</option>)}</select></label>}
        <label><span>Sort by</span><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="ticker">Ticker</option><option value="company">Company</option>{!otc && <option value="market_cap">Market cap</option>}</select></label>
        <label><span>Direction</span><select value={direction} onChange={(event) => { setDirection(event.target.value); setPage(1); }}><option value="asc">Ascending</option><option value="desc">Descending</option></select></label>
      </div></div>
      {error && <div className="directory-empty"><strong>Catalog temporarily unavailable.</strong><p>{error}</p></div>}
      {!error && <div className={`directory-table catalog-table ${otc ? "otc-table" : ""}`}><div className="directory-row catalog-row directory-labels"><span>SECURITY / ISSUER</span><span>{otc ? "ISSUE TYPE" : "CIK / INDEX MEMBERSHIP"}</span><span>RESEARCH / FOLLOWERS</span><span>{indexFocused ? "MARKET CAP" : "MARKET"}</span><span /></div>{payload.companies.map((company) => {
        const tags = memberships(company);
        const quality = company.dossier_quality_tier ?? "starting_point";
        const sourceCount = Number(company.dossier_source_count ?? 0);
        return <Link href={`/company/${companySlug(company.ticker)}`} className="directory-row catalog-row" key={company.ticker}><span className="company-cell"><i>{company.ticker}</i><span><strong>{displayName(company.name)}</strong><small>{company.security_description !== company.name ? company.security_description : company.sector}</small></span></span><span>{otc ? company.security_type : <><small className="catalog-cik">CIK {company.cik ?? "not available"}</small><span className="catalog-memberships">{tags.length ? tags.join(" · ") : "No tracked index membership"}</span></>}</span><span className={`catalog-status quality-${quality}`}>{qualityLabels[quality]}<small className="catalog-source-count">{sourceCount.toLocaleString()} primary {sourceCount === 1 ? "source" : "sources"}</small><em className="company-followers">♡ {followingLabel(followerCounts[company.ticker] ?? 0)}</em></span><span className={indexFocused ? "catalog-market-cap" : ""}>{indexFocused ? <><strong>{formatMarketCap(company.market_cap)}</strong><small>{company.exchange}</small></> : company.exchange}</span><span>→</span></Link>;
      })}</div>}
      {!loading && !error && payload.companies.length === 0 && <div className="directory-empty"><strong>No securities found.</strong><p>Try a different symbol, issuer name, exchange, index, or issue type.</p></div>}
      <div className="pagination"><button disabled={page === 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>← Previous</button><span>Page {page.toLocaleString()} of {pageCount.toLocaleString()}</span><button disabled={page >= pageCount || loading} onClick={() => setPage((current) => current + 1)}>Next →</button></div>
      <p className="index-source">Universe entries are discovery records, not investment recommendations or verified dossiers. Listings and OTC eligibility change over time. {officialUniverseSources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.label}>{source.label} ↗</a>)}</p>
    </section>
  </main>;
}
