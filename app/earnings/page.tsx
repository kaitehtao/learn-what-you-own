"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../ui";

type EarningsEvent = {
  ticker: string;
  company: string;
  session: "BMO" | "AMC" | "TNS";
  sessionLabel: string;
  marketCap: string;
  fiscalQuarter: string;
  epsEstimate: string;
  analystCount: string;
  verificationStatus: "company-confirmed" | "provider-estimate";
  officialSourceUrl: string | null;
  officialSourceLabel: string | null;
  announcedTime: string | null;
  verifiedAt: string | null;
};

function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-CA");
}

function moveDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA");
}

export default function EarningsCalendar() {
  const [date, setDate] = useState(localDate());
  const [events, setEvents] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function selectDate(nextDate: string) {
    setLoading(true);
    setError("");
    setDate(nextDate);
  }

  useEffect(() => {
    let active = true;
    fetch(`/api/earnings?date=${date}`)
      .then(async (response) => {
        const body = await response.json() as { events?: EarningsEvent[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Unable to load earnings.");
        if (active) setEvents(body.events ?? []);
      })
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [date]);

  const groups = useMemo(() => ({
    BMO: events.filter((event) => event.session === "BMO"),
    AMC: events.filter((event) => event.session === "AMC"),
    TNS: events.filter((event) => event.session === "TNS"),
  }), [events]);

  return <main><Header />
    <section className="earnings-hero"><div className="container">
      <span className="kicker">UPCOMING EARNINGS</span>
      <h1>Know when the market<br />gets new evidence.</h1>
      <p>Expected reporting dates and release sessions, separated into before the open, after the close, and time not supplied.</p>
      <div className="earnings-date-control">
        <button onClick={() => selectDate(moveDate(date, -1))}>← Previous</button>
        <label><span>REPORT DATE</span><input type="date" value={date} onChange={(event) => selectDate(event.target.value)} /></label>
        <button onClick={() => selectDate(moveDate(date, 1))}>Next →</button>
        <button className="today" onClick={() => selectDate(localDate())}>Today</button>
      </div>
    </div></section>
    <section className="container earnings-section">
      <div className="earnings-summary">
        <div><strong>{events.length}</strong><span>Expected reports</span></div>
        <div><strong>{groups.BMO.length}</strong><span>Before market open</span></div>
        <div><strong>{groups.AMC.length}</strong><span>After market close</span></div>
        <div><strong>{groups.TNS.length}</strong><span>Time not supplied</span></div>
      </div>
      {loading && <div className="earnings-state">Loading the latest calendar…</div>}
      {error && <div className="earnings-state error">{error}</div>}
      {!loading && !error && events.length === 0 && <div className="earnings-state">No expected reports were supplied for this date.</div>}
      {!loading && !error && (["BMO", "AMC", "TNS"] as const).map((session) => groups[session].length > 0 && <section className="earnings-group" key={session}>
        <div className="earnings-group-title"><span className={`session-pill ${session.toLowerCase()}`}>{session}</span><div><h2>{groups[session][0].sessionLabel}</h2><p>{groups[session].length} expected reports</p></div></div>
        <div className="earnings-table">
          <div className="earnings-row earnings-labels"><span>Company</span><span>Fiscal quarter</span><span>EPS estimate</span><span>Analysts</span><span>Market cap</span></div>
          {groups[session].map((event) => <Link
            href={`/company/${event.ticker.toLowerCase().replaceAll(".", "-")}?name=${encodeURIComponent(event.company)}`}
            className="earnings-row"
            aria-label={`Open the ${event.ticker} company dossier`}
            key={`${event.ticker}-${session}`}
          >
            <span className="earnings-company"><i>{event.ticker}</i><span><strong>{event.company}</strong>{event.verificationStatus === "company-confirmed" ? <small className="company-confirmed">✓ Company confirmed · {event.announcedTime}</small> : <small className="provider-estimate">Provider estimate · verify with company IR</small>}</span></span>
            <span>{event.fiscalQuarter}</span><span>{event.epsEstimate}</span><span>{event.analystCount}</span><span>{event.marketCap}</span>
          </Link>)}
          {groups[session].some(event => event.officialSourceUrl) && <div className="earnings-verification-sources">{groups[session].filter(event => event.officialSourceUrl).map(event => <a href={event.officialSourceUrl!} target="_blank" rel="noreferrer" key={`${event.ticker}-source`}>{event.ticker}: verify on {event.officialSourceLabel} ↗</a>)}</div>}
        </div>
      </section>)}
      <p className="earnings-source">A green “Company confirmed” label means the date and session were checked against an official investor-relations announcement, which overrides the calendar provider. All other entries remain provider estimates and may change. <a href={`https://finance.yahoo.com/calendar/earnings?day=${date}`} target="_blank" rel="noreferrer">Cross-check on Yahoo Finance ↗</a> <a href={`https://www.nasdaq.com/market-activity/earnings?date=${date}`} target="_blank" rel="noreferrer">View Nasdaq source ↗</a></p>
    </section>
  </main>;
}
