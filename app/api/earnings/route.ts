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

  const events = (payload.data?.rows ?? []).map((row) => ({
    ticker: row.symbol ?? "",
    company: row.name ?? "",
    session:
      row.time === "time-pre-market"
        ? "BMO"
        : row.time === "time-after-hours"
          ? "AMC"
          : "TNS",
    sessionLabel:
      row.time === "time-pre-market"
        ? "Before market open"
        : row.time === "time-after-hours"
          ? "After market close"
          : "Time not supplied",
    marketCap: row.marketCap ?? "—",
    fiscalQuarter: row.fiscalQuarterEnding ?? "—",
    epsEstimate: row.epsForecast ?? "—",
    analystCount: row.noOfEsts ?? "—",
  })).filter((event) => event.ticker);

  return Response.json({
    date,
    asOf: payload.data?.asOf ?? date,
    events,
    source: "Nasdaq earnings calendar / Zacks Investment Research",
  });
}
