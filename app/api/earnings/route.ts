import { officialEarningsVerifications } from "../../data/earningsVerifications";
import { loadEarningsIntelligence, parseFinancialNumber, recordProviderEarnings } from "../../earnings-intelligence";
import { formatMarketCap } from "../../market-snapshot";

type NasdaqRow = {
  time?: string;
  symbol?: string;
  name?: string;
  marketCap?: string;
  fiscalQuarterEnding?: string;
  epsForecast?: string;
  noOfEsts?: string;
  eps?: string;
  surprise?: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00Z`))) {
    return Response.json({ error: "Use a valid date in YYYY-MM-DD format." }, { status: 400 });
  }

  const response = await fetch(
    `https://api.nasdaq.com/api/calendar/earnings?date=${encodeURIComponent(date)}`,
    {
      headers: {
        accept: "application/json",
        "user-agent": "Learn What You Own earnings calendar",
      },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    return Response.json(
      { error: "The earnings calendar provider is temporarily unavailable." },
      { status: 502 },
    );
  }

  const payload = await response.json() as {
    data?: { asOf?: string; rows?: NasdaqRow[] | null };
  };

  const providerSourceUrl = `https://www.nasdaq.com/market-activity/earnings?date=${encodeURIComponent(date)}`;
  const providerEvents = (payload.data?.rows ?? []).map((row) => {
    const ticker = row.symbol ?? "";
    const providerSession =
      row.time === "time-pre-market"
        ? "BMO"
        : row.time === "time-after-hours"
          ? "AMC"
          : "TNS";
    const verification = officialEarningsVerifications.get(`${date}:${ticker}`);
    const session = verification?.session ?? providerSession;
    return {
    ticker,
    company: row.name ?? "",
    session,
    sessionLabel:
      session === "BMO"
        ? "Before market open"
        : session === "AMC"
          ? "After market close"
          : "Time not supplied",
    marketCap: formatMarketCap(parseFinancialNumber(row.marketCap)),
    fiscalQuarter: row.fiscalQuarterEnding ?? "—",
    epsEstimate: row.epsForecast ?? "—",
    analystCount: row.noOfEsts ?? "—",
    epsActual: row.eps ?? "—",
    epsProviderSurprise: row.surprise ?? "—",
    verificationStatus: verification ? "company-confirmed" : "provider-estimate",
    officialSourceUrl: verification?.sourceUrl ?? null,
    officialSourceLabel: verification?.sourceLabel ?? null,
    announcedTime: verification?.announcedTime ?? null,
    verifiedAt: verification?.verifiedAt ?? null,
  }}).filter((event) => event.ticker);

  let intelligence: Awaited<ReturnType<typeof loadEarningsIntelligence>> = new Map();
  try {
    await recordProviderEarnings(providerEvents.map((event) => ({
      ticker: event.ticker,
      reportDate: date,
      fiscalQuarter: event.fiscalQuarter,
      epsEstimate: parseFinancialNumber(event.epsEstimate),
      analystCount: parseFinancialNumber(event.analystCount),
      epsActual: parseFinancialNumber(event.epsActual),
      epsSurprisePercent: parseFinancialNumber(event.epsProviderSurprise),
    })), "Nasdaq earnings calendar / Zacks Investment Research", providerSourceUrl);
    intelligence = await loadEarningsIntelligence(date, providerEvents.map((event) => event.ticker));
  } catch (error) {
    console.error("Unable to persist or load earnings intelligence", error);
  }

  const events = providerEvents.map((event) => {
    const detail = intelligence.get(event.ticker);
    return {
      ...event,
      community: detail?.community ?? {
        participantCount: 0,
        epsWhisper: null,
        revenueWhisperMillions: null,
        epsDispersion: null,
        medianConfidence: null,
        bullCount: 0,
        baseCount: 0,
        bearCount: 0,
      },
      estimateHistory: {
        earliestStreetEps: detail?.earliestStreetEps ?? null,
        latestStreetEps: detail?.latestStreetEps ?? parseFinancialNumber(event.epsEstimate),
        epsRevisionAbsolute: detail?.epsRevisionAbsolute ?? null,
        epsRevisionPercent: detail?.epsRevisionPercent ?? null,
        snapshotCount: detail?.snapshotCount ?? 0,
      },
      result: detail?.result ?? (parseFinancialNumber(event.epsActual) !== null ? {
        epsActual: parseFinancialNumber(event.epsActual),
        epsConsensusAtReport: parseFinancialNumber(event.epsEstimate),
        epsSurprisePercent: parseFinancialNumber(event.epsProviderSurprise),
        whisperSurpriseAbsolute: null,
      } : null),
    };
  });

  return Response.json({
    date,
    asOf: payload.data?.asOf ?? date,
    events,
    source: "Nasdaq earnings calendar / Zacks Investment Research",
    methodology: "Street consensus and reported EPS are provider data. LWYO Whisper is the median of authenticated member estimates. Estimate snapshots begin when Learn What You Own observes an event and are never backfilled as if they were point-in-time observations.",
  });
}
