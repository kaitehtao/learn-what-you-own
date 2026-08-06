"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatMarketCap } from "../market-snapshot";

type Company = { ticker: string; name: string; sector: string; exchange: string; market_cap: number | null; memberships_json: string; dossier_quality_tier: string; dossier_source_count: number };
type Payload = { total: number; companies: Company[] };

const marketCapOptions = [
  { label: "No minimum", value: "" },
  { label: "$50 million", value: "50000000" },
  { label: "$250 million", value: "250000000" },
  { label: "$1 billion", value: "1000000000" },
  { label: "$5 billion", value: "5000000000" },
  { label: "$25 billion", value: "25000000000" },
];

function displayName(name: string) { return name === name.toUpperCase() ? name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : name; }
function memberships(value: string) { try { return JSON.parse(value) as string[]; } catch { return []; } }

export function FactsScreener() {
  const [query, setQuery] = useState("");
  const [membership, setMembership] = useState("");
  const [sector, setSector] = useState("");
  const [minMarketCap, setMinMarketCap] = useState("50000000");
  const [maxMarketCap, setMaxMarketCap] = useState("5000000000");
  const [payload, setPayload] = useState<Payload>({ total: 0, companies: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sectors = useMemo(() => ["Communication Services","Consumer Discretionary","Consumer Staples","Energy","Financials","Health Care","Industrials","Information Technology","Materials","Real Estate","Utilities"], []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ market: "listed", page: "1", pageSize: "100", sort: "market_cap", direction: "desc" });
      if (query.trim()) params.set("q", query.trim());
      if (membership) params.set("membership", membership);
      if (sector) params.set("sector", sector);
      if (minMarketCap) params.set("minMarketCap", minMarketCap);
      if (maxMarketCap) params.set("maxMarketCap", maxMarketCap);
      fetch(`/api/universe?${params}`, { signal: controller.signal }).then(async (response) => {
        const body = await response.json() as Payload & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "The FACTS screen is unavailable.");
        setPayload(body); setError("");
      }).catch((reason) => { if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "The FACTS screen is unavailable."); }).finally(() => setLoading(false));
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, membership, sector, minMarketCap, maxMarketCap]);

  return <section className="facts-screener">
    <header><div><span className="kicker">IDEA GENERATION · LIVE COMPANY CATALOG</span><h2>Start with a deliberate universe</h2><p>Filter the current research database by capitalization, index, sector, ticker, or company. Results are ranked largest to smallest and never imply a recommendation.</p></div><strong>{loading ? "Loading…" : `${payload.total.toLocaleString()} matches`}</strong></header>
    <div className="facts-screen-controls"><label>SEARCH<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ticker or company"/></label><label>INDEX<select value={membership} onChange={(event) => setMembership(event.target.value)}><option value="">All listed companies</option><option>S&amp;P 500</option><option>Russell 2000</option><option>Russell 3000</option><option>Nasdaq-100 (QQQ)</option></select></label><label>SECTOR<select value={sector} onChange={(event) => setSector(event.target.value)}><option value="">All sectors</option>{sectors.map((item) => <option key={item}>{item}</option>)}</select></label><label>MINIMUM MARKET CAP<select value={minMarketCap} onChange={(event) => setMinMarketCap(event.target.value)}>{marketCapOptions.map((item) => <option value={item.value} key={item.label}>{item.label}</option>)}</select></label><label>MAXIMUM MARKET CAP<select value={maxMarketCap} onChange={(event) => setMaxMarketCap(event.target.value)}><option value="">No maximum</option><option value="500000000">$500 million</option><option value="1000000000">$1 billion</option><option value="5000000000">$5 billion</option><option value="25000000000">$25 billion</option><option value="100000000000">$100 billion</option></select></label></div>
    {error && <div className="facts-screen-state error">{error}</div>}
    {!error && <div className="facts-screen-table"><div className="facts-screen-row labels"><span>Company</span><span>Market cap</span><span>Sector</span><span>Membership</span><span>Research</span></div>{payload.companies.map((company) => <Link className="facts-screen-row" href={`/company/${company.ticker.toLowerCase().replaceAll(".", "-")}`} key={company.ticker}><span><i>{company.ticker}</i><strong>{displayName(company.name)}</strong></span><span>{formatMarketCap(company.market_cap)}</span><span>{company.sector}</span><span>{memberships(company.memberships_json).join(" · ") || "Listed"}</span><span>{company.dossier_quality_tier.replaceAll("_", " ")} · {Number(company.dossier_source_count).toLocaleString()} sources</span></Link>)}</div>}
    <p className="facts-screen-note">The PDF’s financial-quality screens require live filing and valuation context. Continue with <Link href="/comps">comparables</Link>, <Link href="/earnings">earnings surprises</Link>, and <Link href="/insider-activity">clustered insider activity</Link> before opening a private FACTS worksheet.</p>
  </section>;
}
