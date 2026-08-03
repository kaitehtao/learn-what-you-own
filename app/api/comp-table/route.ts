import { asc, desc, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { filingFacts } from "../../../db/schema";
import { comparableArchetype, summarizeComparableMetrics, type ComparableFilingFact } from "../../data/comparableMetrics";
import { researchUniverse } from "../../data/universe";
import { fetchNasdaqQuotes } from "../../market-quotes";

export const dynamic = "force-dynamic";

const MAX_TICKERS = 10;

function requestedTickers(request: Request) {
  const raw = new URL(request.url).searchParams.get("tickers") ?? "";
  return [...new Set(raw.split(",").map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))];
}

export async function GET(request: Request) {
  const requested = requestedTickers(request);
  if (!requested.length) return Response.json({ error: "Add at least one ticker." }, { status: 400 });
  if (requested.length > MAX_TICKERS) return Response.json({ error: "A comp table can contain no more than ten tickers." }, { status: 400 });
  if (requested.some((ticker) => !/^[A-Z0-9.-]{1,12}$/.test(ticker))) {
    return Response.json({ error: "Use valid ticker symbols separated by commas." }, { status: 400 });
  }

  const universeByTicker = new Map(researchUniverse.map((company) => [company.ticker, company]));
  const invalidTickers = requested.filter((ticker) => !universeByTicker.has(ticker));
  const tickers = requested.filter((ticker) => universeByTicker.has(ticker));
  if (!tickers.length) return Response.json({ error: "None of those tickers are in the current research universe.", invalidTickers }, { status: 400 });

  try {
    const db = getDb();
    const [facts, quotes] = await Promise.all([
      db.select().from(filingFacts).where(inArray(filingFacts.ticker, tickers))
        .orderBy(asc(filingFacts.ticker), asc(filingFacts.metricKey), desc(filingFacts.periodEnd)),
      fetchNasdaqQuotes(tickers),
    ]);
    const rows = tickers.map((ticker) => {
      const company = universeByTicker.get(ticker)!;
      const quote = quotes.get(ticker);
      return {
        ticker,
        name: company.name,
        sector: company.sector,
        exchange: company.exchange,
        memberships: company.memberships,
        archetype: comparableArchetype(company.sector).name,
        quoteAsOf: quote?.asOf ?? null,
        quoteSourceUrl: quote?.sourceUrl ?? null,
        ...summarizeComparableMetrics(
          facts.filter((fact) => fact.ticker === ticker) as ComparableFilingFact[],
          quote?.marketCap ?? null,
        ),
      };
    });

    return Response.json({
      tickers,
      invalidTickers,
      rows,
      methodology: {
        ebitda: "Derived EBITDA equals SEC-reported operating income plus SEC-reported depreciation and amortization for the same latest fiscal year. It is not company-defined adjusted EBITDA.",
        enterpriseValue: "Enterprise value equals current Nasdaq market capitalization plus the normalized reported long-term-debt fact less cash when all inputs are available.",
        periods: "Market values are current snapshots. Income-statement and cash-flow metrics use the latest reported fiscal year; balance-sheet metrics use the latest reported period.",
      },
    }, { headers: { "cache-control": "public, max-age=300, s-maxage=21600" } });
  } catch (error) {
    console.error("Unable to build custom comp table.", error);
    return Response.json({ error: "The comparison service is temporarily unavailable." }, { status: 503 });
  }
}
