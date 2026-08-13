export type ExternalResearchLink = {
  key: string;
  name: string;
  category: string;
  description: string;
  href: string;
  mark: string;
};

function normalizedTicker(ticker: string) {
  return ticker.trim().toUpperCase();
}

function yahooTicker(ticker: string) {
  return normalizedTicker(ticker).replaceAll(".", "-").replaceAll("/", "-");
}

function exchangeSymbols(exchange: string) {
  const normalized = exchange.trim().toUpperCase();
  if (normalized.includes("NASDAQ")) return { google: "NASDAQ", tradingView: "NASDAQ" };
  if (normalized === "NYSE" || normalized.includes("NEW YORK")) return { google: "NYSE", tradingView: "NYSE" };
  if (normalized.includes("AMERICAN") || normalized === "AMEX") return { google: "NYSEAMERICAN", tradingView: "AMEX" };
  if (normalized.includes("OTC")) return { google: "OTCMKTS", tradingView: "OTC" };
  return null;
}

export function externalResearchLinks(ticker: string, exchange: string): ExternalResearchLink[] {
  const symbol = normalizedTicker(ticker);
  const encodedSymbol = encodeURIComponent(symbol);
  const yahooSymbol = yahooTicker(symbol);
  const venue = exchangeSymbols(exchange);
  const googleHref = venue
    ? `https://www.google.com/finance/quote/${encodedSymbol}:${venue.google}`
    : `https://www.google.com/finance/?q=${encodedSymbol}`;
  const tradingViewHref = venue
    ? `https://www.tradingview.com/symbols/${venue.tradingView}-${encodedSymbol}/`
    : `https://www.tradingview.com/symbols/${encodedSymbol}/`;

  return [
    {
      key: "yahoo-finance",
      name: "Yahoo Finance",
      category: "Quote & news",
      description: "Price history, financial statements, estimates, options, holders, and aggregated news.",
      href: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}/`,
      mark: "YF",
    },
    {
      key: "google-finance",
      name: "Google Finance",
      category: "Market overview",
      description: "A concise quote, chart, related news, financials, and comparable-company view.",
      href: googleHref,
      mark: "GF",
    },
    {
      key: "tradingview",
      name: "TradingView",
      category: "Charts & technicals",
      description: "Interactive charts, technical indicators, estimates, financials, and market ideas.",
      href: tradingViewHref,
      mark: "TV",
    },
    {
      key: "stocktwits",
      name: "Stocktwits",
      category: "Market conversation",
      description: "Real-time investor conversation and sentiment; treat posts as unverified market pulse.",
      href: `https://stocktwits.com/symbol/${encodedSymbol}`,
      mark: "ST",
    },
    {
      key: "seeking-alpha",
      name: "Seeking Alpha",
      category: "Analysis & transcripts",
      description: "Contributor analysis, earnings-call transcripts, estimates, ratings, and discussion.",
      href: `https://seekingalpha.com/symbol/${encodedSymbol}`,
      mark: "SA",
    },
    {
      key: "stock-analysis",
      name: "Stock Analysis",
      category: "Fundamentals",
      description: "Standardized financial statements, ratios, forecasts, dividend history, and statistics.",
      href: `https://stockanalysis.com/stocks/${encodeURIComponent(yahooSymbol.toLowerCase())}/`,
      mark: "FA",
    },
    {
      key: "finviz",
      name: "Finviz",
      category: "Screening snapshot",
      description: "A compact view of valuation, performance, ownership, insider activity, and news.",
      href: `https://finviz.com/quote.ashx?t=${encodedSymbol}`,
      mark: "FZ",
    },
    {
      key: "marketwatch",
      name: "MarketWatch",
      category: "Quote & coverage",
      description: "Market data, company financials, analyst estimates, news, and historical prices.",
      href: `https://www.marketwatch.com/investing/stock/${encodeURIComponent(yahooSymbol.toLowerCase())}`,
      mark: "MW",
    },
    {
      key: "earnings-whispers",
      name: "Earnings Whispers",
      category: "Earnings expectations",
      description: `Upcoming earnings, reported results, consensus expectations, and independent whisper research for ${symbol}.`,
      href: "https://www.earningswhispers.com/",
      mark: "EW",
    },
  ];
}
