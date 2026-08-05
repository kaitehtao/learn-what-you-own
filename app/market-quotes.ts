const NASDAQ_QUOTE_URL = "https://api.nasdaq.com/api/quote";
const NASDAQ_SCREENER_URL = "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=25&offset=0&download=true";
const NASDAQ_REQUEST_TIMEOUT_MS = 5000;
const NASDAQ_SCREENER_TIMEOUT_MS = 6500;

type NasdaqQuotePayload = {
  data?: {
    symbol?: string;
    companyName?: string;
    marketStatus?: string;
    primaryData?: {
      lastSalePrice?: string;
      lastTradeTimestamp?: string;
      isRealTime?: boolean;
    } | null;
  } | null;
};

type NasdaqSummaryPayload = {
  data?: {
    summaryData?: {
      MarketCap?: {
        value?: string;
      } | null;
    } | null;
  } | null;
};

type NasdaqScreenerPayload = {
  data?: {
    rows?: Array<{
      symbol?: string;
      name?: string;
      lastsale?: string;
      marketCap?: string;
    }> | null;
  } | null;
};

type NasdaqHistoricalPayload = {
  data?: {
    tradesTable?: {
      rows?: Array<{
        date?: string;
        close?: string;
        volume?: string;
      }> | null;
    } | null;
  } | null;
};

export type MarketQuote = {
  ticker: string;
  companyName: string;
  price: number | null;
  marketCap: number | null;
  asOf: string;
  marketStatus: string;
  isRealTime: boolean;
  sourceLabel: string;
  sourceUrl: string;
};

export type HistoricalMarketPrice = {
  date: string;
  close: number;
  volume: number | null;
  sourceLabel: string;
  sourceUrl: string;
};

function priceFromDisplay(value: string | undefined) {
  if (!value || value === "N/A") return null;
  const price = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function marketCapFromDisplay(value: string | undefined) {
  if (!value || value === "N/A") return null;
  const marketCap = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(marketCap) && marketCap >= 0 ? marketCap : null;
}

function isoDateFromNasdaq(value: string | undefined) {
  const match = value?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[1]}-${match[2]}` : null;
}

function integerFromDisplay(value: string | undefined) {
  if (!value || value === "N/A") return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function fetchNasdaqQuote(tickerValue: string): Promise<MarketQuote> {
  const ticker = tickerValue.trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,12}$/.test(ticker)) throw new Error("Invalid ticker");
  const requestOptions = {
    headers: { accept: "application/json", "user-agent": "Learn What You Own market data" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(NASDAQ_REQUEST_TIMEOUT_MS),
  } as const;
  const [quoteResponse, summaryResponse] = await Promise.all([
    fetch(`${NASDAQ_QUOTE_URL}/${encodeURIComponent(ticker)}/info?assetclass=stocks`, requestOptions),
    fetch(`${NASDAQ_QUOTE_URL}/${encodeURIComponent(ticker)}/summary?assetclass=stocks`, requestOptions),
  ]);
  if (!quoteResponse.ok) throw new Error(`Quote provider returned ${quoteResponse.status}`);
  const payload = await quoteResponse.json() as NasdaqQuotePayload;
  const summary = summaryResponse.ok ? await summaryResponse.json() as NasdaqSummaryPayload : null;
  const primary = payload.data?.primaryData;
  return {
    ticker,
    companyName: payload.data?.companyName ?? ticker,
    price: priceFromDisplay(primary?.lastSalePrice),
    marketCap: marketCapFromDisplay(summary?.data?.summaryData?.MarketCap?.value),
    asOf: primary?.lastTradeTimestamp ?? "Latest available close",
    marketStatus: payload.data?.marketStatus ?? "Status unavailable",
    isRealTime: Boolean(primary?.isRealTime),
    sourceLabel: "Nasdaq market activity",
    sourceUrl: `https://www.nasdaq.com/market-activity/stocks/${encodeURIComponent(ticker.toLowerCase())}`,
  };
}

async function fetchNasdaqScreenerQuotes(tickers: string[]) {
  const response = await fetch(NASDAQ_SCREENER_URL, {
    headers: { accept: "application/json", "user-agent": "Learn What You Own market data" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(NASDAQ_SCREENER_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Quote provider returned ${response.status}`);
  const payload = await response.json() as NasdaqScreenerPayload;
  const requested = new Map(tickers.map((ticker) => [ticker.replaceAll(".", "/"), ticker]));
  const quotes = new Map<string, MarketQuote>();
  for (const row of payload.data?.rows ?? []) {
    const providerTicker = String(row.symbol ?? "").toUpperCase();
    const ticker = requested.get(providerTicker);
    if (!ticker) continue;
    quotes.set(ticker, {
      ticker,
      companyName: row.name ?? ticker,
      price: priceFromDisplay(row.lastsale),
      marketCap: marketCapFromDisplay(row.marketCap),
      asOf: "Latest available Nasdaq quote",
      marketStatus: "Latest market data",
      isRealTime: false,
      sourceLabel: "Nasdaq market activity",
      sourceUrl: `https://www.nasdaq.com/market-activity/stocks/${encodeURIComponent(ticker.toLowerCase().replaceAll(".", "-"))}`,
    });
  }
  return quotes;
}

export async function fetchNasdaqQuotes(tickerValues: string[]) {
  const tickers = [...new Set(tickerValues.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))];
  if (tickers.length > 1) {
    try {
      return await fetchNasdaqScreenerQuotes(tickers);
    } catch (error) {
      console.error("Unable to load bulk market snapshots", error);
    }
  }
  const quotes = new Map<string, MarketQuote>();
  await Promise.all(tickers.map(async (ticker) => {
      try {
        quotes.set(ticker, await fetchNasdaqQuote(ticker));
      } catch (error) {
        console.error(`Unable to load quote for ${ticker}`, error);
      }
  }));
  return quotes;
}

export async function fetchNasdaqHistoricalPrices(tickerValue: string, years = 5): Promise<HistoricalMarketPrice[]> {
  const ticker = tickerValue.trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,12}$/.test(ticker)) throw new Error("Invalid ticker");
  const boundedYears = Math.min(10, Math.max(1, Math.round(years)));
  const to = new Date();
  const from = new Date(Date.UTC(to.getUTCFullYear() - boundedYears, to.getUTCMonth(), to.getUTCDate()));
  const sourceUrl = `https://www.nasdaq.com/market-activity/stocks/${encodeURIComponent(ticker.toLowerCase().replaceAll(".", "-"))}/historical`;
  const endpoint = `${NASDAQ_QUOTE_URL}/${encodeURIComponent(ticker)}/historical?assetclass=stocks&fromdate=${from.toISOString().slice(0, 10)}&todate=${to.toISOString().slice(0, 10)}&limit=5000`;
  const response = await fetch(endpoint, {
    headers: { accept: "application/json", "user-agent": "Learn What You Own market data" },
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error(`Historical price provider returned ${response.status}`);
  const payload = await response.json() as NasdaqHistoricalPayload;
  return (payload.data?.tradesTable?.rows ?? []).flatMap((row) => {
    const date = isoDateFromNasdaq(row.date);
    const close = priceFromDisplay(row.close);
    if (!date || close === null || close <= 0) return [];
    return [{ date, close, volume: integerFromDisplay(row.volume), sourceLabel: "Nasdaq historical prices", sourceUrl }];
  }).sort((left, right) => left.date.localeCompare(right.date));
}
