import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { filingFacts } from "../../../db/schema";
import { importSecFilingFacts } from "../../data/secFactsRepository";
import { researchUniverse } from "../../data/universe";
import { fetchNasdaqHistoricalPrices, fetchNasdaqQuote } from "../../market-quotes";
import { buildHistoricalValuationSeries, buildValuationWindows } from "../../valuation-history";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ticker = (url.searchParams.get("ticker") ?? "").trim().toUpperCase();
  const years = Math.min(10, Math.max(1, Number(url.searchParams.get("years") ?? 5) || 5));
  const company = researchUniverse.find((candidate) => candidate.ticker === ticker);
  if (!company || company.exchange === "OTC") return Response.json({ error: "Choose a supported U.S.-listed company." }, { status: 400 });

  try {
    const db = getDb();
    let facts = await db.select().from(filingFacts).where(eq(filingFacts.ticker, ticker))
      .orderBy(asc(filingFacts.filedAt), asc(filingFacts.periodEnd));
    const metricCounts = new Map<string, number>();
    for (const fact of facts) metricCounts.set(fact.metricKey, (metricCounts.get(fact.metricKey) ?? 0) + 1);
    const hasLegacyHistoryCap = [...metricCounts.values()].some((count) => count === 20);
    if (!facts.some((fact) => fact.metricKey === "shares_outstanding" || fact.metricKey === "diluted_shares") || hasLegacyHistoryCap) {
      try {
        await importSecFilingFacts(ticker);
        facts = await db.select().from(filingFacts).where(eq(filingFacts.ticker, ticker))
          .orderBy(asc(filingFacts.filedAt), asc(filingFacts.periodEnd));
      } catch (error) {
        console.error(`Unable to refresh valuation facts for ${ticker}.`, error);
      }
    }

    const [historicalPrices, latestQuote] = await Promise.all([
      fetchNasdaqHistoricalPrices(ticker, years),
      fetchNasdaqQuote(ticker).catch(() => null),
    ]);
    if (latestQuote?.price) historicalPrices.push({
      date: new Date().toISOString().slice(0, 10), close: latestQuote.price, volume: null,
      sourceLabel: latestQuote.sourceLabel, sourceUrl: latestQuote.sourceUrl,
    });
    const points = buildHistoricalValuationSeries(facts, historicalPrices);
    const windows = buildValuationWindows(points, [1, 3, 5]);
    const statistics = Object.fromEntries(Object.entries(windows).map(([key, window]) => [key, window.statistics]));
    const sourceUrl = historicalPrices.at(-1)?.sourceUrl ?? latestQuote?.sourceUrl ?? null;
    return Response.json({
      ticker,
      companyName: company.name,
      years,
      points: points.slice(-120).reverse(),
      statistics,
      windows,
      latest: points.at(-1) ?? null,
      sources: {
        prices: sourceUrl,
        fundamentals: facts.at(-1)?.sourceUrl ?? null,
      },
      methodology: {
        availability: "Every observation uses only SEC facts whose filing date was on or before that market date.",
        marketValue: "Historical market capitalization equals the month-end closing price multiplied by the latest then-available reported share count.",
        enterpriseValue: "Enterprise value adds reported long-term debt and subtracts reported cash. Lease liabilities, minority interests, pension deficits, and other adjustments may require analyst normalization.",
        flows: "Revenue, net income, operating cash flow, capital spending, and derived EBITDA use the latest then-available annual filing. These are trailing annual screening multiples, not forward consensus multiples.",
      },
    }, { headers: { "cache-control": "public, max-age=900, s-maxage=86400" } });
  } catch (error) {
    console.error(`Historical valuation failed for ${ticker}.`, error);
    return Response.json({ error: "Historical valuation is temporarily unavailable for this company." }, { status: 503 });
  }
}
