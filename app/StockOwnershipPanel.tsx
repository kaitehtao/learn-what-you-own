"use client";

import { useEffect, useState } from "react";

type OwnershipData = {
  ticker: string;
  available: boolean;
  reason?: string;
  sharesOutstanding?: { value: number; asOf: string; filedAt: string; form: string; sourceLabel?: string; sourceUrl: string; sourceTaxonomy?: string; sourceConcept?: string } | null;
  sharesOutstandingReason?: string | null;
  publicTradableFloat?: { value: number; unit: string; asOf: string; filedAt: string; form: string; sourceUrl: string; methodology: string } | null;
  institutional?: { percent: number; shares: number | null; holders: number | null; asOf: string; sourceUrl: string; topHolders: Array<{ name: string; date: string; shares: number | null; change: number | null; changePercent: string; marketValue: string; sourceUrl: string }> } | null;
  estimatedRetailOther?: { percent: number; methodology: string } | null;
  insiderTransactions?: {
    purchases: InsiderTransaction[];
    sales: InsiderTransaction[];
    otherCount: number;
    transactionRecordsReviewed: number;
    filingsReviewed: number;
    availableRecords: number | null;
    failedFilings: number;
    latestFilingDate: string;
    sourceUrl: string;
    secSourceUrl: string;
    methodology: string;
  };
  insiders?: { people: Array<{ name: string; relation: string; latestDate: string; latestTransaction: string; reportedShares: number; sourceUrl: string }>; displayedPeople: number; transactionRecordsReviewed: number; filingsReviewed: number; availableRecords: number | null; sourceUrl: string; secSourceUrl: string };
  beneficialOwnership?: {
    status: "available" | "no_proxy" | "awaiting_extraction" | "unavailable";
    form: string;
    filingDate: string;
    asOfDate: string;
    sourceUrl: string;
    securityClasses: string[];
    people: Array<{
      name: string;
      category: string;
      holdings: Array<{ securityClass: string; shares: number | null; sharesDisplay: string; percent: number | null; percentDisplay: string }>;
      totalPercent: number | null;
      totalPercentDisplay: string;
      sourceUrl: string;
    }>;
    methodology: string;
    error: string | null;
  };
  insiderSource?: { status: "available" | "no_filings" | "unavailable"; provider: string; message: string; error: string | null };
  sourceStatus?: { sec: boolean; secDirectFiling?: boolean; institutional13F: boolean; insiderFilings: boolean; proxyOwnership?: boolean };
  updatedAt?: string;
  error?: string;
};

type InsiderTransaction = {
  name: string;
  relation: string;
  date: string;
  transactionCode?: string;
  transactionType: string;
  securityTitle?: string;
  shares: number;
  price: number | null;
  value: number | null;
  sharesHeld: number | null;
  sourceUrl: string;
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

function InsiderTransactionTable({ rows, emptyLabel, fallbackUrl, transactionKind }: { rows: InsiderTransaction[]; emptyLabel: string; fallbackUrl: string; transactionKind: "purchase" | "sale" }) {
  if (!rows.length) return <div className="ownership-state compact"><strong>{emptyLabel}</strong><p>Other Forms 3, 4, and 5 may still report grants, option exercises, gifts, tax withholding, conversions, or position changes.</p></div>;
  return <div className={`ownership-table insider-transaction-table ${transactionKind}`}>
    <div className="ownership-table-head"><span>Insider</span><span>Date</span><span>Shares</span><span>Price</span><span>Reported value</span></div>
    {rows.map((row, index) => <a href={row.sourceUrl || fallbackUrl} target="_blank" rel="noreferrer" key={`${row.name}-${row.date}-${row.transactionType}-${index}`}>
      <span className="insider-transaction-person">
        <small className="mobile-field-label">Insider</small>
        <strong>{row.name}</strong>
        <small className="insider-transaction-role">{row.relation}</small>
        <small className="insider-transaction-description">{row.transactionType}</small>
        {row.securityTitle && <small className="insider-transaction-security">Security: {row.securityTitle}</small>}
      </span>
      <span><small className="mobile-field-label">Date</small>{dateLabel(row.date)}</span>
      <span><small className="mobile-field-label">Shares</small>{compact(row.shares)}</span>
      <span><small className="mobile-field-label">Price</small>{row.price ? compact(row.price, true) : "Not reported"}</span>
      <span><small className="mobile-field-label">Reported value</small>{row.value ? compact(row.value, true) : "Not reported"}</span>
    </a>)}
  </div>;
}

function BeneficialOwnershipTable({ data }: { data: NonNullable<OwnershipData["beneficialOwnership"]> }) {
  if (data.status !== "available" || !data.people.length) {
    const message = data.status === "unavailable"
      ? "The latest proxy could not be retrieved from SEC EDGAR. This is a source failure, not a zero-ownership result."
      : data.status === "awaiting_extraction"
        ? "A definitive proxy was found, but its ownership table could not be extracted confidently. Open the filing to review the source table."
        : "No definitive proxy statement was found in the issuer's current SEC submissions index.";
    return <div className={`ownership-state compact${data.status === "unavailable" ? " error" : ""}`}><strong>{message}</strong><p><a href={data.sourceUrl} target="_blank" rel="noreferrer">Open SEC proxy source ↗</a></p></div>;
  }
  return <div className="ownership-table proxy-ownership-table">
    <div className="ownership-table-head"><span>Beneficial owner</span><span>Proxy-reported holdings</span><span>All-class ownership</span><span>Snapshot</span></div>
    {data.people.map((person, index) => <a href={person.sourceUrl || data.sourceUrl} target="_blank" rel="noreferrer" key={`${person.name}-${index}`}>
      <span><small className="mobile-field-label">Beneficial owner</small><strong>{person.name}</strong><small>{person.category}</small></span>
      <span className="proxy-holdings"><small className="mobile-field-label">Proxy-reported holdings</small>{person.holdings.map((holding) => <small key={holding.securityClass}><b>{holding.securityClass}:</b> {holding.sharesDisplay} shares · {holding.percentDisplay}</small>)}</span>
      <span><small className="mobile-field-label">All-class ownership</small><strong>{person.totalPercentDisplay}</strong></span>
      <span><small className="mobile-field-label">Snapshot</small>{dateLabel(data.asOfDate)}</span>
    </a>)}
  </div>;
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
    <div className="stock-ownership-heading"><div><span className="kicker">STOCK OWNERSHIP</span><h2>Who owns {ticker.toUpperCase()}?</h2><p>SEC proxy ownership, quarterly Form 13F holdings, and Forms 3, 4, and 5 are kept in separate evidence layers so a dated ownership snapshot is not confused with later transactions or estimates.</p></div>{data?.updatedAt && <span>Refreshed {dateLabel(data.updatedAt)}</span>}</div>
    {!data && !error ? <div className="ownership-state">Loading ownership filings…</div> : error ? <div className="ownership-state error">{error}</div> : data && !data.available ? <div className="ownership-state"><strong>Public ownership data is not available.</strong><p>{data.reason}</p></div> : data && <>
      <div className="ownership-summary-grid">
        <article><small>SHARES OUTSTANDING</small><strong>{data.sharesOutstanding ? compact(data.sharesOutstanding.value) : data.sourceStatus?.secDirectFiling ? "Not yet filed" : "Not available"}</strong><span>{data.sharesOutstanding ? `${data.sharesOutstanding.sourceLabel ?? `SEC ${data.sharesOutstanding.form}`} · ${dateLabel(data.sharesOutstanding.asOf)}` : data.sharesOutstandingReason ?? "Standardized SEC fact unavailable"}</span>{data.sharesOutstanding && <a href={data.sharesOutstanding.sourceUrl} target="_blank" rel="noreferrer">Open source ↗</a>}</article>
        <article><small>INSTITUTIONAL OWNERSHIP</small><strong>{data.institutional ? `${data.institutional.percent.toFixed(2)}%` : "Not available"}</strong><span>{data.institutional ? `${compact(data.institutional.shares)} shares · ${compact(data.institutional.holders)} reporting holders` : "Quarterly Form 13F aggregation unavailable"}</span>{data.institutional && <a href={data.institutional.sourceUrl} target="_blank" rel="noreferrer">Open 13F-derived source ↗</a>}</article>
        <article><small>ESTIMATED RETAIL + OTHER</small><strong>{data.estimatedRetailOther ? `${data.estimatedRetailOther.percent.toFixed(2)}%` : "Not estimated"}</strong><span>Residual estimate—not a reported SEC retail figure</span></article>
        <article><small>PUBLIC TRADABLE FLOAT</small><strong>{data.publicTradableFloat ? compact(data.publicTradableFloat.value, true) : "Not available"}</strong><span>{data.publicTradableFloat ? `SEC-filed non-affiliate market value · ${dateLabel(data.publicTradableFloat.asOf)}` : "Issuer did not expose a standardized public-float fact"}</span>{data.publicTradableFloat && <a href={data.publicTradableFloat.sourceUrl} target="_blank" rel="noreferrer">Open filing ↗</a>}</article>
      </div>
      <div className="ownership-methodology"><strong>How to read this section</strong><p>{data.estimatedRetailOther?.methodology ?? "A retail estimate is shown only when a current institutional percentage is available."}</p><p>SEC public float is a filed market value of non-affiliate equity, not a current share count. Institutional totals are delayed quarterly filings and can include reporting overlap. Insider transactions are filing events—not investment recommendations—and the reported date, transaction code, price, and post-transaction position should be reviewed together.</p></div>
      {data.beneficialOwnership && <section className="proxy-ownership-section" aria-labelledby={`proxy-ownership-${ticker.toLowerCase()}`}>
        <div className="ownership-subheading"><div><small>SEC PROXY OWNERSHIP</small><h3 id={`proxy-ownership-${ticker.toLowerCase()}`}>Beneficial owners and management</h3></div><span>{data.beneficialOwnership.form || "Proxy"} filed {dateLabel(data.beneficialOwnership.filingDate)}</span></div>
        <BeneficialOwnershipTable data={data.beneficialOwnership} />
        <div className="ownership-transaction-note"><p>{data.beneficialOwnership.methodology}</p><a href={data.beneficialOwnership.sourceUrl} target="_blank" rel="noreferrer">Open exact SEC proxy ↗</a></div>
      </section>}
      <section className="insider-transactions-section" aria-labelledby={`insider-transactions-${ticker.toLowerCase()}`}>
        <div className="ownership-subheading"><div><small>INSIDER TRANSACTIONS</small><h3 id={`insider-transactions-${ticker.toLowerCase()}`}>Purchases and sales, separated</h3></div><span>{data.insiderTransactions?.filingsReviewed ?? 0} SEC filings · {data.insiderTransactions?.transactionRecordsReviewed ?? 0} transactions</span></div>
        {data.insiderSource && <div className={`ownership-state compact${data.insiderSource.status === "unavailable" ? " error" : ""}`}><strong>{data.insiderSource.provider}: {data.insiderSource.status === "available" ? "ownership filings loaded" : data.insiderSource.status === "no_filings" ? "no recent ownership filings indexed" : "temporarily unavailable"}</strong><p>{data.insiderSource.message}</p></div>}
        <div className="ownership-transaction-grid">
          <section><div className="ownership-transaction-title purchase"><strong>Insider purchases</strong><span>{data.insiderTransactions?.purchases.length ?? 0} reported</span></div><InsiderTransactionTable transactionKind="purchase" rows={data.insiderTransactions?.purchases ?? []} emptyLabel={data.insiderSource?.status === "unavailable" ? "Purchase data could not be retrieved from the SEC." : "No SEC transactions coded P were found in the reviewed filings."} fallbackUrl={data.insiderTransactions?.secSourceUrl ?? data.insiders?.secSourceUrl ?? "https://www.sec.gov/edgar/search/"} /></section>
          <section><div className="ownership-transaction-title sale"><strong>Insider sales</strong><span>{data.insiderTransactions?.sales.length ?? 0} reported</span></div><InsiderTransactionTable transactionKind="sale" rows={data.insiderTransactions?.sales ?? []} emptyLabel={data.insiderSource?.status === "unavailable" ? "Sale data could not be retrieved from the SEC." : "No SEC transactions coded S were found in the reviewed filings."} fallbackUrl={data.insiderTransactions?.secSourceUrl ?? data.insiders?.secSourceUrl ?? "https://www.sec.gov/edgar/search/"} /></section>
        </div>
        <div className="ownership-transaction-note"><p>{data.insiderTransactions?.methodology ?? "Only transactions explicitly labeled as purchases or sales are placed in these tables."}</p>{data.insiderTransactions && <span>{data.insiderTransactions.otherCount} other or unclassified filing rows excluded from purchase and sale totals.</span>}</div>
      </section>
      <div className="ownership-detail-grid">
        <section><div className="ownership-subheading"><div><small>INSIDERS</small><h3>Reporting insiders</h3></div><span>{data.insiders?.displayedPeople ?? 0} people</span></div>
          {data.insiders?.people.length ? <div className="ownership-table insider-table"><div className="ownership-table-head"><span>Insider</span><span>Role</span><span>Latest filing activity</span><span>Latest reported shares</span></div>{data.insiders.people.map((person) => <a href={person.sourceUrl || data.insiders!.secSourceUrl} target="_blank" rel="noreferrer" key={person.name}><span><small className="mobile-field-label">Insider</small><strong>{person.name}</strong><small>{dateLabel(person.latestDate)}</small></span><span><small className="mobile-field-label">Role</small>{person.relation}</span><span><small className="mobile-field-label">Latest filing activity</small>{person.latestTransaction}</span><span><small className="mobile-field-label">Latest reported shares</small>{compact(person.reportedShares)}</span></a>)}</div> : <div className="ownership-state compact">{data.insiderSource?.status === "unavailable" ? "SEC insider records are temporarily unavailable; this is not a zero-activity result." : "No reporting insiders appeared in the reviewed SEC ownership filings."}</div>}
          {data.insiders && <div className="ownership-source-links"><a href={data.insiders.secSourceUrl} target="_blank" rel="noreferrer">All SEC Forms 3, 4 &amp; 5 ↗</a><a href={data.insiders.sourceUrl} target="_blank" rel="noreferrer">Full public insider ledger ↗</a></div>}
        </section>
        <section><div className="ownership-subheading"><div><small>INSTITUTIONS</small><h3>Largest reporting holders</h3></div><span>{data.institutional?.asOf ? `Through ${dateLabel(data.institutional.asOf)}` : "Quarterly"}</span></div>
          {data.institutional?.topHolders.length ? <div className="ownership-table institution-table"><div className="ownership-table-head"><span>Institution</span><span>Reported shares</span><span>Change</span><span>Report date</span></div>{data.institutional.topHolders.map((holder) => <a href={holder.sourceUrl || data.institutional!.sourceUrl} target="_blank" rel="noreferrer" key={`${holder.name}-${holder.date}`}><span><small className="mobile-field-label">Institution</small><strong>{holder.name}</strong><small>{holder.marketValue}</small></span><span><small className="mobile-field-label">Reported shares</small>{compact(holder.shares)}</span><span><small className="mobile-field-label">Change</small>{holder.changePercent || compact(holder.change)}</span><span><small className="mobile-field-label">Report date</small>{dateLabel(holder.date)}</span></a>)}</div> : <div className="ownership-state compact">No quarterly institutional aggregation was returned.</div>}
        </section>
      </div>
    </>}
  </section>;
}
