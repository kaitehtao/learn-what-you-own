"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { InsiderActivityPeriod, SecInsiderActivityRow } from "../data/secInsiderActivityRepository";

type ActivityResponse = {
  period: InsiderActivityPeriod;
  periodStart: string;
  purchases: SecInsiderActivityRow[];
  sales: SecInsiderActivityRow[];
  summary: {
    transactionCount?: number;
    companyCount?: number;
    purchaseValue?: number;
    saleValue?: number;
    lastUpdated?: string | null;
  };
  coverage: {
    coverageStart?: string | null;
    coverageEnd?: string | null;
    completedDays?: number;
    processingDays?: number;
    lastRefresh?: string | null;
  };
  methodology: string;
  error?: string;
};

const PERIODS: Array<{ key: InsiderActivityPeriod; label: string; detail: string }> = [
  { key: "month", label: "Month", detail: "Trailing 30 days" },
  { key: "quarter", label: "Quarter", detail: "Trailing 90 days" },
  { key: "year", label: "Year", detail: "Trailing 365 days" },
];

function money(value: number | null | undefined) {
  if (!value) return "Not reported";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function number(value: number | null | undefined, maximumFractionDigits = 0) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

function date(value: string | null | undefined) {
  if (!value) return "Building history";
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function matches(row: SecInsiderActivityRow, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [row.ticker, row.companyName, row.insiderName, row.insiderRelation].some((value) => value.toLowerCase().includes(normalized));
}

function ActivityList({ title, eyebrow, tone, rows, query }: { title: string; eyebrow: string; tone: "buy" | "sell"; rows: SecInsiderActivityRow[]; query: string }) {
  const visible = rows.filter((row) => matches(row, query));
  return <section className={`insider-ranking ${tone}`}>
    <header><div><span>{eyebrow}</span><h2>{title}</h2></div><strong>{visible.length} transactions</strong></header>
    <div className="insider-ranking-table">
      <div className="insider-ranking-labels"><span>Rank / company</span><span>Reporting insider</span><span>Trade</span><span>Reported value</span><span>SEC evidence</span></div>
      {visible.map((row, index) => <article className="insider-ranking-row" key={row.id}>
        <span className="insider-company-cell">
          <i>{index + 1}</i>
          <Link href={`/company/${row.ticker.toLowerCase().replaceAll(".", "-")}`}><b>{row.ticker}</b><small>{row.companyName}</small></Link>
        </span>
        <span className="insider-person-cell"><b>{row.insiderName}</b><small>{row.insiderRelation}</small></span>
        <span className="insider-trade-cell"><b>{number(row.shares)} shares</b><small>{row.price !== null ? `${money(row.price)} per share` : "Price not reported"}</small></span>
        <span className="insider-value-cell"><b>{money(row.reportedValue)}</b><small>{row.securityTitle}</small></span>
        <span className="insider-source-cell"><time>{date(row.transactionDate)}</time><a href={row.sourceUrl} target="_blank" rel="noreferrer">Form {row.form} filing ↗</a></span>
      </article>)}
      {!visible.length && <div className="insider-empty">{query ? "No ranked transactions match this search." : "No qualifying SEC transactions are stored for this period yet."}</div>}
    </div>
  </section>;
}

export function InsiderActivityScreen() {
  const [period, setPeriod] = useState<InsiderActivityPeriod>("month");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/insider-activity?period=${period}`)
      .then(async (response) => {
        const body = await response.json() as ActivityResponse;
        if (!response.ok) throw new Error(body.error ?? "Unable to load SEC insider activity.");
        if (active) setData(body);
      })
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [period]);

  const selected = useMemo(() => PERIODS.find((item) => item.key === period)!, [period]);
  const isBackfilling = !data?.coverage.coverageStart || Number(data.coverage.completedDays ?? 0) < (period === "month" ? 20 : period === "quarter" ? 60 : 240);

  function selectPeriod(nextPeriod: InsiderActivityPeriod) {
    if (nextPeriod === period) return;
    setLoading(true);
    setError("");
    setPeriod(nextPeriod);
  }

  return <section className="container insider-activity-shell">
    <div className="insider-activity-controls">
      <div className="insider-periods" role="group" aria-label="Insider activity time period">
        {PERIODS.map((item) => <button className={period === item.key ? "active" : ""} onClick={() => selectPeriod(item.key)} key={item.key}><b>{item.label}</b><span>{item.detail}</span></button>)}
      </div>
      <label className="insider-search"><span>FILTER RESULTS</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ticker, company, or insider" /></label>
    </div>

    {loading && <div className="insider-state">Loading verified SEC activity…</div>}
    {error && <div className="insider-state error">{error}</div>}
    {!loading && !error && data && <>
      <div className="insider-summary">
        <div><span>Period</span><strong>{selected.label}</strong><small>Since {date(data.periodStart)}</small></div>
        <div className="positive"><span>Reported purchases</span><strong>{money(data.summary.purchaseValue)}</strong><small>SEC transaction code P</small></div>
        <div className="negative"><span>Reported sales</span><strong>{money(data.summary.saleValue)}</strong><small>SEC transaction code S</small></div>
        <div><span>Companies represented</span><strong>{number(data.summary.companyCount)}</strong><small>{number(data.summary.transactionCount)} qualifying trades</small></div>
      </div>

      {isBackfilling && <div className="insider-coverage-notice"><strong>Historical coverage is still expanding.</strong><span>The ledger is processing the newest SEC daily ownership indexes first, then moving backward. Rankings include only the filing dates already indexed: {date(data.coverage.coverageStart)} through {date(data.coverage.coverageEnd)}.</span></div>}

      <div className="insider-rankings">
        <ActivityList title="Top insider purchases" eyebrow="CAPITAL COMMITTED" tone="buy" rows={data.purchases} query={query} />
        <ActivityList title="Top insider sales" eyebrow="CAPITAL SOLD" tone="sell" rows={data.sales} query={query} />
      </div>

      <aside className="insider-methodology">
        <div><span className="kicker">HOW TO READ THIS SCREEN</span><h2>Comparable activity, without mixing unlike transactions.</h2></div>
        <div><p><strong>Included:</strong> Open-market and private purchases coded P, and open-market and private sales coded S, on SEC Forms 3, 4, and 5.</p><p><strong>Excluded from rankings:</strong> Grants, gifts, option exercises, conversions, tax withholding, and other non-comparable changes in beneficial ownership.</p><p><strong>Important:</strong> Reported value is shares multiplied by the filing’s reported price. A large sale may reflect diversification or a preset trading plan and is not, by itself, a bearish signal.</p><p>Latest successful SEC index refresh: {date(data.coverage.lastRefresh)}.</p></div>
      </aside>
    </>}
  </section>;
}
