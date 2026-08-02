const NASDAQ_QUOTE_URL = "https://api.nasdaq.com/api/quote";

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

export async function fetchNasdaqQuote(tickerValue: string): Promise<MarketQuote> {
  const ticker = tickerValue.trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,12}$/.test(ticker)) throw new Error("Invalid ticker");
  const requestOptions = {
    headers: { accept: "application/json", "user-agent": "Learn What You Own market data" },
    next: { revalidate: 300 },
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

export async function fetchNasdaqQuotes(tickerValues: string[]) {
  const tickers = [...new Set(tickerValues.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))];
  const quotes = new Map<string, MarketQuote>();
  let cursor = 0;
  async function worker() {
    while (cursor < tickers.length) {
      const ticker = tickers[cursor++];
      try {
        quotes.set(ticker, await fetchNasdaqQuote(ticker));
      } catch (error) {
        console.error(`Unable to load quote for ${ticker}`, error);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, tickers.length) }, () => worker()));
  return quotes;
}
