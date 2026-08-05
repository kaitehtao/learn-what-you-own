"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MetricKey = "priceToEarnings" | "evToRevenue" | "evToEbitda" | "priceToFreeCashFlow" | "freeCashFlowYield";
type Statistic = { metric: MetricKey; current: number | null; mean: number | null; median: number | null; minimum: number | null; maximum: number | null; percentile: number | null; premiumToMedian: number | null; observationCount: number };
type Point = { date: string; price: number; marketCap: number; enterpriseValue: number | null; priceToEarnings: number | null; evToRevenue: number | null; evToEbitda: number | null; priceToFreeCashFlow: number | null; freeCashFlowYield: number | null; fundamentalsPeriodEnd: string | null; fundamentalsFiledAt: string | null };
type Payload = { ticker: string; points: Point[]; latest: Point | null; statistics: Record<"1y" | "3y" | "5y", Statistic[]>; sources: { prices: string | null; fundamentals: string | null }; methodology: Record<string, string>; error?: string };

const labels: Record<MetricKey, string> = { priceToEarnings: "P / earnings", evToRevenue: "EV / revenue", evToEbitda: "EV / EBITDA", priceToFreeCashFlow: "P / free cash flow", freeCashFlowYield: "Free cash flow yield" };
const metricOrder = Object.keys(labels) as MetricKey[];

function multiple(value: number | null, yieldMetric = false) {
  if (value === null || !Number.isFinite(value)) return "—";
  return yieldMetric ? `${(value * 100).toFixed(1)}%` : `${value.toFixed(value >= 10 ? 1 : 2)}x`;
}
function money(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  const [scale, suffix] = Math.abs(value) >= 1e12 ? [1e12, "T"] : Math.abs(value) >= 1e9 ? [1e9, "B"] : [1e6, "M"];
  return `$${(value / scale).toFixed(1)}${suffix}`;
}
function date(value: string | null) { return value ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "—"; }

export function HistoricalValuationPanel({ ticker }: { ticker: string }) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState<"1y" | "3y" | "5y">("5y");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/valuation-history?ticker=${encodeURIComponent(ticker)}&years=5`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as Payload;
        if (!response.ok) throw new Error(data.error ?? "Historical valuation is unavailable.");
        setPayload(data);
      })
      .catch((reason) => { if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "Historical valuation is unavailable."); });
    return () => controller.abort();
  }, [ticker]);

  const stats = useMemo(() => new Map((payload?.statistics?.[range] ?? []).map((item) => [item.metric, item])), [payload, range]);
  const visiblePoints = useMemo(() => {
    const points = payload?.points ?? [];
    const newest = points[0]?.date;
    if (!newest) return [];
    const cutoff = `${Number(newest.slice(0, 4)) - Number(range[0])}${newest.slice(4)}`;
    return points.filter((point) => point.date >= cutoff).slice(0, 60);
  }, [payload, range]);
  return <section className="historical-valuation" id="valuation-history">
    <header><div><span className="kicker">PUBLIC VALUATION HISTORY</span><h2>What the market has paid over time</h2><p>Point-in-time trailing multiples matched to the filings investors could actually see on each date.</p></div><div className="valuation-range" aria-label="Historical valuation window">{(["1y","3y","5y"] as const).map(item => <button className={range === item ? "active" : ""} key={item} onClick={() => setRange(item)}>{item.toUpperCase()}</button>)}</div></header>
    {error ? <div className="valuation-empty"><strong>History is not available yet.</strong><p>{error}</p><Link href={`/workspace?ticker=${encodeURIComponent(ticker)}`}>Open your private analyst workspace →</Link></div> : !payload ? <div className="valuation-loading">Building the point-in-time valuation record…</div> : <>
      <div className="valuation-current"><div><small>LATEST PRICE</small><strong>{payload.latest ? `$${payload.latest.price.toFixed(2)}` : "—"}</strong><span>{date(payload.latest?.date ?? null)}</span></div><div><small>MARKET CAP</small><strong>{money(payload.latest?.marketCap ?? null)}</strong><span>Reported shares × price</span></div><div><small>ENTERPRISE VALUE</small><strong>{money(payload.latest?.enterpriseValue ?? null)}</strong><span>Debt and cash adjusted</span></div><div><small>FUNDAMENTALS AVAILABLE</small><strong>{date(payload.latest?.fundamentalsPeriodEnd ?? null)}</strong><span>Filed {payload.latest?.fundamentalsFiledAt ?? "—"}</span></div></div>
      <div className="valuation-stat-table"><div className="valuation-stat-head"><span>Metric</span><span>Current</span><span>Median</span><span>Mean</span><span>Low–high</span><span>Percentile</span><span>Vs median</span></div>{metricOrder.map(metric => { const item = stats.get(metric); const isYield = metric === "freeCashFlowYield"; return <div className="valuation-stat-row" key={metric}><strong>{labels[metric]}</strong><span data-label="Current">{multiple(item?.current ?? null, isYield)}</span><span data-label="Median">{multiple(item?.median ?? null, isYield)}</span><span data-label="Mean">{multiple(item?.mean ?? null, isYield)}</span><span data-label="Low–high">{multiple(item?.minimum ?? null, isYield)} – {multiple(item?.maximum ?? null, isYield)}</span><span data-label="Percentile">{item?.percentile == null ? "—" : `${item.percentile.toFixed(0)}th`}</span><span data-label="Vs median" className={(item?.premiumToMedian ?? 0) > 0 ? "valuation-premium" : "valuation-discount"}>{item?.premiumToMedian == null ? "—" : `${item.premiumToMedian >= 0 ? "+" : ""}${(item.premiumToMedian * 100).toFixed(1)}%`}</span></div>; })}</div>
      <details className="valuation-observations"><summary>Review monthly observations and filing dates</summary><div><div className="valuation-observation-head"><span>Date</span><span>Price</span><span>P/E</span><span>EV/revenue</span><span>EV/EBITDA</span><span>P/FCF</span><span>Filing available</span></div>{visiblePoints.map(point => <div key={point.date}><span>{date(point.date)}</span><span>${point.price.toFixed(2)}</span><span>{multiple(point.priceToEarnings)}</span><span>{multiple(point.evToRevenue)}</span><span>{multiple(point.evToEbitda)}</span><span>{multiple(point.priceToFreeCashFlow)}</span><span>{point.fundamentalsFiledAt ?? "—"}</span></div>)}</div></details>
      <div className="valuation-boundary"><div><strong>Public facts</strong><p>Prices, filed fundamentals, calculated multiples, methodology and source links are visible to everyone.</p></div><div><strong>Your private judgment</strong><p>Targets, probability weights, conviction, notes and decisions stay private in your analyst workspace.</p></div><Link href={`/workspace?ticker=${encodeURIComponent(ticker)}`}>Open private workspace →</Link></div>
      <details className="valuation-methodology"><summary>Methodology and limitations</summary>{Object.values(payload.methodology).map(item => <p key={item}>{item}</p>)}<p>A low historical percentile is not automatically undervaluation. Business quality, growth, capital structure, cyclicality and accounting can change.</p><p>{payload.sources.prices && <a href={payload.sources.prices} target="_blank" rel="noreferrer">Historical price source ↗</a>} {payload.sources.fundamentals && <a href={payload.sources.fundamentals} target="_blank" rel="noreferrer">SEC fundamentals source ↗</a>}</p></details>
    </>}
  </section>;
}
