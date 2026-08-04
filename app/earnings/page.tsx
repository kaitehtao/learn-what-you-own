"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";
import { Header } from "../ui";

type CommunityAggregate = {
  participantCount: number;
  epsWhisper: number | null;
  revenueWhisperMillions: number | null;
  epsDispersion: number | null;
  medianConfidence: number | null;
  bullCount: number;
  baseCount: number;
  bearCount: number;
};

type EarningsEvent = {
  ticker: string;
  company: string;
  session: "BMO" | "AMC" | "TNS";
  sessionLabel: string;
  marketCap: string;
  fiscalQuarter: string;
  epsEstimate: string;
  analystCount: string;
  epsActual: string;
  verificationStatus: "company-confirmed" | "provider-estimate";
  officialSourceUrl: string | null;
  officialSourceLabel: string | null;
  announcedTime: string | null;
  verifiedAt: string | null;
  community: CommunityAggregate;
  estimateHistory: {
    earliestStreetEps: number | null;
    latestStreetEps: number | null;
    epsRevisionAbsolute: number | null;
    epsRevisionPercent: number | null;
    snapshotCount: number;
  };
  result: {
    epsActual: number | null;
    epsConsensusAtReport: number | null;
    epsSurprisePercent: number | null;
    whisperSurpriseAbsolute: number | null;
  } | null;
};

type OwnEstimate = {
  epsEstimate: number | null;
  revenueEstimateMillions: number | null;
  thesisCase: "bull" | "base" | "bear";
  confidence: number;
  keyDriver: string;
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

function eps(value: number | null) {
  if (value === null) return "—";
  return `${value < 0 ? "−" : ""}$${Math.abs(value).toFixed(2)}`;
}

function signed(value: number | null, suffix = "") {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}${suffix}`;
}

const emptyDraft = { epsEstimate: "", revenueEstimateMillions: "", thesisCase: "base", confidence: "3", keyDriver: "" };

export default function EarningsCalendar() {
  const [date, setDate] = useState(localDate());
  const [events, setEvents] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<EarningsEvent | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [estimateBusy, setEstimateBusy] = useState(false);
  const [estimateMessage, setEstimateMessage] = useState("");

  const loadEvents = useCallback(async (selectedDate: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/earnings?date=${selectedDate}`);
      const body = await response.json() as { events?: EarningsEvent[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load earnings.");
      setEvents(body.events ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load earnings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`/api/earnings?date=${date}`)
      .then(async (response) => {
        const body = await response.json() as { events?: EarningsEvent[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Unable to load earnings.");
        if (active) setEvents(body.events ?? []);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load earnings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [date]);

  function selectDate(nextDate: string) {
    setLoading(true);
    setError("");
    setSelected(null);
    setEstimateMessage("");
    setDate(nextDate);
  }

  async function openEstimate(event: EarningsEvent) {
    setSelected(event);
    setDraft(emptyDraft);
    setEstimateMessage("");
    try {
      const response = await authenticatedFetch(`/api/earnings/estimates?ticker=${encodeURIComponent(event.ticker)}&date=${encodeURIComponent(date)}`);
      const data = await response.json() as { ownEstimate?: OwnEstimate | null };
      if (data.ownEstimate) setDraft({
        epsEstimate: data.ownEstimate.epsEstimate?.toString() ?? "",
        revenueEstimateMillions: data.ownEstimate.revenueEstimateMillions?.toString() ?? "",
        thesisCase: data.ownEstimate.thesisCase,
        confidence: data.ownEstimate.confidence.toString(),
        keyDriver: data.ownEstimate.keyDriver,
      });
    } catch {
      // The public aggregate remains usable even when a member is signed out.
    }
    window.setTimeout(() => document.getElementById("earnings-estimate-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  async function submitEstimate(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setEstimateBusy(true);
    setEstimateMessage("");
    const response = await authenticatedFetch("/api/earnings/estimates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ticker: selected.ticker,
        reportDate: date,
        fiscalQuarter: selected.fiscalQuarter,
        epsEstimate: draft.epsEstimate === "" ? null : Number(draft.epsEstimate),
        revenueEstimateMillions: draft.revenueEstimateMillions === "" ? null : Number(draft.revenueEstimateMillions),
        thesisCase: draft.thesisCase,
        confidence: Number(draft.confidence),
        keyDriver: draft.keyDriver,
      }),
    });
    const body = await response.json() as { error?: string };
    if (response.status === 401) {
      window.location.href = loginPath(`/earnings?date=${date}`);
      return;
    }
    if (!response.ok) setEstimateMessage(body.error ?? "Unable to save your estimate.");
    else {
      setEstimateMessage("Estimate saved. The class whisper and dispersion have been recalculated.");
      await loadEvents(date);
    }
    setEstimateBusy(false);
  }

  const groups = useMemo(() => ({
    BMO: events.filter((event) => event.session === "BMO"),
    AMC: events.filter((event) => event.session === "AMC"),
    TNS: events.filter((event) => event.session === "TNS"),
  }), [events]);
  const resultCount = events.filter((event) => event.result).length;
  const whisperCount = events.filter((event) => event.community.participantCount > 0).length;
  const confirmedCount = events.filter((event) => event.verificationStatus === "company-confirmed").length;

  return <main><Header />
    <section className="earnings-hero"><div className="container">
      <span className="kicker">EARNINGS INTELLIGENCE</span>
      <h1>Estimate the print.<br />Measure the surprise.</h1>
      <p>Track point-in-time Street expectations, build a community whisper, see revisions and dispersion before the call, then score the actual result without hindsight.</p>
      <div className="earnings-date-control">
        <button onClick={() => selectDate(moveDate(date, -1))}>← Previous</button>
        <label><span>REPORT DATE</span><input type="date" value={date} onChange={(event) => selectDate(event.target.value)} /></label>
        <button onClick={() => selectDate(moveDate(date, 1))}>Next →</button>
        <button className="today" onClick={() => selectDate(localDate())}>Today</button>
      </div>
    </div></section>
    <section className="container earnings-section">
      <div className="earnings-methodology"><div><span>01</span><strong>Street consensus</strong><p>Provider EPS estimate and analyst count, captured daily.</p></div><div><span>02</span><strong>LWYO Whisper</strong><p>Median authenticated-member estimate; contributor identities remain private.</p></div><div><span>03</span><strong>Revision + dispersion</strong><p>Direction of estimate change and disagreement across members.</p></div><div><span>04</span><strong>Actual + surprise</strong><p>Reported EPS compared with both Street and the community whisper.</p></div></div>
      <div className="earnings-summary">
        <div><strong>{events.length}</strong><span>Reports on calendar</span></div>
        <div><strong>{confirmedCount}</strong><span>Company-confirmed dates</span></div>
        <div><strong>{whisperCount}</strong><span>Community-covered</span></div>
        <div><strong>{resultCount}</strong><span>Results captured</span></div>
      </div>
      {loading && <div className="earnings-state">Loading the latest calendar and estimate history…</div>}
      {error && <div className="earnings-state error">{error}</div>}
      {!loading && !error && events.length === 0 && <div className="earnings-state">No expected reports were supplied for this date.</div>}
      {!loading && !error && (["BMO", "AMC", "TNS"] as const).map((session) => groups[session].length > 0 && <section className="earnings-group" key={session}>
        <div className="earnings-group-title"><span className={`session-pill ${session.toLowerCase()}`}>{session}</span><div><h2>{groups[session][0].sessionLabel}</h2><p>{groups[session].length} reports · click “Add estimate” to contribute to the whisper</p></div></div>
        <div className="earnings-research-table">
          <div className="earnings-research-row earnings-labels"><span>Company</span><span>Street EPS</span><span>LWYO Whisper</span><span>Revision</span><span>Actual / surprise</span><span>Market cap</span><span>Research</span></div>
          {groups[session].map((event) => <article className={`earnings-research-row${event.result ? " reported" : ""}`} key={`${event.ticker}-${session}`}>
            <Link className="earnings-company" href={`/company/${event.ticker.toLowerCase().replaceAll(".", "-")}?name=${encodeURIComponent(event.company)}`}><i>{event.ticker}</i><span><strong>{event.company}</strong><small>{event.fiscalQuarter} · {event.analystCount} analysts</small>{event.verificationStatus === "company-confirmed" ? <small className="company-confirmed">✓ Company confirmed</small> : <small className="provider-estimate">Provider date estimate</small>}</span></Link>
            <span className="earnings-metric"><strong>{event.epsEstimate}</strong><small>Street consensus</small></span>
            <span className="earnings-metric"><strong>{eps(event.community.epsWhisper)}</strong><small>{event.community.participantCount ? `${event.community.participantCount} contributors · σ ${event.community.epsDispersion?.toFixed(2) ?? "—"}` : "No member estimates yet"}</small></span>
            <span className={`earnings-metric revision ${event.estimateHistory.epsRevisionAbsolute && event.estimateHistory.epsRevisionAbsolute > 0 ? "positive" : event.estimateHistory.epsRevisionAbsolute && event.estimateHistory.epsRevisionAbsolute < 0 ? "negative" : ""}`}><strong>{event.estimateHistory.snapshotCount > 1 ? signed(event.estimateHistory.epsRevisionPercent, "%") : "Building"}</strong><small>{event.estimateHistory.snapshotCount} daily snapshot{event.estimateHistory.snapshotCount === 1 ? "" : "s"}</small></span>
            <span className={`earnings-metric result ${event.result?.epsSurprisePercent && event.result.epsSurprisePercent > 0 ? "positive" : event.result?.epsSurprisePercent && event.result.epsSurprisePercent < 0 ? "negative" : ""}`}><strong>{event.result ? eps(event.result.epsActual) : "Pending"}</strong><small>{event.result ? `${signed(event.result.epsSurprisePercent, "%")} vs Street${event.result.whisperSurpriseAbsolute !== null ? ` · ${signed(event.result.whisperSurpriseAbsolute)} vs whisper` : ""}` : "Actual locks estimates"}</small></span>
            <span className="earnings-metric"><strong>{event.marketCap}</strong><small>Current provider value</small></span>
            <span className="earnings-action">{event.result ? <Link href={`/company/${event.ticker.toLowerCase()}#earnings-calls`}>Review result →</Link> : <button onClick={() => void openEstimate(event)}>Add estimate →</button>}</span>
          </article>)}
        </div>
      </section>)}
      {selected && !selected.result && <form id="earnings-estimate-form" className="earnings-estimate-form" onSubmit={submitEstimate}>
        <header><div><span className="kicker">COMMUNITY EARNINGS MODEL</span><h2>{selected.ticker} · Submit your estimate</h2><p>Your latest submission replaces your earlier estimate for this report. It becomes immutable when an actual result is captured.</p></div><button type="button" onClick={() => setSelected(null)} aria-label="Close estimate form">×</button></header>
        <div className="earnings-estimate-grid"><label>EPS ESTIMATE · USD<input type="number" step="0.01" value={draft.epsEstimate} onChange={(event) => setDraft({ ...draft, epsEstimate: event.target.value })} placeholder="1.25" /></label><label>REVENUE ESTIMATE · USD MILLIONS<input type="number" min="0" step="0.1" value={draft.revenueEstimateMillions} onChange={(event) => setDraft({ ...draft, revenueEstimateMillions: event.target.value })} placeholder="12450" /></label><label>SCENARIO<select value={draft.thesisCase} onChange={(event) => setDraft({ ...draft, thesisCase: event.target.value })}><option value="bull">Bull case</option><option value="base">Base case</option><option value="bear">Bear case</option></select></label><label>CONFIDENCE · 1–5<select value={draft.confidence} onChange={(event) => setDraft({ ...draft, confidence: event.target.value })}>{[1,2,3,4,5].map((value) => <option key={value}>{value}</option>)}</select></label></div>
        <label>KEY DRIVER<textarea required minLength={12} maxLength={500} value={draft.keyDriver} onChange={(event) => setDraft({ ...draft, keyDriver: event.target.value })} placeholder="State the measurable assumption that makes your estimate differ from consensus." /></label>
        <div className="earnings-estimate-footer"><p>{estimateMessage || "Estimates are research opinions, not recommendations. Revenue is entered in USD millions."}</p><button disabled={estimateBusy}>{estimateBusy ? "Saving…" : "Save estimate →"}</button></div>
      </form>}
      <div className="earnings-data-note"><strong>How to read the data</strong><p>Street estimates and reported EPS currently come from the Nasdaq earnings calendar / Zacks Investment Research feed. Company-confirmed dates override provider dates. LWYO Whisper is the median—not the average—of authenticated member estimates to reduce outlier influence. Daily revision history starts when this platform first observes a report; it is not reconstructed with hindsight. Revenue consensus, guidance surprise, implied move, segment KPIs, and commercial sell-side estimate feeds remain separate future data integrations.</p></div>
      <p className="earnings-source">Dates and estimates can change. Verify material figures against company investor relations and filed results. <a href={`https://finance.yahoo.com/calendar/earnings?day=${date}`} target="_blank" rel="noreferrer">Cross-check Yahoo Finance ↗</a><a href={`https://www.nasdaq.com/market-activity/earnings?date=${date}`} target="_blank" rel="noreferrer">View Nasdaq source ↗</a></p>
    </section>
  </main>;
}
