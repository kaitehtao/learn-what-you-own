type NasdaqRow = {
  time?: string;
  symbol?: string;
  name?: string;
  marketCap?: string;
  fiscalQuarterEnding?: string;
  epsForecast?: string;
  noOfEsts?: string;
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

  const events = (payload.data?.rows ?? []).map((row) => {
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
    marketCap: row.marketCap ?? "—",
    fiscalQuarter: row.fiscalQuarterEnding ?? "—",
    epsEstimate: row.epsForecast ?? "—",
    analystCount: row.noOfEsts ?? "—",
    verificationStatus: verification ? "company-confirmed" : "provider-estimate",
    officialSourceUrl: verification?.sourceUrl ?? null,
    officialSourceLabel: verification?.sourceLabel ?? null,
    announcedTime: verification?.announcedTime ?? null,
    verifiedAt: verification?.verifiedAt ?? null,
  }}).filter((event) => event.ticker);

  return Response.json({
    date,
    asOf: payload.data?.asOf ?? date,
    events,
    source: "Nasdaq earnings calendar / Zacks Investment Research",
  });
}
import { officialEarningsVerifications } from "../../data/earningsVerifications";
