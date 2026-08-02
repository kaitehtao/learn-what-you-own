"use client";

import { useEffect, useState } from "react";

type OwnershipData = {
  ticker: string;
  available: boolean;
  reason?: string;
  sharesOutstanding?: { value: number; asOf: string; filedAt: string; form: string; sourceUrl: string } | null;
  publicTradableFloat?: { value: number; unit: string; asOf: string; filedAt: string; form: string; sourceUrl: string; methodology: string } | null;
  institutional?: { percent: number; shares: number | null; holders: number | null; asOf: string; sourceUrl: string; topHolders: Array<{ name: string; date: string; shares: number | null; change: number | null; changePercent: string; marketValue: string; sourceUrl: string }> } | null;
  estimatedRetailOther?: { percent: number; methodology: string } | null;
  insiders?: { people: Array<{ name: string; relation: string; latestDate: string; latestTransaction: string; reportedShares: number; sourceUrl: string }>; displayedPeople: number; transactionRecordsReviewed: number; availableRecords: number | null; sourceUrl: string; secSourceUrl: string };
  sourceStatus?: { sec: boolean; institutional13F: boolean; insiderFilings: boolean };
  updatedAt?: string;
  error?: string;
};

function compact(value: number | null | undefined, currency = false) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not available";
  const absolute = Math.abs(value);
  const divisor = absolute >= 1e12 ? 1e12 : absolute >= 1e9 ? 1e9 : absolute >= 1e6 ? 1e6 : absolute >= 1e3 ? 1e3 : 1;
  const suffix = divisor === 1e12 ? "T" : divisor === 1e9 ? "B" : divisor === 1e6 ? "M" : divisor === 1e3 ? "K" : "";
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: divisor === 1 ? 0 : 2 }).format(value / divisor);
  return `${currency ? "$" : ""}${formatted}${suffix}`;
}

function dateLabel(value: string | undefined) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function StockOwnershipPanel({ ticker }: { ticker: string }) {
  const [data, setData] = useState<OwnershipData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/ownership?ticker=${encodeURIComponent(ticker)}`)
      .then(async (response) => {
        const payload = await response.json() as OwnershipData;
        if (!response.ok) throw new Error(payload.error ?? "Ownership data is unavailable.");
        if (active) setData(payload);
      })
      .catch((caught: unknown) => active && setError(caught instanceof Error ? caught.message : "Ownership data is unavailable."));
    return () => { active = false; };
  }, [ticker]);

  return <section className="stock-ownership" id="ownership">
    <div className="stock-ownership-heading"><div><span className="kicker">STOCK OWNERSHIP</span><h2>Who owns {ticker.toUpperCase()}?</h2><p>SEC facts, quarterly Form 13F holdings, and Forms 3, 4, and 5 are kept in separate evidence layers so reported ownership is not confused with an estimate.</p></div>{data?.updatedAt && <span>Refreshed {dateLabel(data.updatedAt)}</span>}</div>
    {!data && !error ? <div className="ownership-state">Loading ownership filings…</div> : error ? <div className="ownership-state error">{error}</div> : data && !data.available ? <div className="ownership-state"><strong>Public ownership data is not available.</strong><p>{data.reason}</p></div> : data && <>
      <div className="ownership-summary-grid">
        <article><small>SHARES OUTSTANDING</small><strong>{compact(data.sharesOutstanding?.value)}</strong><span>{data.sharesOutstanding ? `SEC ${data.sharesOutstanding.form} · ${dateLabel(data.sharesOutstanding.asOf)}` : "Standardized SEC fact unavailable"}</span>{data.sharesOutstanding && <a href={data.sharesOutstanding.sourceUrl} target="_blank" rel="noreferrer">Open filing ↗</a>}</article>
        <article><small>INSTITUTIONAL OWNERSHIP</small><strong>{data.institutional ? `${data.institutional.percent.toFixed(2)}%` : "Not available"}</strong><span>{data.institutional ? `${compact(data.institutional.shares)} shares · ${compact(data.institutional.holders)} reporting holders` : "Quarterly Form 13F aggregation unavailable"}</span>{data.institutional && <a href={data.institutional.sourceUrl} target="_blank" rel="noreferrer">Open 13F-derived source ↗</a>}</article>
        <article><small>ESTIMATED RETAIL + OTHER</small><strong>{data.estimatedRetailOther ? `${data.estimatedRetailOther.percent.toFixed(2)}%` : "Not estimated"}</strong><span>Residual estimate—not a reported SEC retail figure</span></article>
        <article><small>PUBLIC TRADABLE FLOAT</small><strong>{data.publicTradableFloat ? compact(data.publicTradableFloat.value, true) : "Not available"}</strong><span>{data.publicTradableFloat ? `SEC-filed non-affiliate market value · ${dateLabel(data.publicTradableFloat.asOf)}` : "Issuer did not expose a standardized public-float fact"}</span>{data.publicTradableFloat && <a href={data.publicTradableFloat.sourceUrl} target="_blank" rel="noreferrer">Open filing ↗</a>}</article>
      </div>
      <div className="ownership-methodology"><strong>How to read this section</strong><p>{data.estimatedRetailOther?.methodology ?? "A retail estimate is shown only when a current institutional percentage is available."}</p><p>SEC public float is a filed market value of non-affiliate equity, not a current share count. Institutional totals are delayed quarterly filings and can include reporting overlap. Insider rows show the most recently reported positions found in the public filing ledger, not a substitute for the latest proxy beneficial-ownership table.</p></div>
      <div className="ownership-detail-grid">
        <section><div className="ownership-subheading"><div><small>INSIDERS</small><h3>Reporting insiders</h3></div><span>{data.insiders?.displayedPeople ?? 0} people</span></div>
          {data.insiders?.people.length ? <div className="ownership-table insider-table"><div className="ownership-table-head"><span>Insider</span><span>Role</span><span>Latest filing activity</span><span>Latest reported shares</span></div>{data.insiders.people.map((person) => <a href={person.sourceUrl || data.insiders!.secSourceUrl} target="_blank" rel="noreferrer" key={person.name}><span><strong>{person.name}</strong><small>{person.latestDate}</small></span><span>{person.relation}</span><span>{person.latestTransaction}</span><span>{compact(person.reportedShares)}</span></a>)}</div> : <div className="ownership-state compact">No recent insider rows were returned.</div>}
          {data.insiders && <div className="ownership-source-links"><a href={data.insiders.secSourceUrl} target="_blank" rel="noreferrer">All SEC Forms 3, 4 &amp; 5 ↗</a><a href={data.insiders.sourceUrl} target="_blank" rel="noreferrer">Full public insider ledger ↗</a></div>}
        </section>
        <section><div className="ownership-subheading"><div><small>INSTITUTIONS</small><h3>Largest reporting holders</h3></div><span>{data.institutional?.asOf ? `Through ${dateLabel(data.institutional.asOf)}` : "Quarterly"}</span></div>
          {data.institutional?.topHolders.length ? <div className="ownership-table institution-table"><div className="ownership-table-head"><span>Institution</span><span>Reported shares</span><span>Change</span><span>Report date</span></div>{data.institutional.topHolders.map((holder) => <a href={holder.sourceUrl || data.institutional!.sourceUrl} target="_blank" rel="noreferrer" key={`${holder.name}-${holder.date}`}><span><strong>{holder.name}</strong><small>{holder.marketValue}</small></span><span>{compact(holder.shares)}</span><span>{holder.changePercent || compact(holder.change)}</span><span>{holder.date}</span></a>)}</div> : <div className="ownership-state compact">No quarterly institutional aggregation was returned.</div>}
        </section>
      </div>
    </>}
  </section>;
}
