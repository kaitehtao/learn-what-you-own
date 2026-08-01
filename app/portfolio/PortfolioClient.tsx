"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { companySlug } from "../data/universe";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Position = { id: number; ticker: string; companyName: string; accountLabel: string; shares: number | null; notes: string };

export function PortfolioClient() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ticker: "", shares: "", accountLabel: "Primary portfolio", notes: "" });

  const load = useCallback(async () => {
    const response = await authenticatedFetch("/api/portfolio");
    const data = await response.json() as { positions?: Position[]; error?: string };
    if (response.ok) setPositions(data.positions ?? []); else setError(data.error ?? "Unable to load portfolio.");
    setLoading(false);
  }, []);
  useEffect(() => {
    let active = true;
    authenticatedFetch("/api/portfolio").then(async (response) => {
      const data = await response.json() as { positions?: Position[]; error?: string };
      if (!active) return;
      if (response.ok) setPositions(data.positions ?? []); else if (response.status === 401) window.location.href = loginPath("/portfolio"); else setError(data.error ?? "Unable to load portfolio.");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await authenticatedFetch("/api/portfolio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json() as { error?: string };
    if (!response.ok) return setError(data.error ?? "Unable to add holding.");
    setForm({ ticker: "", shares: "", accountLabel: form.accountLabel, notes: "" });
    await load();
  }
  async function remove(id: number) {
    await authenticatedFetch("/api/portfolio", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
  }

  return <section className="container portfolio-layout">
    <form className="portfolio-form" onSubmit={submit}><div className="form-heading"><span>Add a holding</span><em>Private account data</em></div><div className="form-grid"><label>TICKER<input required value={form.ticker} onChange={(e) => setForm({...form,ticker:e.target.value.toUpperCase()})} placeholder="AAPL"/></label><label>SHARES OR UNITS<input value={form.shares} onChange={(e) => setForm({...form,shares:e.target.value})} min="0" step="any" type="number" placeholder="Optional"/></label></div><label>PORTFOLIO OR ACCOUNT LABEL<input value={form.accountLabel} onChange={(e) => setForm({...form,accountLabel:e.target.value})} placeholder="Primary portfolio"/></label><label>PRIVATE NOTES<textarea value={form.notes} onChange={(e) => setForm({...form,notes:e.target.value})} placeholder="What do you need to understand about this position?"/></label>{error&&<p className="form-error">{error}</p>}<button className="submit-contribution">Add holding →</button><p className="brokerage-note">Direct brokerage connections are intentionally deferred until a licensed integration and explicit security review are in place.</p></form>
    <article className="portfolio-list"><div className="portfolio-heading"><span className="kicker">CURRENT HOLDINGS</span><strong>{positions.length} positions</strong></div>{loading?<div className="member-loading">Loading your portfolio…</div>:positions.length===0?<div className="portfolio-empty"><h2>No holdings added yet.</h2><p>Add a ticker to connect its dossier, filings, risks, and thesis changes with your portfolio.</p></div>:positions.map((position)=><div className="position-row" key={position.id}><Link href={`/company/${companySlug(position.ticker)}`}><i>{position.ticker}</i><span><strong>{position.companyName}</strong><small>{position.accountLabel}{position.shares != null?` · ${position.shares} shares`:""}</small>{position.notes&&<p>{position.notes}</p>}</span></Link><button onClick={()=>remove(position.id)}>Remove</button></div>)}</article>
  </section>;
}
