"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";
import { FactsWorkspace, type ChannelCheck, type FactsAssessment, type ManagementCommitment, type Postmortem } from "./FactsWorkspace";

type Workspace = { id: number; ticker: string; workflow_status: string; recommendation: string; time_horizon: string; conviction: number; consensus_view: string; variant_view: string; current_view: string; next_catalyst: string; next_catalyst_date: string | null; stock_profile: string; target_return_pct: number | null; target_date: string | null; entry_rule: string; hold_rule: string; exit_rule: string; max_position_pct: number | null; liquidity_plan: string; updated_at: string };
type Driver = { id: number; direction: string; rank: number; title: string; hypothesis: string; metric: string; current_reading: string; target_reading: string; epic_effect: boolean; epic_predictability: boolean; epic_independence: boolean; epic_consensus_gap: boolean; importance: number; confidence: number; falsifier: string; next_catalyst: string; source_url: string; evidence_date: string | null; status: string };
type Scenario = { id?: number; scenario: "bull" | "base" | "bear"; probability_pct: number | string; price_target: number | string | null; revenue_growth_pct: number | string | null; margin_pct: number | string | null; exit_multiple: number | string | null; notes: string };
type Journal = { id: number; decision: string; observed_price: number | null; conviction: number; rationale: string; key_risk: string; next_catalyst: string; created_at: string };
type Payload = { company: { ticker: string; name: string; sector: string; exchange: string }; notebook: { id: number; thesis: string }; workspace: Workspace; drivers: Driver[]; scenarios: Scenario[]; journal: Journal[]; facts: FactsAssessment[]; commitments: ManagementCommitment[]; channelChecks: ChannelCheck[]; postmortems: Postmortem[]; error?: string };

const blankDriver = { direction: "bull", rank: 1, title: "", hypothesis: "", metric: "", currentReading: "", targetReading: "", epicEffect: false, epicPredictability: false, epicIndependence: false, epicConsensusGap: false, importance: 3, confidence: 3, falsifier: "", nextCatalyst: "", sourceUrl: "", evidenceDate: "", status: "active" };
const defaultScenarios: Scenario[] = [
  { scenario: "bull", probability_pct: 25, price_target: "", revenue_growth_pct: "", margin_pct: "", exit_multiple: "", notes: "" },
  { scenario: "base", probability_pct: 50, price_target: "", revenue_growth_pct: "", margin_pct: "", exit_multiple: "", notes: "" },
  { scenario: "bear", probability_pct: 25, price_target: "", revenue_growth_pct: "", margin_pct: "", exit_multiple: "", notes: "" },
];

function title(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase()); }
function asNumber(value: string | number | null) { const parsed = Number(value); return value === "" || value == null || !Number.isFinite(parsed) ? null : parsed; }

export function AnalystWorkspaceClient({ initialTicker }: { initialTicker: string }) {
  const [ticker, setTicker] = useState(initialTicker);
  const [tickerInput, setTickerInput] = useState(initialTicker);
  const [data, setData] = useState<Payload | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>(defaultScenarios);
  const [driverDraft, setDriverDraft] = useState(blankDriver);
  const [decisionDraft, setDecisionDraft] = useState({ decision: "research", observedPrice: "", conviction: 3, rationale: "", keyRisk: "", nextCatalyst: "" });
  const [busy, setBusy] = useState(initialTicker ? "Loading private workspace…" : "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticker) return;
    void authenticatedFetch(`/api/analyst-workspace?ticker=${encodeURIComponent(ticker)}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return void (window.location.href = loginPath(`/workspace?ticker=${encodeURIComponent(ticker)}`));
        const payload = await response.json() as Payload;
        if (!response.ok) throw new Error(payload.error ?? "Unable to load the analyst workspace.");
        setData(payload); setWorkspace(payload.workspace);
        setScenarios((["bull","base","bear"] as const).map(scenario => payload.scenarios.find(item => item.scenario === scenario) ?? defaultScenarios.find(item => item.scenario === scenario)!));
        window.history.replaceState(null, "", `/workspace?ticker=${encodeURIComponent(ticker)}`);
        setBusy("");
      })
      .catch((reason) => { setBusy(""); setError(reason instanceof Error ? reason.message : "Unable to load the analyst workspace."); });
  }, [ticker]);

  async function send(body: Record<string, unknown>, success: string) {
    setBusy(success); setError(""); setMessage("");
    const response = await authenticatedFetch("/api/analyst-workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticker, ...body }) });
    if (response.status === 401) return void (window.location.href = loginPath(`/workspace?ticker=${encodeURIComponent(ticker)}`));
    const payload = await response.json() as Payload;
    setBusy("");
    if (!response.ok) { setError(payload.error ?? "The private record could not be saved."); return null; }
    setData(payload); setWorkspace(payload.workspace); setScenarios((["bull","base","bear"] as const).map(scenario => payload.scenarios.find(item => item.scenario === scenario) ?? defaultScenarios.find(item => item.scenario === scenario)!)); setMessage(success);
    return payload;
  }

  function chooseTicker(event: FormEvent) {
    event.preventDefault();
    const next = tickerInput.trim().toUpperCase();
    if (!/^[A-Z0-9.-]{1,12}$/.test(next)) return setError("Enter a valid ticker, such as MSFT or AMC.");
    setData(null); setWorkspace(null); setError(""); setBusy("Loading private workspace…"); setTicker(next);
  }

  async function saveWorkspace() {
    if (!workspace) return;
    await send({ action: "save_workspace", workflowStatus: workspace.workflow_status, recommendation: workspace.recommendation, timeHorizon: workspace.time_horizon, conviction: workspace.conviction, consensusView: workspace.consensus_view, variantView: workspace.variant_view, currentView: workspace.current_view, nextCatalyst: workspace.next_catalyst, nextCatalystDate: workspace.next_catalyst_date }, "Private thesis saved.");
  }

  async function saveDriver(event: FormEvent) {
    event.preventDefault();
    const saved = await send({ action: "save_driver", ...driverDraft }, "Thesis driver saved.");
    if (saved) setDriverDraft(blankDriver);
  }

  async function saveScenarios() {
    await send({ action: "save_scenarios", scenarios: scenarios.map(item => ({ scenario: item.scenario, probabilityPct: asNumber(item.probability_pct), priceTarget: asNumber(item.price_target), revenueGrowthPct: asNumber(item.revenue_growth_pct), marginPct: asNumber(item.margin_pct), exitMultiple: asNumber(item.exit_multiple), notes: item.notes })) }, "Scenario valuation saved.");
  }

  async function addDecision(event: FormEvent) {
    event.preventDefault();
    const saved = await send({ action: "add_decision", ...decisionDraft }, "Decision journal updated.");
    if (saved) setDecisionDraft({ decision: "research", observedPrice: "", conviction: 3, rationale: "", keyRisk: "", nextCatalyst: "" });
  }

  const expectedValue = useMemo(() => scenarios.reduce((sum, scenario) => sum + ((asNumber(scenario.probability_pct) ?? 0) / 100) * (asNumber(scenario.price_target) ?? 0), 0), [scenarios]);
  const probabilityTotal = useMemo(() => scenarios.reduce((sum, scenario) => sum + (asNumber(scenario.probability_pct) ?? 0), 0), [scenarios]);
  const epicCount = (driver: Driver) => [driver.epic_effect, driver.epic_predictability, driver.epic_independence, driver.epic_consensus_gap].filter(Boolean).length;

  return <>
    <section className="analyst-hero"><div className="container"><div><span className="kicker">PRIVATE ANALYST WORKSPACE</span><h1>Research, debate,<br/>decide, remember.</h1><p>Your thesis, scenarios, evidence and decisions are visible only to you. Public dossiers remain a separate, moderated record.</p></div><form onSubmit={chooseTicker}><label htmlFor="workspace-ticker">Open a company workspace</label><div><input id="workspace-ticker" value={tickerInput} onChange={event => setTickerInput(event.target.value)} placeholder="Ticker, e.g. MSFT"/><button>Open →</button></div></form></div></section>
    <section className="container privacy-boundary"><div><span>PUBLIC RESEARCH</span><strong>Shared facts and accountable analysis</strong><p>Dossiers, SEC facts, valuation history, earnings, sourced claims and approved community research.</p></div><i>→</i><div><span>PRIVATE WORKSPACE</span><strong>Your judgment and decision process</strong><p>Variant view, scenarios, evidence grading, conviction, decisions, attachments and postmortems.</p></div><i>→</i><div><span>OPTIONAL PUBLICATION</span><strong>You choose what leaves the workspace</strong><p>Only deliberately submitted research enters moderation. Private records are never published automatically.</p></div></section>
    {!ticker ? <section className="container analyst-empty"><h2>Choose a company to begin</h2><p>Every workspace is organized around one ticker so the thesis and evidence remain auditable.</p></section> : busy === "Loading private workspace…" ? <section className="container analyst-empty"><h2>{busy}</h2></section> : error && !data ? <section className="container analyst-empty error"><h2>Workspace unavailable</h2><p>{error}</p></section> : data && workspace ? <section className="container analyst-shell">
      <header className="analyst-company-head"><div><span>{data.company.ticker}</span><div><small>{data.company.exchange} · {data.company.sector}</small><h2>{data.company.name}</h2></div></div><nav><Link href={`/company/${ticker.toLowerCase()}`}>Public dossier</Link><Link href={`/notebook?ticker=${encodeURIComponent(ticker)}`}>Source notebook</Link><Link href={`/contribute?ticker=${encodeURIComponent(ticker)}`}>Submit public research</Link></nav></header>
      {(message || error) && <p className={error ? "analyst-notice error" : "analyst-notice"}>{error || message}</p>}
      <div className="analyst-grid">
        <section className="analyst-card analyst-thesis-card"><header><div><span className="kicker">01 · VARIANT PERCEPTION</span><h3>Define the investable disagreement</h3></div><button disabled={Boolean(busy)} onClick={() => void saveWorkspace()}>{busy === "Private thesis saved." ? "Saving…" : "Save thesis"}</button></header>
          <div className="analyst-meta-grid"><label>WORKFLOW STATUS<select value={workspace.workflow_status} onChange={event => setWorkspace({ ...workspace, workflow_status: event.target.value })}>{["triage","researching","ready_for_review","owned","rejected","archived"].map(item => <option value={item} key={item}>{title(item)}</option>)}</select></label><label>NET ASSESSMENT<select value={workspace.recommendation} onChange={event => setWorkspace({ ...workspace, recommendation: event.target.value })}>{["unrated","positive","neutral","negative"].map(item => <option value={item} key={item}>{title(item)}</option>)}</select></label><label>TIME HORIZON<select value={workspace.time_horizon} onChange={event => setWorkspace({ ...workspace, time_horizon: event.target.value })}><option value="short">0–12 months</option><option value="medium">1–3 years</option><option value="long">3+ years</option></select></label><label>CONVICTION<select value={workspace.conviction} onChange={event => setWorkspace({ ...workspace, conviction: Number(event.target.value) })}>{[1,2,3,4,5].map(item => <option key={item}>{item}</option>)}</select></label></div>
          <label>CONSENSUS VIEW<textarea value={workspace.consensus_view} onChange={event => setWorkspace({ ...workspace, consensus_view: event.target.value })} placeholder="What does the market appear to believe?"/></label><label>YOUR VARIANT VIEW<textarea value={workspace.variant_view} onChange={event => setWorkspace({ ...workspace, variant_view: event.target.value })} placeholder="Where do you disagree, and what evidence could prove it?"/></label><label>CURRENT INVESTMENT VIEW<textarea value={workspace.current_view} onChange={event => setWorkspace({ ...workspace, current_view: event.target.value })} placeholder="State the conclusion, expected path, and principal risk."/></label><div className="analyst-catalyst-fields"><label>NEXT CATALYST<input value={workspace.next_catalyst} onChange={event => setWorkspace({ ...workspace, next_catalyst: event.target.value })}/></label><label>EXPECTED DATE<input type="date" value={workspace.next_catalyst_date ?? ""} onChange={event => setWorkspace({ ...workspace, next_catalyst_date: event.target.value || null })}/></label></div>
        </section>

        <section className="analyst-card analyst-driver-card"><header><div><span className="kicker">02 · EPIC DRIVER LEDGER</span><h3>Elevate only what can move value</h3></div><span>{data.drivers.length} recorded</span></header>
          <div className="driver-board">{["bull","bear","neutral"].map(direction => <div className={`driver-column ${direction}`} key={direction}><h4>{direction === "bull" ? "Bull evidence" : direction === "bear" ? "Bear evidence" : "Open / neutral"}</h4>{data.drivers.filter(driver => driver.direction === direction).map(driver => <article key={driver.id}><small>#{driver.rank} · EPIC {epicCount(driver)}/4 · confidence {driver.confidence}/5</small><strong>{driver.title}</strong><p>{driver.hypothesis}</p><dl><div><dt>Metric</dt><dd>{driver.metric || "—"}</dd></div><div><dt>Current → target</dt><dd>{driver.current_reading || "—"} → {driver.target_reading || "—"}</dd></div><div><dt>Falsifier</dt><dd>{driver.falsifier || "—"}</dd></div></dl><footer>{driver.source_url && <a href={driver.source_url} target="_blank" rel="noreferrer">Evidence ↗</a>}<button onClick={() => void send({ action: "delete_driver", id: driver.id }, "Driver removed.")}>Remove</button></footer></article>)}{!data.drivers.some(driver => driver.direction === direction) && <p>No {direction} drivers recorded.</p>}</div>)}</div>
          <form className="driver-form" onSubmit={saveDriver}><h4>Add a thesis driver</h4><div className="driver-form-grid"><label>DIRECTION<select value={driverDraft.direction} onChange={event => setDriverDraft({ ...driverDraft, direction: event.target.value })}><option value="bull">Bull</option><option value="bear">Bear</option><option value="neutral">Neutral</option></select></label><label>RANK<input type="number" min="1" max="10" value={driverDraft.rank} onChange={event => setDriverDraft({ ...driverDraft, rank: Number(event.target.value) })}/></label><label>IMPORTANCE<select value={driverDraft.importance} onChange={event => setDriverDraft({ ...driverDraft, importance: Number(event.target.value) })}>{[1,2,3,4,5].map(item => <option key={item}>{item}</option>)}</select></label><label>CONFIDENCE<select value={driverDraft.confidence} onChange={event => setDriverDraft({ ...driverDraft, confidence: Number(event.target.value) })}>{[1,2,3,4,5].map(item => <option key={item}>{item}</option>)}</select></label></div><label>DRIVER TITLE<input required value={driverDraft.title} onChange={event => setDriverDraft({ ...driverDraft, title: event.target.value })} placeholder="A measurable factor that can change intrinsic value"/></label><label>HYPOTHESIS<textarea value={driverDraft.hypothesis} onChange={event => setDriverDraft({ ...driverDraft, hypothesis: event.target.value })}/></label><div className="driver-form-grid"><label>METRIC<input value={driverDraft.metric} onChange={event => setDriverDraft({ ...driverDraft, metric: event.target.value })}/></label><label>CURRENT READING<input value={driverDraft.currentReading} onChange={event => setDriverDraft({ ...driverDraft, currentReading: event.target.value })}/></label><label>TARGET / THRESHOLD<input value={driverDraft.targetReading} onChange={event => setDriverDraft({ ...driverDraft, targetReading: event.target.value })}/></label><label>EVIDENCE DATE<input type="date" value={driverDraft.evidenceDate} onChange={event => setDriverDraft({ ...driverDraft, evidenceDate: event.target.value })}/></label></div><label>WHAT WOULD FALSIFY IT?<textarea value={driverDraft.falsifier} onChange={event => setDriverDraft({ ...driverDraft, falsifier: event.target.value })}/></label><label>EVIDENCE URL<input type="url" value={driverDraft.sourceUrl} onChange={event => setDriverDraft({ ...driverDraft, sourceUrl: event.target.value })} placeholder="https://…"/></label><fieldset><legend>EPIC TEST</legend>{[["epicEffect","Effect"],["epicPredictability","Predictability"],["epicIndependence","Independence"],["epicConsensusGap","Consensus gap"]].map(([key,label]) => <label key={key}><input type="checkbox" checked={Boolean(driverDraft[key as keyof typeof driverDraft])} onChange={event => setDriverDraft({ ...driverDraft, [key]: event.target.checked })}/>{label}</label>)}</fieldset><button disabled={Boolean(busy)}>Add private driver</button></form>
        </section>

        <section className="analyst-card analyst-scenario-card"><header><div><span className="kicker">03 · SCENARIO VALUATION</span><h3>Make uncertainty explicit</h3></div><div><small>PROBABILITY-WEIGHTED TARGET</small><strong>{expectedValue > 0 ? `$${expectedValue.toFixed(2)}` : "—"}</strong><span className={Math.abs(probabilityTotal - 100) < .01 ? "valid" : "invalid"}>{probabilityTotal.toFixed(0)}% total</span></div></header><div className="scenario-table"><div className="scenario-head"><span>Case</span><span>Probability</span><span>Price target</span><span>Revenue growth</span><span>Margin</span><span>Exit multiple</span><span>Key assumptions</span></div>{scenarios.map((scenario, index) => <div className={`scenario-row ${scenario.scenario}`} key={scenario.scenario}><strong>{title(scenario.scenario)}</strong>{(["probability_pct","price_target","revenue_growth_pct","margin_pct","exit_multiple"] as const).map(field => <label key={field}><span>{title(field)}</span><input type="number" step="0.1" min={field === "probability_pct" ? 0 : undefined} max={field === "probability_pct" ? 100 : undefined} value={scenario[field] ?? ""} onChange={event => setScenarios(scenarios.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: event.target.value } : item))}/></label>)}<label><span>Key assumptions</span><textarea value={scenario.notes} onChange={event => setScenarios(scenarios.map((item, itemIndex) => itemIndex === index ? { ...item, notes: event.target.value } : item))}/></label></div>)}</div><button disabled={Boolean(busy)} onClick={() => void saveScenarios()}>Save private scenarios</button><p className="scenario-caveat">Targets are your research assumptions—not public recommendations. Historical multiples above provide context; they do not determine fair value automatically.</p></section>

        <section className="analyst-card analyst-journal-card"><header><div><span className="kicker">04 · DECISION JOURNAL</span><h3>Preserve what you knew and believed</h3></div><span>Immutable timestamped entries</span></header><div className="journal-layout"><form onSubmit={addDecision}><div className="journal-form-grid"><label>DECISION<select value={decisionDraft.decision} onChange={event => setDecisionDraft({ ...decisionDraft, decision: event.target.value })}>{["watch","research","add","hold","reduce","exit","reject"].map(item => <option key={item}>{title(item)}</option>)}</select></label><label>OBSERVED PRICE<input type="number" step="0.01" min="0" value={decisionDraft.observedPrice} onChange={event => setDecisionDraft({ ...decisionDraft, observedPrice: event.target.value })}/></label><label>CONVICTION<select value={decisionDraft.conviction} onChange={event => setDecisionDraft({ ...decisionDraft, conviction: Number(event.target.value) })}>{[1,2,3,4,5].map(item => <option key={item}>{item}</option>)}</select></label></div><label>RATIONALE<textarea required minLength={12} value={decisionDraft.rationale} onChange={event => setDecisionDraft({ ...decisionDraft, rationale: event.target.value })} placeholder="Why is this the appropriate decision based on the evidence available today?"/></label><label>KEY RISK<textarea value={decisionDraft.keyRisk} onChange={event => setDecisionDraft({ ...decisionDraft, keyRisk: event.target.value })}/></label><label>NEXT CATALYST<textarea value={decisionDraft.nextCatalyst} onChange={event => setDecisionDraft({ ...decisionDraft, nextCatalyst: event.target.value })}/></label><button disabled={Boolean(busy)}>Record decision</button></form><div className="journal-list">{data.journal.map(item => <article key={item.id}><header><strong>{title(item.decision)}</strong><time>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</time></header><small>{item.observed_price == null ? "Price not recorded" : `$${Number(item.observed_price).toFixed(2)}`} · conviction {item.conviction}/5</small><p>{item.rationale}</p>{item.key_risk && <dl><dt>Key risk</dt><dd>{item.key_risk}</dd></dl>}{item.next_catalyst && <dl><dt>Next catalyst</dt><dd>{item.next_catalyst}</dd></dl>}</article>)}{!data.journal.length && <div className="journal-empty">No decisions recorded yet.</div>}</div></div></section>
        <FactsWorkspace key={`${workspace.updated_at}:${data.facts.map((item) => item.updated_at).join(":")}:${data.commitments.length}:${data.channelChecks.length}:${data.postmortems.length}`} ticker={ticker} workspace={workspace} assessments={data.facts} commitments={data.commitments} channelChecks={data.channelChecks} postmortems={data.postmortems} onAction={async (body, success) => Boolean(await send(body, success))}/>
      </div>
    </section> : null}
  </>;
}
