"use client";

import { useEffect, useState } from "react";

type ComparableRow = {
  ticker: string;
  name: string;
  subject: boolean;
  relationship: string;
  quoteSourceUrl: string | null;
  quoteAsOf: string | null;
  marketCap: number | null;
  enterpriseValue: number | null;
  revenue: number | null;
  netIncome: number | null;
  freeCashFlow: number | null;
  cash: number | null;
  reportedDebt: number | null;
  netCash: number | null;
  evToRevenue: number | null;
  priceToEarnings: number | null;
  priceToFreeCashFlow: number | null;
  cashToMarketCap: number | null;
  debtToMarketCap: number | null;
  revenueGrowth: number | null;
  grossMargin: number | null;
  fundamentalsAsOf: string | null;
  sourceUrl: string | null;
  coverage: "complete" | "partial" | "awaiting-filing-data";
};

type ComparableResponse = {
  archetype: { name: string; caveat: string };
  rows: ComparableRow[];
  methodology: { valuation: string; fundamentals: string; nullPolicy: string };
};

function money(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  const absolute = Math.abs(value);
  const [scale, suffix] = absolute >= 1e12 ? [1e12, "T"] : absolute >= 1e9 ? [1e9, "B"] : absolute >= 1e6 ? [1e6, "M"] : [1, ""];
  return `${value < 0 ? "(" : ""}$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(absolute / scale)}${suffix}${value < 0 ? ")" : ""}`;
}

function multiple(value: number | null) {
  return value == null || !Number.isFinite(value) || value < 0 ? "—" : `${value.toFixed(value >= 10 ? 1 : 2)}x`;
}

function percent(value: number | null) {
  return value == null || !Number.isFinite(value) ? "—" : `${(value * 100).toFixed(1)}%`;
}

function coverageLabel(coverage: ComparableRow["coverage"]) {
  if (coverage === "complete") return "Core SEC facts available";
  if (coverage === "partial") return "Partial SEC coverage";
  return "Awaiting filing import";
}

export function ComparableAnalysisPanel({ ticker }: { ticker: string }) {
  const [data, setData] = useState<ComparableResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/comparables?ticker=${encodeURIComponent(ticker)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Comparable analysis unavailable");
        return response.json() as Promise<ComparableResponse>;
      })
      .then(setData)
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError("Live comparable metrics are temporarily unavailable. The peer-selection record remains below.");
      });
    return () => controller.abort();
  }, [ticker]);

  if (error) return <div className="comparable-analysis-state"><strong>Standardized comparable lens</strong><p>{error}</p></div>;
  if (!data) return <div className="comparable-analysis-state"><strong>Building the standardized comparable lens…</strong><p>Matching current market value with SEC-reported fundamentals.</p></div>;

  return <div className="comparable-analysis">
    <div className="comparable-analysis-heading">
      <div><span className="kicker">STANDARDIZED OWNER LENS</span><h3>{data.archetype.name}</h3></div>
      <p>{data.archetype.caveat}</p>
    </div>
    <div className="comparable-metric-table">
      <div className="comparable-metric-head"><span>Company</span><span>Scale</span><span>Valuation</span><span>Balance sheet</span><span>Operating quality</span></div>
      {data.rows.map((row) => <div className={`comparable-metric-row${row.subject ? " subject" : ""}`} key={row.ticker}>
        <div className="comparable-metric-company">
          <span className="comparable-metric-label">Company</span><strong>{row.ticker}</strong><small>{row.name}</small>
          {row.subject && <em>Subject company</em>}
          <b className={`coverage-${row.coverage}`}>{coverageLabel(row.coverage)}</b>
        </div>
        <div><span className="comparable-metric-label">Scale</span><dl><dt>Market cap</dt><dd>{money(row.marketCap)}</dd><dt>FY revenue</dt><dd>{money(row.revenue)}</dd><dt>Revenue growth</dt><dd>{percent(row.revenueGrowth)}</dd></dl></div>
        <div><span className="comparable-metric-label">Valuation</span><dl><dt>EV / revenue</dt><dd>{multiple(row.evToRevenue)}</dd><dt>P / earnings</dt><dd>{multiple(row.priceToEarnings)}</dd><dt>P / free cash flow</dt><dd>{multiple(row.priceToFreeCashFlow)}</dd></dl></div>
        <div><span className="comparable-metric-label">Balance sheet</span><dl><dt>Cash</dt><dd>{money(row.cash)} <small>{percent(row.cashToMarketCap)} of cap</small></dd><dt>Reported LT debt</dt><dd>{money(row.reportedDebt)} <small>{percent(row.debtToMarketCap)} of cap</small></dd><dt>Net cash / (debt)</dt><dd>{money(row.netCash)}</dd></dl></div>
        <div><span className="comparable-metric-label">Operating quality</span><dl><dt>Net income</dt><dd>{money(row.netIncome)}</dd><dt>Free cash flow</dt><dd>{money(row.freeCashFlow)}</dd><dt>Gross margin</dt><dd>{percent(row.grossMargin)}</dd></dl><small className="comparable-period">FY ending {row.fundamentalsAsOf ?? "—"}</small></div>
      </div>)}
    </div>
    <details className="comparable-methodology"><summary>How this comparison is calculated</summary><p>{data.methodology.valuation}</p><p>{data.methodology.fundamentals}</p><p>{data.methodology.nullPolicy}</p><p><strong>Debt limitation:</strong> “Reported LT debt” is the normalized long-term-debt fact currently available from SEC XBRL. It can exclude leases, securitizations, short-term borrowings, or a second debt classification; verify the linked filing before using enterprise value.</p></details>
  </div>;
}
