import { asc, desc, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { filingFacts } from "../../../db/schema";
import { comparableArchetype, summarizeComparableMetrics, type ComparableFilingFact } from "../../data/comparableMetrics";
import { getSecCompany } from "../../data/secCompanies.generated";
import { normalizeCompanyFacts, type SecCompanyFacts } from "../../data/secMetrics";
import { researchUniverse } from "../../data/universe";
import { fetchNasdaqQuotes } from "../../market-quotes";

export const dynamic = "force-dynamic";

const MAX_TICKERS = 10;
const MAX_STORED_FACT_AGE_DAYS = 550;
const SEC_FETCH_CONCURRENCY = 3;

function requestedTickers(request: Request) {
  const raw = new URL(request.url).searchParams.get("tickers") ?? "";
  return [...new Set(raw.split(",").map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))];
}

function needsCurrentSecFacts(facts: ComparableFilingFact[]) {
  const latestRevenue = facts.filter((fact) => fact.metricKey === "revenue" && fact.fiscalPeriod === "FY")
    .sort((left, right) => right.periodEnd.localeCompare(left.periodEnd))[0];
  const oldestAccepted = new Date(Date.now() - MAX_STORED_FACT_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const missingExpandedMetrics = !facts.some((fact) => fact.metricKey === "depreciation_amortization")
    || !facts.some((fact) => fact.metricKey === "current_assets")
    || !facts.some((fact) => fact.metricKey === "current_liabilities");
  return !latestRevenue || latestRevenue.periodEnd < oldestAccepted || missingExpandedMetrics;
}

async function fetchCurrentSecFacts(ticker: string) {
  const company = getSecCompany(ticker);
  if (!company) return [];
  const response = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${company.cik}.json`, {
    headers: { accept: "application/json", "user-agent": "LearnWhatYouOwn/1.0 research@learnwhatyouown.com" },
    next: { revalidate: 21600 },
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error(`SEC Company Facts returned ${response.status} for ${ticker}.`);
  return normalizeCompanyFacts(company.cik, await response.json() as SecCompanyFacts) as ComparableFilingFact[];
}

async function refreshStaleFacts(tickers: string[], storedFacts: ComparableFilingFact[]) {
  const refreshed = new Map<string, ComparableFilingFact[]>();
  const staleTickers = tickers.filter((ticker) => needsCurrentSecFacts(storedFacts.filter((fact) => (fact as ComparableFilingFact & { ticker?: string }).ticker === ticker)));
  for (let index = 0; index < staleTickers.length; index += SEC_FETCH_CONCURRENCY) {
    const batch = staleTickers.slice(index, index + SEC_FETCH_CONCURRENCY);
    const results = await Promise.allSettled(batch.map((ticker) => fetchCurrentSecFacts(ticker)));
    results.forEach((result, resultIndex) => {
      if (result.status === "fulfilled" && result.value.length) refreshed.set(batch[resultIndex], result.value);
      if (result.status === "rejected") console.error(`Current SEC comparable facts unavailable for ${batch[resultIndex]}.`, result.reason);
    });
  }
  return refreshed;
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
    const [storedFacts, quotes] = await Promise.all([
      db.select().from(filingFacts).where(inArray(filingFacts.ticker, tickers))
        .orderBy(asc(filingFacts.ticker), asc(filingFacts.metricKey), desc(filingFacts.periodEnd)),
      fetchNasdaqQuotes(tickers),
    ]);
    const currentFacts = await refreshStaleFacts(tickers, storedFacts as Array<ComparableFilingFact & { ticker: string }>);
    const rows = tickers.map((ticker) => {
      const company = universeByTicker.get(ticker)!;
      const quote = quotes.get(ticker);
      const storedTickerFacts = storedFacts.filter((fact) => fact.ticker === ticker) as ComparableFilingFact[];
      const rowFacts = currentFacts.get(ticker) ?? storedTickerFacts;
      return {
        ticker,
        name: company.name,
        sector: company.sector,
        exchange: company.exchange,
        memberships: company.memberships,
        archetype: comparableArchetype(company.sector).name,
        quoteAsOf: quote?.asOf ?? null,
        quoteSourceUrl: quote?.sourceUrl ?? null,
        factsSource: currentFacts.has(ticker) ? "Current SEC Company Facts" : "Scheduled SEC filing store",
        ...summarizeComparableMetrics(
          rowFacts,
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
