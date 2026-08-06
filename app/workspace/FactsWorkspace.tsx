"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

export type FactsDimension = "financial" | "accounting" | "credibility" | "timing" | "sector";
export type FactsAssessment = { id: number; dimension: FactsDimension; status: string; score: number; summary: string; key_question: string; evidence_gap: string; updated_at: string };
export type ManagementCommitment = { id: number; statement_date: string; commitment: string; expected_date: string | null; actual_outcome: string; status: string; source_url: string };
export type ChannelCheck = { id: number; counterparty_type: string; organization: string; participant_role: string; interaction_date: string; finding: string; thesis_impact: string; confidence: number; source_note: string };
export type Postmortem = { id: number; outcome: string; process_grade: number; thesis_result: string; what_worked: string; what_failed: string; lesson: string; created_at: string };
export type FactsActionPlan = {
  stock_profile: string; target_return_pct: number | null; target_date: string | null;
  entry_rule: string; hold_rule: string; exit_rule: string; max_position_pct: number | null; liquidity_plan: string;
};

const dimensions: FactsDimension[] = ["financial", "accounting", "credibility", "timing", "sector"];
const factsGuide: Record<FactsDimension, { letter: string; title: string; purpose: string; prompts: string[]; links: Array<{ label: string; href: string }> }> = {
  financial: { letter: "F", title: "Financial", purpose: "Test valuation, returns, cash generation, balance-sheet capacity, and comparable economics.", prompts: ["Which valuation method fits this business?", "Does return on capital exceed the cost of capital?", "What assumptions are embedded in the current price?"], links: [{ label: "Historical valuation", href: "#valuation-history" }, { label: "Build comparables", href: "/comps" }] },
  accounting: { letter: "A", title: "Accounting", purpose: "Determine whether reported earnings are conservative, repeatable, and supported by cash.", prompts: ["Are costs expensed or capitalized?", "How do revenue recognition and deferred revenue change?", "What differs between GAAP earnings and cash earnings?"], links: [{ label: "SEC facts", href: "#research-foundation" }, { label: "SEC filings", href: "#filings" }] },
  credibility: { letter: "C", title: "Credibility", purpose: "Measure management execution, incentives, ownership, communication, and accountability.", prompts: ["Did management deliver prior commitments?", "Which metrics determine compensation?", "Are insider ownership and transactions economically meaningful?"], links: [{ label: "Ownership evidence", href: "#ownership" }, { label: "Interviews", href: "/interviews" }] },
  timing: { letter: "T", title: "Timing", purpose: "Map catalysts, seasonality, product cycles, liquidity, and explicit decision triggers.", prompts: ["What changes consensus, and when?", "Which leading indicator should move first?", "What are the entry, hold, reduce, and exit conditions?"], links: [{ label: "Earnings calendar", href: "/earnings" }, { label: "What to monitor", href: "#changes" }] },
  sector: { letter: "S", title: "Sector", purpose: "Place the company inside its market structure, cycle, supply chain, and competitive field.", prompts: ["Where is the industry in its cycle?", "Who has pricing power and market share?", "What capacity, regulation, or technology could change the structure?"], links: [{ label: "Company relationships", href: "#research-foundation" }, { label: "Comparable set", href: "#comparables" }] },
};

function title(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()); }
function today() { return new Date().toISOString().slice(0, 10); }

export function FactsWorkspace({ ticker, workspace, assessments, commitments, channelChecks, postmortems, onAction }: {
  ticker: string;
  workspace: FactsActionPlan;
  assessments: FactsAssessment[];
  commitments: ManagementCommitment[];
  channelChecks: ChannelCheck[];
  postmortems: Postmortem[];
  onAction: (body: Record<string, unknown>, success: string) => Promise<boolean>;
}) {
  const [facts, setFacts] = useState<Record<FactsDimension, FactsAssessment>>(() => Object.fromEntries(assessments.map((item) => [item.dimension, item])) as Record<FactsDimension, FactsAssessment>);
  const [plan, setPlan] = useState<FactsActionPlan>(workspace);
  const [commitment, setCommitment] = useState({ statementDate: today(), commitment: "", expectedDate: "", actualOutcome: "", status: "open", sourceUrl: "" });
  const [channel, setChannel] = useState({ counterpartyType: "customer", organization: "", participantRole: "", interactionDate: today(), finding: "", thesisImpact: "neutral", confidence: 3, sourceNote: "" });
  const [postmortem, setPostmortem] = useState({ outcome: "open", processGrade: 3, thesisResult: "mixed", whatWorked: "", whatFailed: "", lesson: "" });

  const completed = useMemo(() => assessments.filter((item) => ["evidence_complete", "reviewed"].includes(item.status)).length, [assessments]);
  const averageScore = useMemo(() => assessments.length ? assessments.reduce((sum, item) => sum + Number(item.score || 0), 0) / assessments.length : 0, [assessments]);

  function updateFact(dimension: FactsDimension, field: keyof FactsAssessment, value: string | number) {
    setFacts((current) => ({ ...current, [dimension]: { ...current[dimension], [field]: value } }));
  }

  async function saveFact(dimension: FactsDimension) {
    const fact = facts[dimension];
    if (!fact) return;
    await onAction({ action: "save_facts", dimension, status: fact.status, score: fact.score, summary: fact.summary, keyQuestion: fact.key_question, evidenceGap: fact.evidence_gap }, `${factsGuide[dimension].title} assessment saved.`);
  }

  async function savePlan(event: FormEvent) {
    event.preventDefault();
    await onAction({ action: "save_action_plan", stockProfile: plan.stock_profile, targetReturnPct: plan.target_return_pct, targetDate: plan.target_date, entryRule: plan.entry_rule, holdRule: plan.hold_rule, exitRule: plan.exit_rule, maxPositionPct: plan.max_position_pct, liquidityPlan: plan.liquidity_plan }, "Investment action plan saved.");
  }

  async function addCommitment(event: FormEvent) {
    event.preventDefault();
    if (await onAction({ action: "save_commitment", ...commitment }, "Management commitment recorded.")) setCommitment({ statementDate: today(), commitment: "", expectedDate: "", actualOutcome: "", status: "open", sourceUrl: "" });
  }

  async function addChannelCheck(event: FormEvent) {
    event.preventDefault();
    if (await onAction({ action: "save_channel_check", ...channel }, "Private channel check recorded.")) setChannel({ counterpartyType: "customer", organization: "", participantRole: "", interactionDate: today(), finding: "", thesisImpact: "neutral", confidence: 3, sourceNote: "" });
  }

  async function addPostmortem(event: FormEvent) {
    event.preventDefault();
    if (await onAction({ action: "add_postmortem", ...postmortem }, "Decision postmortem recorded.")) setPostmortem({ outcome: "open", processGrade: 3, thesisResult: "mixed", whatWorked: "", whatFailed: "", lesson: "" });
  }

  return <section className="analyst-card facts-workspace-card">
    <header className="facts-workspace-heading"><div><span className="kicker">05 · FACTS DUE DILIGENCE</span><h3>Complete the investment case—not just the narrative</h3><p>Financial · Accounting · Credibility · Timing · Sector</p></div><div className="facts-completion"><strong>{completed}/5</strong><span>evidence ready</span><small>{averageScore ? `${averageScore.toFixed(1)}/5 average assessment` : "Not yet scored"}</small></div></header>
    <div className="facts-assessment-grid">{dimensions.map((dimension) => {
      const guide = factsGuide[dimension];
      const fact = facts[dimension];
      if (!fact) return null;
      return <article className={`facts-assessment ${dimension}`} key={dimension}>
        <header><i>{guide.letter}</i><div><small>{guide.title.toUpperCase()}</small><strong>{guide.purpose}</strong></div></header>
        <ul>{guide.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul>
        <div className="facts-status-row"><label>STATUS<select value={fact.status} onChange={(event) => updateFact(dimension, "status", event.target.value)}><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="evidence_complete">Evidence complete</option><option value="reviewed">Reviewed</option></select></label><label>ASSESSMENT<select value={fact.score} onChange={(event) => updateFact(dimension, "score", Number(event.target.value))}>{[1,2,3,4,5].map((value) => <option value={value} key={value}>{value} / 5</option>)}</select></label></div>
        <label>CONCLUSION<textarea value={fact.summary} onChange={(event) => updateFact(dimension, "summary", event.target.value)} placeholder={`Your evidence-led ${guide.title.toLowerCase()} conclusion`}/></label>
        <label>DECISIVE QUESTION<textarea value={fact.key_question} onChange={(event) => updateFact(dimension, "key_question", event.target.value)} placeholder="What must be answered before capital is committed?"/></label>
        <label>EVIDENCE GAP<textarea value={fact.evidence_gap} onChange={(event) => updateFact(dimension, "evidence_gap", event.target.value)} placeholder="What evidence is still missing or contradictory?"/></label>
        <footer><div>{guide.links.map((link) => <Link href={link.href.startsWith("#") ? `/company/${ticker.toLowerCase()}${link.href}` : link.href} key={link.label}>{link.label} ↗</Link>)}</div><button type="button" onClick={() => void saveFact(dimension)}>Save {guide.letter}</button></footer>
      </article>;
    })}</div>

    <section className="facts-action-plan"><header><div><span className="kicker">ACTION PLAN</span><h3>Define the stock—and the rules—before volatility tests conviction</h3></div><span>Private to your account</span></header><form onSubmit={savePlan}>
      <div className="facts-plan-grid"><label>STOCK PROFILE<select value={plan.stock_profile} onChange={(event) => setPlan({ ...plan, stock_profile: event.target.value })}><option value="unclassified">Unclassified</option><option value="growth">Growth</option><option value="value">Value</option><option value="turnaround">Turnaround</option></select></label><label>TARGET RETURN %<input type="number" step="0.1" value={plan.target_return_pct ?? ""} onChange={(event) => setPlan({ ...plan, target_return_pct: event.target.value === "" ? null : Number(event.target.value) })}/></label><label>TARGET DATE<input type="date" value={plan.target_date ?? ""} onChange={(event) => setPlan({ ...plan, target_date: event.target.value || null })}/></label><label>MAXIMUM POSITION %<input type="number" min="0" max="100" step="0.1" value={plan.max_position_pct ?? ""} onChange={(event) => setPlan({ ...plan, max_position_pct: event.target.value === "" ? null : Number(event.target.value) })}/></label></div>
      <label>ENTRY RULE<textarea value={plan.entry_rule} onChange={(event) => setPlan({ ...plan, entry_rule: event.target.value })} placeholder="Price, valuation, evidence, and timing conditions required to initiate or add"/></label><label>HOLD RULE<textarea value={plan.hold_rule} onChange={(event) => setPlan({ ...plan, hold_rule: event.target.value })} placeholder="Evidence that keeps the thesis intact through volatility"/></label><label>REDUCE / EXIT RULE<textarea value={plan.exit_rule} onChange={(event) => setPlan({ ...plan, exit_rule: event.target.value })} placeholder="Valuation, thesis-breaker, timing, or risk conditions that require action"/></label><label>LIQUIDITY AND SIZING PLAN<textarea value={plan.liquidity_plan} onChange={(event) => setPlan({ ...plan, liquidity_plan: event.target.value })} placeholder="Daily liquidity, scaling schedule, concentration limit, and downside capacity"/></label><button>Save private action plan</button>
    </form></section>

    <div className="facts-ledger-grid">
      <section className="facts-ledger"><header><span className="kicker">MANAGEMENT CREDIBILITY LEDGER</span><h3>Promise versus result</h3></header><form onSubmit={addCommitment}><div className="facts-inline-fields"><label>STATEMENT DATE<input required type="date" value={commitment.statementDate} onChange={(event) => setCommitment({ ...commitment, statementDate: event.target.value })}/></label><label>EXPECTED BY<input type="date" value={commitment.expectedDate} onChange={(event) => setCommitment({ ...commitment, expectedDate: event.target.value })}/></label><label>STATUS<select value={commitment.status} onChange={(event) => setCommitment({ ...commitment, status: event.target.value })}>{["open","achieved","partially_achieved","delayed","missed","unverifiable"].map((value) => <option value={value} key={value}>{title(value)}</option>)}</select></label></div><label>PUBLIC COMMITMENT<textarea required minLength={8} value={commitment.commitment} onChange={(event) => setCommitment({ ...commitment, commitment: event.target.value })}/></label><label>ACTUAL OUTCOME<textarea value={commitment.actualOutcome} onChange={(event) => setCommitment({ ...commitment, actualOutcome: event.target.value })}/></label><label>SOURCE URL<input type="url" value={commitment.sourceUrl} onChange={(event) => setCommitment({ ...commitment, sourceUrl: event.target.value })} placeholder="https://…"/></label><button>Add commitment</button></form><div className="facts-ledger-list">{commitments.map((item) => <article key={item.id}><header><strong>{title(item.status)}</strong><time>{item.statement_date}</time></header><p>{item.commitment}</p>{item.actual_outcome && <blockquote>{item.actual_outcome}</blockquote>}<footer>{item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer">Source ↗</a>}<button onClick={() => void onAction({ action: "delete_commitment", id: item.id }, "Commitment removed.")}>Remove</button></footer></article>)}{!commitments.length && <p className="facts-empty">No management commitments recorded yet.</p>}</div></section>

      <section className="facts-ledger"><header><span className="kicker">PRIVATE INVESTIGATION LOG</span><h3>Management and third-party checks</h3></header><form onSubmit={addChannelCheck}><div className="facts-inline-fields"><label>COUNTERPARTY<select value={channel.counterpartyType} onChange={(event) => setChannel({ ...channel, counterpartyType: event.target.value })}>{["management","customer","supplier","distributor","competitor","consultant","trade_show","other"].map((value) => <option value={value} key={value}>{title(value)}</option>)}</select></label><label>DATE<input required type="date" value={channel.interactionDate} onChange={(event) => setChannel({ ...channel, interactionDate: event.target.value })}/></label><label>THESIS IMPACT<select value={channel.thesisImpact} onChange={(event) => setChannel({ ...channel, thesisImpact: event.target.value })}><option value="bull">Bull</option><option value="neutral">Neutral</option><option value="bear">Bear</option></select></label></div><label>ORGANIZATION<input value={channel.organization} onChange={(event) => setChannel({ ...channel, organization: event.target.value })}/></label><label>PARTICIPANT ROLE<input value={channel.participantRole} onChange={(event) => setChannel({ ...channel, participantRole: event.target.value })} placeholder="Role only; avoid unnecessary personal information"/></label><label>FINDING<textarea required minLength={12} value={channel.finding} onChange={(event) => setChannel({ ...channel, finding: event.target.value })}/></label><label>PRIVATE SOURCE NOTE<textarea value={channel.sourceNote} onChange={(event) => setChannel({ ...channel, sourceNote: event.target.value })} placeholder="Context, limitations, and follow-up questions"/></label><button>Add private check</button></form><div className="facts-ledger-list">{channelChecks.map((item) => <article className={item.thesis_impact} key={item.id}><header><strong>{title(item.counterparty_type)} · {title(item.thesis_impact)}</strong><time>{item.interaction_date}</time></header><p>{item.finding}</p><small>{item.organization || "Organization withheld"}{item.participant_role ? ` · ${item.participant_role}` : ""} · confidence {item.confidence}/5</small><footer><span>Private research record</span><button onClick={() => void onAction({ action: "delete_channel_check", id: item.id }, "Channel check removed.")}>Remove</button></footer></article>)}{!channelChecks.length && <p className="facts-empty">No management or third-party checks recorded yet.</p>}</div></section>
    </div>

    <section className="facts-postmortem"><header><div><span className="kicker">DECISION POSTMORTEM</span><h3>Separate a good process from a lucky outcome</h3></div><span>{postmortems.length} reviews</span></header><div className="facts-postmortem-layout"><form onSubmit={addPostmortem}><div className="facts-inline-fields"><label>OUTCOME<select value={postmortem.outcome} onChange={(event) => setPostmortem({ ...postmortem, outcome: event.target.value })}>{["open","win","loss","avoided_loss","missed_opportunity"].map((value) => <option value={value} key={value}>{title(value)}</option>)}</select></label><label>THESIS RESULT<select value={postmortem.thesisResult} onChange={(event) => setPostmortem({ ...postmortem, thesisResult: event.target.value })}>{["correct","incorrect","mixed","too_early","unresolved"].map((value) => <option value={value} key={value}>{title(value)}</option>)}</select></label><label>PROCESS GRADE<select value={postmortem.processGrade} onChange={(event) => setPostmortem({ ...postmortem, processGrade: Number(event.target.value) })}>{[1,2,3,4,5].map((value) => <option value={value} key={value}>{value} / 5</option>)}</select></label></div><label>WHAT WORKED<textarea value={postmortem.whatWorked} onChange={(event) => setPostmortem({ ...postmortem, whatWorked: event.target.value })}/></label><label>WHAT FAILED<textarea value={postmortem.whatFailed} onChange={(event) => setPostmortem({ ...postmortem, whatFailed: event.target.value })}/></label><label>REUSABLE LESSON<textarea required minLength={12} value={postmortem.lesson} onChange={(event) => setPostmortem({ ...postmortem, lesson: event.target.value })}/></label><button>Add postmortem</button></form><div className="facts-postmortem-list">{postmortems.map((item) => <article key={item.id}><header><strong>{title(item.outcome)}</strong><span>Process {item.process_grade}/5 · thesis {title(item.thesis_result)}</span></header>{item.what_worked && <p><b>Worked:</b> {item.what_worked}</p>}{item.what_failed && <p><b>Failed:</b> {item.what_failed}</p>}<blockquote>{item.lesson}</blockquote><time>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(item.created_at))}</time></article>)}{!postmortems.length && <p className="facts-empty">No postmortems yet. Review the process after a major thesis decision or closed position.</p>}</div></div></section>
  </section>;
}
