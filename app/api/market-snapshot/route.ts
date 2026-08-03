import { fetchNasdaqQuotes } from "../../market-quotes";

export const dynamic = "force-dynamic";

// Each ticker uses two Nasdaq requests. Keep the batch below the Cloudflare
// Workers subrequest limit and return partial results before the client gives up.
const MAX_TICKERS = 20;

function requestedTickers(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("tickers") ?? url.searchParams.get("ticker") ?? "";
  return [...new Set(raw.split(",").map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))].slice(0, MAX_TICKERS);
}

export async function GET(request: Request) {
  const tickers = requestedTickers(request);
  if (!tickers.length || tickers.some((ticker) => !/^[A-Z0-9.-]{1,12}$/.test(ticker))) {
    return Response.json({ error: "Provide one or more valid ticker symbols." }, { status: 400 });
  }

  const quotes = await fetchNasdaqQuotes(tickers);
  return Response.json({
    snapshots: Object.fromEntries(tickers.map((ticker) => {
      const quote = quotes.get(ticker);
      return [ticker, quote ? {
        ticker: quote.ticker,
        price: quote.price,
        marketCap: quote.marketCap,
        asOf: quote.asOf,
        marketStatus: quote.marketStatus,
        isRealTime: quote.isRealTime,
        sourceLabel: quote.sourceLabel,
        sourceUrl: quote.sourceUrl,
      } : null];
    })),
  }, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
}
