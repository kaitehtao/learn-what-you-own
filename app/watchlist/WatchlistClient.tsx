"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { companySlug } from "../data/universe";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type WatchItem = { id: number; ticker: string; name: string; sector: string; memberships: string[] };

export function WatchlistClient() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await authenticatedFetch("/api/watchlist");
    const data = await response.json() as { items?: WatchItem[]; error?: string };
    if (response.ok) setItems(data.items ?? []);
    else setError(data.error ?? "Unable to load your watchlist.");
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    authenticatedFetch("/api/watchlist").then(async (response) => {
      const data = await response.json() as { items?: WatchItem[]; error?: string };
      if (!active) return;
      if (response.ok) setItems(data.items ?? []);
      else if (response.status === 401) window.location.href = loginPath("/watchlist");
      else setError(data.error ?? "Unable to load your watchlist.");
      setLoading(false);
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

  return <section className="container watchlist-section member-data-section">
    <form className="member-add-bar" onSubmit={add}><div><strong>Add a company</strong><span>Enter any ticker in the research universe.</span></div><input value={ticker} onChange={(event) => setTicker(event.target.value.toUpperCase())} placeholder="e.g. NVDA" aria-label="Ticker symbol"/><button>Add to watchlist</button></form>
    {error && <p className="form-error">{error}</p>}
    {loading ? <div className="member-loading">Loading your watchlist…</div> : items.length === 0 ? <div className="empty-watchlist"><span>LW</span><h2>Your research watchlist is empty.</h2><p>Add a ticker above or open a company dossier and select “Add to watchlist.”</p></div> :
      <><div className="watchlist-summary"><div><small>WATCHED COMPANIES</small><strong>{items.length}</strong></div><div><small>PRIVATE TO YOU</small><strong>Yes</strong></div><div><small>RESEARCH UNIVERSE</small><strong>2,993</strong></div><div><small>ALERT STYLE</small><strong>Thesis</strong></div></div>
      <div className="member-list">{items.map((item) => <div className="member-company-row" key={item.ticker}><Link href={`/company/${companySlug(item.ticker)}`}><i>{item.ticker}</i><span><strong>{item.name}</strong><small>{item.sector}</small></span></Link><div className="member-tags">{item.memberships.map((membership) => <em key={membership}>{membership}</em>)}</div><button onClick={() => remove(item.ticker)}>Remove</button></div>)}</div></>}
  </section>;
}
