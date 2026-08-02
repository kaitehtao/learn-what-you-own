"use client";

import { useEffect, useState } from "react";
import { formatMarketCap, formatStockPrice, type CompanyMarketSnapshot as Snapshot } from "./market-snapshot";

export function CompanyMarketSnapshot({ ticker }: { ticker: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/market-snapshot?ticker=${encodeURIComponent(ticker)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Market data unavailable");
        const payload = await response.json() as { snapshots?: Record<string, Snapshot | null> };
        setSnapshot(payload.snapshots?.[ticker.toUpperCase()] ?? null);
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") setSnapshot(null);
      });
    return () => controller.abort();
  }, [ticker]);

  const loading = snapshot === undefined;
  return <div className="container company-market-snapshot" aria-label={`${ticker} current stock price and market capitalization`} aria-live="polite">
    <div className="market-snapshot-value">
      <small>CURRENT STOCK PRICE</small>
      <strong>{loading ? "Loading…" : formatStockPrice(snapshot?.price)}</strong>
      <span>{snapshot?.isRealTime ? "Real-time quote" : "Latest available quote"}</span>
    </div>
    <div className="market-snapshot-value">
      <small>MARKET CAPITALIZATION</small>
      <strong>{loading ? "Loading…" : formatMarketCap(snapshot?.marketCap)}</strong>
      <span>Current equity market value</span>
    </div>
    <div className="market-snapshot-source">
      <small>MARKET DATA STATUS</small>
      <strong>{snapshot?.marketStatus ?? (loading ? "Retrieving market data" : "Temporarily unavailable")}</strong>
      {snapshot ? <a href={snapshot.sourceUrl} target="_blank" rel="noreferrer">{snapshot.sourceLabel} · {snapshot.asOf} ↗</a> : <span>{loading ? "Refreshing every five minutes" : "Please check again shortly"}</span>}
    </div>
  </div>;
}
