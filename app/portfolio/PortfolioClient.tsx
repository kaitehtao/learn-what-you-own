"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { companySlug } from "../data/universe";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Position = {
  id: number;
  ticker: string;
  companyName: string;
  accountLabel: string;
  shares: number | null;
  averageCost: number | null;
  currentPrice: number | null;
  marketValue: number | null;
  costBasis: number | null;
  gainLoss: number | null;
  gainLossPercent: number | null;
  notes: string;
  quote: { asOf: string; marketStatus: string; isRealTime: boolean; sourceLabel: string; sourceUrl: string } | null;
};

type PositionForm = { ticker: string; shares: string; averageCost: string; accountLabel: string; notes: string };

const emptyForm: PositionForm = { ticker: "", shares: "", averageCost: "", accountLabel: "Primary portfolio", notes: "" };

function currency(value: number | null, digits = 2) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

function number(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);
}

function signedCurrency(value: number | null) {
  if (value == null) return "—";
  return `${value > 0 ? "+" : ""}${currency(value)}`;
}

function signedPercent(value: number | null) {
  if (value == null) return "";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function PortfolioClient() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PositionForm>(emptyForm);

  const load = useCallback(async () => {
    const response = await authenticatedFetch("/api/portfolio", { cache: "no-store" });
    const data = await response.json() as { positions?: Position[]; error?: string };
    if (response.ok) setPositions(data.positions ?? []); else setError(data.error ?? "Unable to load portfolio.");
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    authenticatedFetch("/api/portfolio", { cache: "no-store" }).then(async (response) => {
      const data = await response.json() as { positions?: Position[]; error?: string };
      if (!active) return;
      if (response.ok) setPositions(data.positions ?? []);
      else if (response.status === 401) window.location.href = loginPath("/portfolio");
      else setError(data.error ?? "Unable to load portfolio.");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => {
    const marketValue = positions.reduce((sum, position) => sum + (position.marketValue ?? 0), 0);
    const costBasis = positions.reduce((sum, position) => sum + (position.costBasis ?? 0), 0);
    const valuedPositions = positions.filter((position) => position.marketValue != null).length;
    const costedPositions = positions.filter((position) => position.costBasis != null).length;
    const matched = positions.filter((position) => position.marketValue != null && position.costBasis != null);
    const matchedValue = matched.reduce((sum, position) => sum + position.marketValue!, 0);
    const matchedCost = matched.reduce((sum, position) => sum + position.costBasis!, 0);
    const gainLoss = matched.length ? matchedValue - matchedCost : null;
    const gainLossPercent = gainLoss != null && matchedCost > 0 ? gainLoss / matchedCost * 100 : null;
    return { marketValue, costBasis, gainLoss, gainLossPercent, valuedPositions, costedPositions, matchedPositions: matched.length };
  }, [positions]);

  function clearForm() {
    setEditingId(null);
    setForm((current) => ({ ...emptyForm, accountLabel: current.accountLabel || emptyForm.accountLabel }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(""); setSaving(true);
    const response = await authenticatedFetch("/api/portfolio", {
      method: editingId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
    });
    const data = await response.json() as { error?: string };
    setSaving(false);
    if (!response.ok) return setError(data.error ?? "Unable to save that holding.");
    clearForm();
    await load();
  }

  function edit(position: Position) {
    setEditingId(position.id);
    setForm({ ticker: position.ticker, shares: position.shares?.toString() ?? "", averageCost: position.averageCost?.toString() ?? "", accountLabel: position.accountLabel, notes: position.notes });
    window.scrollTo({ top: 340, behavior: "smooth" });
  }

  async function remove(id: number) {
    await authenticatedFetch("/api/portfolio", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (editingId === id) clearForm();
    await load();
  }

  return <section className="container portfolio-workspace">
    <div className="portfolio-summary" aria-label="Portfolio status">
      <div><small>ESTIMATED VALUE</small><strong>{totals.valuedPositions ? currency(totals.marketValue, 0) : "—"}</strong><span>{totals.valuedPositions} of {positions.length} positions priced</span></div>
      <div><small>TOTAL COST BASIS</small><strong>{totals.costedPositions ? currency(totals.costBasis, 0) : "—"}</strong><span>Shares × average purchase price</span></div>
      <div className={totals.gainLoss != null && totals.gainLoss < 0 ? "negative" : "positive"}><small>UNREALIZED GAIN / LOSS</small><strong>{signedCurrency(totals.gainLoss)}</strong><span>{signedPercent(totals.gainLossPercent) || "Add cost basis to calculate"}{totals.matchedPositions ? ` · ${totals.matchedPositions} matched` : ""}</span></div>
      <div><small>POSITIONS</small><strong>{positions.length}</strong><span>Private to your account</span></div>
    </div>

    <div className="portfolio-layout">
      <form className="portfolio-form" onSubmit={submit}>
        <div className="form-heading"><span>{editingId ? "Edit holding" : "Add a holding"}</span><em>Private account data</em></div>
        <p className="portfolio-form-intro">Enter the number of shares and your average purchase price. We’ll match the holding with the latest available market quote.</p>
        <div className="form-grid"><label>TICKER<input required disabled={Boolean(editingId)} value={form.ticker} onChange={(event) => setForm({ ...form, ticker: event.target.value.toUpperCase() })} placeholder="AAPL"/></label><label>SHARES OR UNITS<input required value={form.shares} onChange={(event) => setForm({ ...form, shares: event.target.value })} min="0" step="any" type="number" placeholder="100"/></label></div>
        <label>AVERAGE PURCHASE PRICE PER SHARE<input required value={form.averageCost} onChange={(event) => setForm({ ...form, averageCost: event.target.value })} min="0" step="0.01" type="number" placeholder="185.50"/></label>
        {form.shares && form.averageCost && <div className="cost-preview"><span>ESTIMATED COST BASIS</span><strong>{currency(Number(form.shares) * Number(form.averageCost))}</strong></div>}
        <label>PORTFOLIO OR ACCOUNT LABEL<input value={form.accountLabel} onChange={(event) => setForm({ ...form, accountLabel: event.target.value })} placeholder="Primary portfolio"/></label>
        <label>PRIVATE NOTES<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Why do you own it, and what would change your view?"/></label>
        {error && <p className="form-error">{error}</p>}
        <div className="portfolio-form-actions"><button className="submit-contribution" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes →" : "Add holding →"}</button>{editingId && <button type="button" onClick={clearForm}>Cancel</button>}</div>
        <p className="brokerage-note">Quotes may be delayed. Direct brokerage connections remain deferred until a licensed integration and explicit security review are in place.</p>
      </form>

      <article className="portfolio-list">
        <div className="portfolio-heading"><div><span className="kicker">CURRENT HOLDINGS</span><strong>{positions.length} positions</strong></div><span>Values shown in USD</span></div>
        {loading ? <div className="member-loading">Loading holdings and current prices…</div> : positions.length === 0 ? <div className="portfolio-empty"><h2>No holdings added yet.</h2><p>Add a ticker, share count, and purchase price to see your estimated portfolio value and connect each position to its ownership dossier.</p></div> : <div className="portfolio-table">
          <div className="portfolio-table-head"><span>Company</span><span>Shares</span><span>Avg. cost</span><span>Current price</span><span>Market value</span><span>Gain / loss</span><span>Actions</span></div>
          {positions.map((position) => <div className="position-row" key={position.id}>
            <div className="position-company"><Link href={`/company/${companySlug(position.ticker)}`}><i>{position.ticker}</i><span><strong>{position.companyName}</strong><small>{position.accountLabel}</small></span></Link>{position.notes && <p>{position.notes}</p>}</div>
            <div data-label="Shares"><strong>{number(position.shares)}</strong></div>
            <div data-label="Avg. cost"><strong>{currency(position.averageCost)}</strong></div>
            <div data-label="Current price"><strong>{currency(position.currentPrice)}</strong><small>{position.quote?.asOf ?? "Quote unavailable"}</small></div>
            <div data-label="Market value"><strong>{currency(position.marketValue)}</strong><small>{position.currentPrice == null ? "Awaiting quote" : "Shares × current price"}</small></div>
            <div className={position.gainLoss != null && position.gainLoss < 0 ? "position-return negative" : "position-return positive"} data-label="Gain / loss"><strong>{signedCurrency(position.gainLoss)}</strong><small>{signedPercent(position.gainLossPercent)}</small></div>
            <div className="position-actions"><button onClick={() => edit(position)}>Edit</button><button onClick={() => remove(position.id)}>Remove</button></div>
          </div>)}
        </div>}
        <div className="portfolio-quote-note"><span>Prices are the latest available Nasdaq market-activity quote and may be delayed.</span><a href="https://www.nasdaq.com/market-activity/stocks" target="_blank" rel="noreferrer">Market-data source ↗</a></div>
      </article>
    </div>
  </section>;
}
