"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";

type MetricRow = {
  ticker: string; name: string; sector: string; exchange: string; memberships: string[]; archetype: string;
  quoteAsOf: string | null; quoteSourceUrl: string | null; marketCap: number | null; enterpriseValue: number | null;
  factsSource: "Current SEC Company Facts" | "Scheduled SEC filing store";
  revenue: number | null; revenueGrowth: number | null; grossMargin: number | null; operatingIncome: number | null;
  depreciationAmortization: number | null; ebitda: number | null; netIncome: number | null; freeCashFlow: number | null;
  evToRevenue: number | null; evToEbitda: number | null; priceToEarnings: number | null; priceToFreeCashFlow: number | null;
  cash: number | null; reportedDebt: number | null; netCash: number | null; totalAssets: number | null;
  totalLiabilities: number | null; stockholdersEquity: number | null; currentRatio: number | null; cashToDebt: number | null;
  debtToEquity: number | null; liabilitiesToAssets: number | null; netDebtToEbitda: number | null;
  fundamentalsAsOf: string | null; sourceUrl: string | null; coverage: "complete" | "partial" | "awaiting-filing-data";
};

type ApiResponse = {
  rows: MetricRow[]; invalidTickers: string[];
  methodology: { ebitda: string; enterpriseValue: string; periods: string };
};

type View = "valuation" | "operations" | "balance";
type SortKey = "marketCap" | "revenue" | "evToRevenue" | "evToEbitda" | "priceToEarnings" | "revenueGrowth" | "netCash";

const MAX_TICKERS = 10;
const examples = [
  { label: "AI chips", tickers: ["NVDA", "AMD", "AVGO", "INTC", "MU"] },
  { label: "Cloud platforms", tickers: ["MSFT", "AMZN", "GOOGL", "ORCL", "IBM"] },
  { label: "Payments", tickers: ["V", "MA", "AXP", "PYPL", "COF"] },
];

function parseTickers(raw: string) {
  return [...new Set(raw.split(",").map((ticker) => ticker.trim().toUpperCase()).filter((ticker) => /^[A-Z0-9.-]{1,12}$/.test(ticker)))].slice(0, MAX_TICKERS);
}

function money(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  const absolute = Math.abs(value);
  const [scale, suffix] = absolute >= 1e12 ? [1e12, "T"] : absolute >= 1e9 ? [1e9, "B"] : absolute >= 1e6 ? [1e6, "M"] : [1, ""];
  return `${value < 0 ? "(" : ""}$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(absolute / scale)}${suffix}${value < 0 ? ")" : ""}`;
}

function multiple(value: number | null) { return value == null || !Number.isFinite(value) || value < 0 ? "—" : `${value.toFixed(value >= 10 ? 1 : 2)}x`; }
function percent(value: number | null) { return value == null || !Number.isFinite(value) ? "—" : `${(value * 100).toFixed(1)}%`; }

const metricGroups: Record<View, Array<{ key: keyof MetricRow; label: string; format: (value: number | null) => string }>> = {
  valuation: [
    { key: "marketCap", label: "Market cap", format: money }, { key: "enterpriseValue", label: "Enterprise value", format: money },
    { key: "evToRevenue", label: "EV / revenue", format: multiple }, { key: "evToEbitda", label: "EV / EBITDA", format: multiple },
    { key: "priceToEarnings", label: "P / earnings", format: multiple }, { key: "priceToFreeCashFlow", label: "P / free cash flow", format: multiple },
  ],
  operations: [
    { key: "revenue", label: "FY revenue", format: money }, { key: "revenueGrowth", label: "Revenue growth", format: percent },
    { key: "grossMargin", label: "Gross margin", format: percent }, { key: "operatingIncome", label: "Operating income", format: money },
    { key: "ebitda", label: "Derived EBITDA", format: money }, { key: "netIncome", label: "Net income", format: money },
    { key: "freeCashFlow", label: "Free cash flow", format: money },
  ],
  balance: [
    { key: "cash", label: "Cash", format: money }, { key: "reportedDebt", label: "Reported LT debt", format: money },
    { key: "netCash", label: "Net cash / (debt)", format: money }, { key: "netDebtToEbitda", label: "Net debt / EBITDA", format: multiple },
    { key: "cashToDebt", label: "Cash / debt", format: multiple }, { key: "debtToEquity", label: "Debt / equity", format: multiple },
    { key: "currentRatio", label: "Current ratio", format: multiple }, { key: "liabilitiesToAssets", label: "Liabilities / assets", format: percent },
  ],
};

export function CompTableBuilder({ initialTickers }: { initialTickers: string }) {
  const [tickers, setTickers] = useState(() => parseTickers(initialTickers));
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ query: string; data: ApiResponse | null; error: string }>({ query: "", data: null, error: "" });
  const [inputError, setInputError] = useState("");
  const [view, setView] = useState<View>("valuation");
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [descending, setDescending] = useState(true);
  const [copied, setCopied] = useState(false);
  const query = tickers.join(",");

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    window.history.replaceState(null, "", `/comps?tickers=${encodeURIComponent(query)}`);
    fetch(`/api/comp-table?tickers=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as ApiResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to build the comp table.");
        return payload;
      })
      .then((data) => setResult({ query, data, error: "" }))
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setResult({ query, data: null, error: reason instanceof Error ? reason.message : "Unable to build the comp table." });
      });
    return () => controller.abort();
  }, [query]);

  const data = result.query === query ? result.data : null;
  const error = inputError || (result.query === query ? result.error : "");
  const loading = Boolean(query) && result.query !== query;

  const rows = useMemo(() => [...(data?.rows ?? [])].sort((left, right) => {
    const a = left[sortKey] as number | null;
    const b = right[sortKey] as number | null;
    if (a == null && b == null) return left.ticker.localeCompare(right.ticker);
    if (a == null) return 1;
    if (b == null) return -1;
    return (a - b) * (descending ? -1 : 1);
  }), [data, sortKey, descending]);

  function addTicker(event: FormEvent) {
    event.preventDefault();
    const next = input.trim().toUpperCase();
    if (!/^[A-Z0-9.-]{1,12}$/.test(next)) return setInputError("Enter one valid ticker symbol, such as CAT or MSFT.");
    if (tickers.includes(next)) return setInput("");
    if (tickers.length >= MAX_TICKERS) return setInputError("Remove a ticker before adding another; ten is the maximum.");
    setTickers([...tickers, next]); setInput(""); setInputError("");
  }

  function exportCsv() {
    if (!rows.length) return;
    const headers = ["Ticker", "Company", "Sector", "Market Cap", "Enterprise Value", "FY Revenue", "Revenue Growth", "EV/Revenue", "Derived EBITDA", "EV/EBITDA", "P/E", "P/FCF", "Cash", "Reported LT Debt", "Net Cash/(Debt)", "Current Ratio", "Fiscal Period"];
    const values = rows.map((row) => [row.ticker, row.name, row.sector, row.marketCap, row.enterpriseValue, row.revenue, row.revenueGrowth, row.evToRevenue, row.ebitda, row.evToEbitda, row.priceToEarnings, row.priceToFreeCashFlow, row.cash, row.reportedDebt, row.netCash, row.currentRatio, row.fundamentalsAsOf]);
    const csv = [headers, ...values].map((record) => record.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); anchor.download = `learn-what-you-own-comps-${tickers.join("-")}.csv`; anchor.click(); URL.revokeObjectURL(anchor.href);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }

  const metrics = metricGroups[view];
  return <section className="container comp-builder">
    <div className="comp-builder-controls">
      <div><span className="kicker">YOUR COMPARABLE SET</span><h2>Add up to ten public companies</h2></div>
      <form onSubmit={addTicker}><label htmlFor="comp-ticker">Ticker</label><input id="comp-ticker" value={input} onChange={(event) => setInput(event.target.value)} placeholder="e.g. CAT" maxLength={12}/><button type="submit">Add company</button></form>
    </div>
    <div className="comp-ticker-chips">{tickers.map((ticker) => <button key={ticker} onClick={() => setTickers(tickers.filter((item) => item !== ticker))} aria-label={`Remove ${ticker}`}><strong>{ticker}</strong><span>×</span></button>)}<small>{tickers.length} / {MAX_TICKERS}</small></div>
    <div className="comp-presets"><span>Try a set:</span>{examples.map((example) => <button key={example.label} onClick={() => setTickers(example.tickers)}>{example.label}</button>)}</div>
    {data?.invalidTickers.length ? <div className="comp-warning"><strong>Not in the current research universe:</strong> {data.invalidTickers.join(", ")}. Remove or replace these symbols.</div> : null}
    {error && <div className="comp-error">{error}</div>}
    <div className="comp-toolbar">
      <div className="comp-view-tabs" role="group" aria-label="Comparison category">{(["valuation", "operations", "balance"] as View[]).map((item) => <button className={view === item ? "active" : ""} onClick={() => setView(item)} key={item}>{item === "operations" ? "Operations" : item === "balance" ? "Balance sheet" : "Valuation"}</button>)}</div>
      <div className="comp-sort"><label>Sort by<select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}><option value="marketCap">Market cap</option><option value="revenue">Revenue</option><option value="evToRevenue">EV / revenue</option><option value="evToEbitda">EV / EBITDA</option><option value="priceToEarnings">P / earnings</option><option value="revenueGrowth">Revenue growth</option><option value="netCash">Net cash</option></select></label><button onClick={() => setDescending(!descending)}>{descending ? "Highest first ↓" : "Lowest first ↑"}</button></div>
      <div className="comp-output-actions"><button onClick={copyLink}>{copied ? "Link copied ✓" : "Copy share link"}</button><button onClick={exportCsv}>Export CSV</button></div>
    </div>
    {loading ? <div className="comp-loading"><strong>Building your comp table…</strong><p>Matching market values with filing-grounded fundamentals.</p></div> : rows.length ? <>
      <div className="custom-comp-table" style={{ "--comp-metrics": metrics.length } as CSSProperties}><div className="custom-comp-head"><span>Company</span>{metrics.map((metric) => <span key={metric.key}>{metric.label}</span>)}<span>Evidence</span></div>{rows.map((row) => <div className="custom-comp-row" key={row.ticker}><div className="custom-comp-company"><Link href={`/company/${row.ticker.toLowerCase()}`}><strong>{row.ticker}</strong><small>{row.name}</small></Link><em>{row.sector}</em></div>{metrics.map((metric) => <div key={metric.key}><b>{metric.label}</b><strong>{metric.format(row[metric.key] as number | null)}</strong></div>)}<div className="custom-comp-evidence"><b>Evidence</b><span className={`coverage-${row.coverage}`}>{row.coverage === "complete" ? "Core facts available" : row.coverage === "partial" ? "Partial coverage" : "Awaiting filing facts"}</span><small>FY {row.fundamentalsAsOf ?? "—"}</small><small>{row.factsSource}</small>{row.sourceUrl && <a href={row.sourceUrl} target="_blank" rel="noreferrer">Open SEC source ↗</a>}</div></div>)}</div>
      <p className="comp-scroll-hint">On smaller screens, swipe horizontally to compare every metric.</p>
      <details className="comp-methodology"><summary>Definitions, limitations, and dates</summary><p>{data?.methodology.periods}</p><p>{data?.methodology.ebitda}</p><p>{data?.methodology.enterpriseValue}</p><p>“Reported LT debt” is the normalized long-term-debt XBRL fact and may exclude leases, securitizations, short-term borrowings, or a second debt classification. A blank multiple means the denominator is unavailable, incomplete, zero, or negative.</p><p>Financial institutions and REITs require sector-specific measures such as tangible book value, capital ratios, FFO, and NAV. Common operating-company multiples are directional for those sectors.</p></details>
    </> : <div className="comp-empty"><h3>Start with a ticker</h3><p>Add one to ten companies to create a reusable comparison table.</p></div>}
  </section>;
}
