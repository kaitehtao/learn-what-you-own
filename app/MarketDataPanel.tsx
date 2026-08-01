"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MarketDataPanelProps = {
  ticker: string;
  exchange: string;
};

const ranges = [
  { label: "1D", name: "1 day", range: "1D", interval: "15" },
  { label: "3M", name: "3 months", range: "3M", interval: "D" },
  { label: "6M", name: "6 months", range: "6M", interval: "D" },
  { label: "YTD", name: "year to date", range: "YTD", interval: "D" },
  { label: "1Y", name: "1 year", range: "12M", interval: "W" },
  { label: "5Y", name: "5 years", range: "60M", interval: "W" },
  { label: "MAX", name: "maximum history", range: "ALL", interval: "M" },
] as const;

function tradingViewExchange(exchange: string) {
  const normalized = exchange.toUpperCase();
  if (normalized.includes("NASDAQ")) return "NASDAQ";
  if (normalized.includes("NYSE ARCA") || normalized.includes("NYSEARCA")) return "AMEX";
  if (normalized.includes("NYSE")) return "NYSE";
  if (normalized.includes("OTC")) return "OTC";
  return normalized.replaceAll(" ", "");
}

function addWidget(container: HTMLDivElement, src: string, config: Record<string, unknown>) {
  container.replaceChildren();
  const script = document.createElement("script");
  script.src = src;
  script.type = "text/javascript";
  script.async = true;
  script.text = JSON.stringify(config);
  container.appendChild(script);
}

export function MarketDataPanel({ ticker, exchange }: MarketDataPanelProps) {
  const quoteRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedRange, setSelectedRange] = useState<(typeof ranges)[number]>(ranges[4]);
  const symbol = useMemo(
    () => `${tradingViewExchange(exchange)}:${ticker.toUpperCase()}`,
    [exchange, ticker],
  );

  useEffect(() => {
    if (!quoteRef.current) return;
    addWidget(
      quoteRef.current,
      "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js",
      {
        symbol,
        width: "100%",
        locale: "en",
        colorTheme: "light",
        isTransparent: true,
      },
    );
  }, [symbol]);

  useEffect(() => {
    if (!chartRef.current) return;
    addWidget(
      chartRef.current,
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
      {
        autosize: true,
        symbol,
        interval: selectedRange.interval,
        range: selectedRange.range,
        timezone: "exchange",
        theme: "light",
        style: "2",
        locale: "en",
        allow_symbol_change: false,
        hide_top_toolbar: true,
        hide_side_toolbar: true,
        hide_legend: true,
        hide_volume: true,
        withdateranges: false,
        save_image: false,
        calendar: false,
        support_host: "https://www.tradingview.com",
        backgroundColor: "rgba(255, 255, 255, 1)",
        gridColor: "rgba(228, 233, 229, 0.7)",
      },
    );
  }, [selectedRange, symbol]);

  return (
    <section className="market-data-panel" id="market-data" aria-labelledby="market-data-title">
      <div className="market-data-heading">
        <div>
          <span className="kicker">MARKET DATA</span>
          <h2 id="market-data-title">Price &amp; trading history</h2>
          <p>Latest available quote and historical price action for {ticker.toUpperCase()}.</p>
        </div>
        <div className="market-symbol">
          <span>{exchange}</span>
          <strong>{ticker.toUpperCase()}</strong>
        </div>
      </div>

      <div className="market-quote-card">
        <div
          className="tradingview-widget-container market-quote-widget"
          ref={quoteRef}
          aria-label={`${ticker} latest stock quote`}
        >
          <div className="tradingview-widget-container__widget">Loading latest market quote…</div>
        </div>
      </div>

      <div className="market-chart-card">
        <div className="market-chart-toolbar">
          <div>
            <small>PRICE HISTORY</small>
            <strong>{selectedRange.name}</strong>
          </div>
          <div className="market-range-buttons" aria-label="Select price history range">
            {ranges.map((range) => (
              <button
                type="button"
                key={range.label}
                className={range.label === selectedRange.label ? "active" : ""}
                aria-pressed={range.label === selectedRange.label}
                onClick={() => setSelectedRange(range)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div
          key={`${symbol}-${selectedRange.label}`}
          className="tradingview-widget-container market-chart-widget"
          ref={chartRef}
          aria-label={`${ticker} ${selectedRange.name} historical stock chart`}
        >
          <div className="tradingview-widget-container__widget">Loading price history…</div>
        </div>
      </div>

      <div className="market-data-footnote">
        <span>Quotes and charts provided by TradingView.</span>
        <span>Market data may be delayed and is for informational purposes only.</span>
      </div>
    </section>
  );
}
