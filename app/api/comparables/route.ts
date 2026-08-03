import { asc, desc, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { filingFacts } from "../../../db/schema";
import { comparableArchetype, summarizeComparableMetrics, type ComparableFilingFact } from "../../data/comparableMetrics";
import { featuredDossiers } from "../../data/featuredDossiers";
import { ensureFeaturedDossierRegistration, importSecFilingFacts } from "../../data/secFactsRepository";
import { researchUniverse } from "../../data/universe";
import { fetchNasdaqQuotes } from "../../market-quotes";

export const dynamic = "force-dynamic";

const MAX_PUBLIC_COMPARABLES = 8;

function selectedTickers(ticker: string) {
  const dossier = featuredDossiers[ticker];
  if (!dossier) return [];
  return [...new Set([
    ticker,
    ...(dossier.comparables ?? [])
      .filter((peer) => peer.ownership === "Public" && /^[A-Z0-9.-]{1,12}$/.test(peer.ticker))
      .map((peer) => peer.ticker.toUpperCase()),
  ])].slice(0, MAX_PUBLIC_COMPARABLES + 1);
}

function displayName(ticker: string) {
  return researchUniverse.find((company) => company.ticker === ticker)?.name
    ?? featuredDossiers[ticker]?.ticker
    ?? ticker;
}

async function readFacts(tickers: string[]) {
  const db = getDb();
  return db.select().from(filingFacts)
    .where(inArray(filingFacts.ticker, tickers))
    .orderBy(asc(filingFacts.ticker), asc(filingFacts.metricKey), desc(filingFacts.periodEnd));
}

export async function GET(request: Request) {
  const ticker = new URL(request.url).searchParams.get("ticker")?.trim().toUpperCase() ?? "";
  const dossier = featuredDossiers[ticker];
  const tickers = selectedTickers(ticker);
  if (!dossier || !tickers.length) {
    return Response.json({ error: "Choose a company with a published comparable set." }, { status: 400 });
  }

  try {
    let facts = await readFacts(tickers);
    if (!facts.some((fact) => fact.ticker === ticker)) {
      try {
        await ensureFeaturedDossierRegistration(ticker);
        await importSecFilingFacts(ticker);
        facts = await readFacts(tickers);
      } catch (error) {
        console.error(`Comparable filing import failed for ${ticker}; returning available peer data.`, error);
      }
    }

    const quotes = await fetchNasdaqQuotes(tickers);
    const peerMetadata = new Map((dossier.comparables ?? []).map((peer) => [peer.ticker.toUpperCase(), peer]));
    const rows = tickers.map((rowTicker) => {
      const peer = peerMetadata.get(rowTicker);
      const rowFacts = facts.filter((fact) => fact.ticker === rowTicker) as ComparableFilingFact[];
      const quote = quotes.get(rowTicker);
      return {
        ticker: rowTicker,
        name: rowTicker === ticker ? displayName(rowTicker) : peer?.name ?? displayName(rowTicker),
        subject: rowTicker === ticker,
        relationship: rowTicker === ticker ? "Subject company" : peer?.relationship ?? "Published operating peer",
        quoteSourceUrl: quote?.sourceUrl ?? null,
        quoteAsOf: quote?.asOf ?? null,
        ...summarizeComparableMetrics(rowFacts, quote?.marketCap ?? null),
      };
    }).sort((a, b) => Number(b.subject) - Number(a.subject) || (b.marketCap ?? -1) - (a.marketCap ?? -1));

    return Response.json({
      ticker,
      archetype: comparableArchetype(researchUniverse.find((company) => company.ticker === ticker)?.sector ?? ""),
      rows,
      methodology: {
        valuation: "Current Nasdaq market capitalization; enterprise value equals market cap plus reported long-term debt less cash when all three facts are available.",
        fundamentals: "Latest SEC-reported fiscal-year revenue, net income, gross profit, operating cash flow, and capital expenditures; latest reported balance-sheet cash and long-term debt fact.",
        nullPolicy: "Unavailable, loss-making, or incomplete inputs remain blank. The platform never converts a loss or missing balance-sheet fact into a misleading multiple.",
      },
    }, { headers: { "cache-control": "public, max-age=300, s-maxage=21600" } });
  } catch (error) {
    console.error(`Unable to build comparable analysis for ${ticker}.`, error);
    return Response.json({ error: "Comparable analysis is temporarily unavailable." }, { status: 503 });
  }
}
