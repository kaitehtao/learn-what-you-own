"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { companySlug } from "../data/universe";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type EarningsDate = {
  date: string | null;
  daysUntil: number | null;
  session: "BMO" | "AMC" | "TNS";
  sessionLabel: string;
  verificationStatus: "company-confirmed" | "provider-estimate" | "date-unavailable";
  sourceUrl: string;
  sourceLabel: string;
  checkedAt: string;
};

type WatchItem = { id: number; ticker: string; name: string; sector: string; memberships: string[]; earnings: EarningsDate | null };

function earningsDateLabel(value: string | null) {
  if (!value) return "Not announced";
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00Z`));
}

function earningsDateShortLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00Z`));
}

function alertLabel(earnings: EarningsDate | null) {
  if (!earnings?.date || earnings.daysUntil === null) return "We’ll keep checking";
  if (earnings.daysUntil === 0) return "Reports today";
  if (earnings.daysUntil === 1) return "Reports tomorrow";
  if (earnings.daysUntil <= 7 && earnings.daysUntil > 1) return `Alert window · ${earnings.daysUntil} days`;
  return "7-day alert scheduled";
}

export function WatchlistClient() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authenticatedFetch("/api/watchlist", { cache: "no-store" });
      const data = await response.json() as { items?: WatchItem[]; error?: string };
      if (response.status === 401) return void (window.location.href = loginPath("/watchlist"));
      if (!response.ok) throw new Error(data.error ?? "Unable to load your watchlist.");
      setItems(data.items ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load your watchlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    authenticatedFetch("/api/watchlist", { cache: "no-store" }).then(async (response) => {
      const data = await response.json() as { items?: WatchItem[]; error?: string };
      if (!active) return;
      if (response.status === 401) return void (window.location.href = loginPath("/watchlist"));
      if (!response.ok) throw new Error(data.error ?? "Unable to load your watchlist.");
      setItems(data.items ?? []);
    }).catch((caught) => {
      if (active) setError(caught instanceof Error ? caught.message : "Unable to load your watchlist.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await authenticatedFetch("/api/watchlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticker }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) return setError(data.error ?? "Unable to add that company.");
    setTicker("");
    await load();
  }

  async function remove(itemTicker: string) {
    await authenticatedFetch("/api/watchlist", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticker: itemTicker }) });
    await load();
  }

  const upcoming = items.filter((item) => item.earnings?.date && (item.earnings.daysUntil ?? -1) >= 0).sort((a, b) => (a.earnings?.date ?? "").localeCompare(b.earnings?.date ?? ""));
  const alertWindow = upcoming.filter((item) => (item.earnings?.daysUntil ?? 8) <= 7);

  return <section className="container watchlist-section member-data-section">
    <form className="member-add-bar" onSubmit={add}><div><strong>Add a company</strong><span>Enter any ticker in the research universe.</span></div><input value={ticker} onChange={(event) => setTicker(event.target.value.toUpperCase())} placeholder="e.g. NVDA" aria-label="Ticker symbol"/><button>Add to watchlist</button></form>
    {loading ? <div className="member-loading">Loading your watchlist…</div> : error ? <div className="member-load-error" role="alert"><span>!</span><div><h2>We couldn’t load your watchlist.</h2><p>{error}</p></div><button type="button" onClick={() => void load()}>Try again</button></div> : items.length === 0 ? <div className="empty-watchlist"><span>LW</span><h2>Your research watchlist is empty.</h2><p>Add a ticker above or open a company dossier and select “Add to watchlist.”</p></div> :
      <><div className="watchlist-summary"><div><small>WATCHED COMPANIES</small><strong>{items.length}</strong></div><div><small>NEXT EARNINGS</small><strong>{upcoming[0]?.earnings?.date ? earningsDateShortLabel(upcoming[0].earnings.date) : "Checking"}</strong></div><div><small>IN 7-DAY WINDOW</small><strong className={alertWindow.length ? "amber-text" : ""}>{alertWindow.length}</strong></div><div><small>ADVANCE NOTICE</small><strong>7 days</strong></div></div>
      <div className="earnings-alert-explainer"><span>◷</span><div><strong>Earnings-date alerts are on for your watchlist.</strong><p>You’ll receive an in-app warning when a company is seven days from its expected report. If email delivery is enabled in <Link href="/notifications">notification settings</Link>, the warning is also emailed. Estimated dates can move, so company-confirmed dates are labeled separately.</p></div></div>
      <div className="member-list">{items.map((item) => <div className="member-company-row watchlist-earnings-row" key={item.ticker}><Link href={`/company/${companySlug(item.ticker)}`}><i>{item.ticker}</i><span><strong>{item.name}</strong><small>{item.sector}</small></span></Link><div className={`watchlist-earnings-date ${(item.earnings?.daysUntil ?? 8) <= 7 ? "due" : ""}`}><small>NEXT EARNINGS</small><strong>{earningsDateLabel(item.earnings?.date ?? null)}</strong><span>{item.earnings?.date ? item.earnings.sessionLabel : "No date supplied by the calendar provider"}</span><em>{alertLabel(item.earnings)}</em>{item.earnings?.sourceUrl && <a href={item.earnings.sourceUrl} target="_blank" rel="noreferrer">{item.earnings.verificationStatus === "company-confirmed" ? "✓ Company confirmed" : "Provider estimate"} ↗</a>}</div><div className="member-tags">{item.memberships.map((membership) => <em key={membership}>{membership}</em>)}</div><button onClick={() => remove(item.ticker)}>Remove</button></div>)}</div></>}
  </section>;
}
