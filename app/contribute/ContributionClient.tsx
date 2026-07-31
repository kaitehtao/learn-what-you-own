"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

const contributionTypes = ["Factual correction","Thesis update","Industry observation","Competitive analysis","Financial model","Question for management"];
type Submission = { id:number; ticker:string; contributionType:string; claim:string; status:string; moderationNote:string; createdAt:string };

const emptyForm = {
  ticker: "ONDS",
  contributionType: contributionTypes[0],
  claim: "",
  whyItMatters: "",
  sourceUrl: "",
  evidenceDate: "",
  confidence: "High — direct primary evidence",
  timeHorizon: "Current fact",
  expertise: "",
  positionDisclosure: "",
  conflictDisclosure: "",
};

export function ContributionClient({ initialTicker }: { initialTicker?: string }) {
  const [form, setForm] = useState({ ...emptyForm, ticker: initialTicker || emptyForm.ticker });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [username, setUsername] = useState("your username");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await authenticatedFetch("/api/contributions");
    if (response.ok) {
      const data = await response.json() as { contributions: Submission[] };
      setSubmissions(data.contributions);
    }
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([authenticatedFetch("/api/contributions"), authenticatedFetch("/api/account")]).then(async ([response, accountResponse]) => {
      if (!active) return;
      if (response.status === 401 || accountResponse.status === 401) {
        window.location.href = loginPath(`/contribute${initialTicker ? `?ticker=${encodeURIComponent(initialTicker)}` : ""}`);
        return;
      }
      if (!response.ok) return;
      const data = await response.json() as { contributions: Submission[] };
      if (active) setSubmissions(data.contributions);
      if (accountResponse.ok) {
        const account = await accountResponse.json() as { profile?: { username?: string; onboarding_complete?: boolean } };
        if (!account.profile?.onboarding_complete) window.location.href = "/onboarding";
        else if (account.profile.username) setUsername(account.profile.username);
      }
    });
    return () => { active = false; };
  }, [initialTicker]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await authenticatedFetch("/api/contributions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json() as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Unable to submit your contribution.");
      setBusy(false);
      return;
    }
    setSubmitted(true);
    setForm({...emptyForm, contributionType: form.contributionType});
    await load();
    setBusy(false);
  }

  return <section className="container contribute-layout">
    <aside><span className="kicker">CONTRIBUTION TYPES</span>{contributionTypes.map((item,index)=><button type="button" className={form.contributionType===item?"active":""} onClick={()=>setForm({...form,contributionType:item})} key={item}><span>0{index+1}</span>{item}</button>)}<div className="contributor-standard"><strong>Submitting as @{username}</strong><p>Be specific. Cite primary evidence. Separate fact from interpretation. Disclose your position and conflicts.</p></div></aside>
    <article>
      {submitted&&<div className="submission-banner">✓ Submitted for editorial review. It will remain unpublished until an editor approves it.</div>}
      <form onSubmit={submit}>
        <div className="form-heading"><span>New contribution</span><em>Editorial review required</em></div>
        <div className="form-grid"><label>COMPANY TICKER<input required value={form.ticker} onChange={(e)=>setForm({...form,ticker:e.target.value.toUpperCase()})} placeholder="ONDS"/></label><label>CONTRIBUTION TYPE<select value={form.contributionType} onChange={(e)=>setForm({...form,contributionType:e.target.value})}>{contributionTypes.map(item=><option key={item}>{item}</option>)}</select></label></div>
        <label>MAIN CLAIM OR CORRECTION<textarea required minLength={20} value={form.claim} onChange={(e)=>setForm({...form,claim:e.target.value})} placeholder="State one specific, verifiable claim." /></label>
        <label>WHY IT MATTERS<textarea required minLength={20} value={form.whyItMatters} onChange={(e)=>setForm({...form,whyItMatters:e.target.value})} placeholder="Explain how this evidence changes—or does not change—the owner’s understanding." /></label>
        <div className="form-grid"><label>SOURCE URL<input required type="url" value={form.sourceUrl} onChange={(e)=>setForm({...form,sourceUrl:e.target.value})} placeholder="https://sec.gov/..." /></label><label>DATE OF EVIDENCE<input required type="date" value={form.evidenceDate} onChange={(e)=>setForm({...form,evidenceDate:e.target.value})}/></label><label>CONFIDENCE<select value={form.confidence} onChange={(e)=>setForm({...form,confidence:e.target.value})}><option>High — direct primary evidence</option><option>Medium — supported inference</option><option>Low — question for review</option></select></label><label>TIME HORIZON<select value={form.timeHorizon} onChange={(e)=>setForm({...form,timeHorizon:e.target.value})}><option>Current fact</option><option>Next 12 months</option><option>Long term</option></select></label></div>
        <label>RELEVANT EXPERTISE<input value={form.expertise} onChange={(e)=>setForm({...form,expertise:e.target.value})} placeholder="e.g. Rail communications engineer, independent investor" /></label>
        <div className="form-grid"><label>POSITION DISCLOSURE<input required value={form.positionDisclosure} onChange={(e)=>setForm({...form,positionDisclosure:e.target.value})} placeholder="e.g. Long shares; no position"/></label><label>OTHER CONFLICTS<input value={form.conflictDisclosure} onChange={(e)=>setForm({...form,conflictDisclosure:e.target.value})} placeholder="Employment, compensation, relationships, or none"/></label></div>
        {error&&<p className="form-error">{error}</p>}
        <div className="disclosure-box"><p>Submitting does not publish your research. Editors may approve, reject, or request revisions, and every approved contribution retains its source and disclosure record.</p></div>
        <button className="submit-contribution" disabled={busy}>{busy?"Submitting…":"Submit for editorial review →"}</button>
      </form>
      <div className="my-submissions"><div className="form-heading"><span>My submission history</span><em>{submissions.length} total</em></div>{submissions.length===0?<p>No submissions yet.</p>:submissions.map((item)=><div className="submission-row" key={item.id}><i>{item.ticker}</i><span><strong>{item.contributionType}</strong><p>{item.claim}</p>{item.moderationNote&&<small>Editor note: {item.moderationNote}</small>}</span><em className={`status-${item.status}`}>{item.status.replace("_"," ")}</em></div>)}</div>
    </article>
  </section>;
}
