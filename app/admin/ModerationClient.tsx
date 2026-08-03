"use client";

import { useCallback, useEffect, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Contribution = { id:number; username:string; ticker:string; contributionType:string; claim:string; whyItMatters:string; sourceUrl:string; positionDisclosure:string; status:string; moderationNote:string; createdAt:string; relatedCompany?:string|null; relatedTicker?:string|null; relationshipDirection?:string|null; relationshipProduct?:string|null; relationshipMateriality?:string|null; relationshipEvidenceClass?:string|null; relationshipSourceType?:string|null; evidenceDate?:string|null; proposedCompanyName?:string|null; companyStage?:string|null; proposedTicker?:string|null; proposedExchange?:string|null; expectedIpoDate?:string|null; companyWebsite?:string|null; roadshowTitle?:string|null; roadshowUrl?:string|null; researchAssetType?:string|null; researchAssetTitle?:string|null; researchAssetFileName?:string|null; researchAssetFileSize?:number|null; researchAssetUrl?:string|null; googleSheetUrl?:string|null; collaborationNotes?:string|null };
type FeedbackItem = { id:number; username:string; category:string; title:string; details:string; status:string; moderatorNote:string; createdAt:string };
type ProfessionalInterview = { id:number; username:string; guestName:string; guestTitle:string; firm:string; credentials:string; title:string; summary:string; interviewUrl:string; transcriptUrl:string; disclosure:string; status:string; moderatorNote:string; createdAt:string };

export function ModerationClient() {
  const [items, setItems] = useState<Contribution[]>([]);
  const [selected, setSelected] = useState<Contribution|null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [importTicker, setImportTicker] = useState("ONDS");
  const [importBusy, setImportBusy] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [professionalInterviews, setProfessionalInterviews] = useState<ProfessionalInterview[]>([]);

  const load = useCallback(async () => {
    const response = await authenticatedFetch("/api/admin/contributions");
    if (response.ok) {
      const data = await response.json() as { contributions: Contribution[] };
      setItems(data.contributions);
    }
  }, []);
  useEffect(()=>{
    let active = true;
    authenticatedFetch("/api/admin/contributions").then(async (response) => {
      if (response.status === 401 && active) return void window.location.replace(loginPath("/admin"));
      if (!response.ok || !active) return;
      const data = await response.json() as { contributions: Contribution[] };
      if (active) setItems(data.contributions);
    });
    return () => { active = false; };
  },[]);
  useEffect(()=>{ authenticatedFetch("/api/admin/feedback").then(async response => { if (response.ok) setFeedback((await response.json() as { feedback: FeedbackItem[] }).feedback); }); },[]);
  useEffect(()=>{ authenticatedFetch("/api/admin/professional-interviews").then(async response => { if (response.ok) setProfessionalInterviews((await response.json() as { interviews: ProfessionalInterview[] }).interviews); }); },[]);

  async function decide(status:"approved"|"needs_revision"|"rejected") {
    if (!selected) return;
    const response = await authenticatedFetch("/api/admin/contributions",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:selected.id,status,moderationNote:note})});
    if (response.ok) {
      const result = await response.json() as { relationshipPublished?: boolean; companyPublished?: boolean };
      setMessage(`Submission ${status.replace("_"," ")}.`);
      if (result.relationshipPublished) setMessage("Submission approved and published to the company relationship graph.");
      if (result.companyPublished) setMessage("Submission approved and published to the IPO and private-company research directory.");
      setSelected(null);
      setNote("");
      await load();
    }
  }

  async function importSecFacts() {
    setImportBusy(true);
    setMessage("");
    const response = await authenticatedFetch("/api/admin/research/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticker: importTicker }) });
    const result = await response.json() as { error?: string; imported?: number; metrics?: number; claims?: number; dossierStatus?: string };
    setMessage(response.ok ? `${importTicker}: imported ${result.imported} filing facts across ${result.metrics} normalized metrics and ${result.claims ?? 0} sourced claims (${result.dossierStatus}).` : result.error ?? "SEC import failed.");
    setImportBusy(false);
  }

  async function openResearchAsset(item: Contribution) {
    if (!item.researchAssetUrl) return;
    const response = await authenticatedFetch(item.researchAssetUrl);
    const result = await response.json() as { url?: string; error?: string };
    if (!response.ok || !result.url) return setMessage(result.error ?? "Research file is unavailable.");
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  async function updateFeedback(item: FeedbackItem, status: string) {
    const response = await authenticatedFetch("/api/admin/feedback", { method:"PATCH", headers:{"content-type":"application/json"}, body:JSON.stringify({ id:item.id, status, moderatorNote:item.moderatorNote }) });
    const result = await response.json() as { pointsAwarded?: number; error?: string };
    if (!response.ok) return setMessage(result.error ?? "Feature request update failed.");
    setFeedback(current => current.map(candidate => candidate.id === item.id ? { ...candidate, status } : candidate));
    setMessage(`Feature request marked ${status}.${result.pointsAwarded ? ` Contributor earned ${result.pointsAwarded} points.` : ""}`);
  }

  async function updateProfessionalInterview(item: ProfessionalInterview, status: string) {
    const response = await authenticatedFetch("/api/admin/professional-interviews", { method:"PATCH", headers:{"content-type":"application/json"}, body:JSON.stringify({ id:item.id, status, moderatorNote:item.moderatorNote }) });
    const result = await response.json() as { pointsAwarded?:number; error?:string };
    if(!response.ok) return setMessage(result.error??"Interview moderation failed.");
    setProfessionalInterviews(current=>current.map(candidate=>candidate.id===item.id?{...candidate,status}:candidate));
    setMessage(`Professional interview marked ${status}.${result.pointsAwarded?` Contributor earned ${result.pointsAwarded} points.`:""}`);
  }

  const pending = items.filter((item)=>item.status==="submitted"||item.status==="needs_revision");
  return <article className="admin-main"><div className="admin-heading"><div><span className="kicker">EDITORIAL REVIEW</span><h1>Community moderation queue</h1><p>Nothing is approved without source review, attribution, disclosure, and an explicit editorial decision.</p></div></div>
    {message&&<div className="publish-notice">✓ {message}</div>}
    <div className="admin-stats"><div><small>AWAITING REVIEW</small><strong>{pending.length}</strong></div><div><small>APPROVED</small><strong>{items.filter(i=>i.status==="approved").length}</strong></div><div><small>REVISION REQUESTED</small><strong>{items.filter(i=>i.status==="needs_revision").length}</strong></div><div><small>TOTAL SUBMISSIONS</small><strong>{items.length}</strong></div></div>
    <div className="admin-research-import"><div><span className="kicker">PUBLIC FILING INGESTION</span><strong>Import normalized SEC Company Facts</strong><p>Editors can refresh filing-grounded financial records without importing analyst estimates or unsourced figures.</p></div><label>TICKER<input value={importTicker} onChange={(event)=>setImportTicker(event.target.value.toUpperCase().slice(0,12))}/></label><button disabled={importBusy||!importTicker} onClick={importSecFacts}>{importBusy?"Importing…":"Import SEC facts →"}</button></div>
    <div className="queue-table"><div className="queue-labels"><span>ITEM</span><span>CONTRIBUTOR</span><span>STATUS</span><span>ACTION</span></div>{items.map((item)=><div className="queue-row" key={item.id}><span><em>{item.ticker} · {item.contributionType}</em><strong>{item.claim}</strong></span><span>@{item.username}<small>{item.positionDisclosure}</small></span><span className={`queue-status status-${item.status}`}>{item.status.replace("_"," ")}</span><span><button onClick={()=>{setSelected(item);setNote(item.moderationNote)}}>Review</button></span></div>)}</div>
    {items.length===0&&<div className="queue-empty">No community submissions yet.</div>}
    <section className="admin-feature-requests admin-professional-interviews"><header><div><span className="kicker">INTERVIEW DESK</span><h2>Investor &amp; contributor interviews</h2></div><p>Verify professional relevance, video access, disclosures, and research value before publication.</p></header>{professionalInterviews.length?professionalInterviews.map(item=><article key={item.id}><div><small>@{item.username} · {item.guestName} · {item.guestTitle}</small><strong>{item.title}</strong><p>{item.summary}</p><div className="admin-interview-links"><a href={item.interviewUrl} target="_blank" rel="noreferrer">Review video ↗</a>{item.transcriptUrl&&<a href={item.transcriptUrl} target="_blank" rel="noreferrer">Transcript ↗</a>}</div><details><summary>Credentials &amp; disclosure</summary><p>{item.credentials}</p><p>{item.disclosure}</p></details></div><select aria-label={`Status for ${item.title}`} value={item.status} onChange={event=>updateProfessionalInterview(item,event.target.value)}><option value="submitted">Submitted</option><option value="reviewing">Reviewing</option><option value="approved">Approved (+200)</option><option value="rejected">Rejected</option></select></article>):<div className="queue-empty">No professional interviews awaiting review.</div>}</section>
    <section className="admin-feature-requests"><header><div><span className="kicker">PRODUCT CO-CREATION</span><h2>Feature request decisions</h2></div><p>Moving an idea to planned or completed automatically awards the submitter once.</p></header>{feedback.length ? feedback.map(item => <article key={item.id}><div><small>{item.category} · @{item.username}</small><strong>{item.title}</strong><p>{item.details}</p></div><select aria-label={`Status for ${item.title}`} value={item.status} onChange={event => updateFeedback(item,event.target.value)}><option value="submitted">Submitted</option><option value="reviewing">Reviewing</option><option value="planned">Planned (+40)</option><option value="completed">Completed (+75)</option><option value="declined">Declined</option></select></article>) : <div className="queue-empty">No product feedback yet.</div>}</section>
    {selected&&<div className="moderation-overlay" onClick={()=>setSelected(null)}><div className="moderation-panel" onClick={(event)=>event.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><span className="kicker">{selected.ticker} · {selected.contributionType}</span><h2>Review the evidence</h2><small>Submitted by @{selected.username}</small>{selected.contributionType==="Supplier / customer relationship"&&<div className="moderation-relationship"><small>PROPOSED GRAPH EDGE</small><strong>{selected.relationshipDirection==="supplier_to_company"?`${selected.relatedTicker||selected.relatedCompany} → ${selected.ticker}`:`${selected.ticker} → ${selected.relatedTicker||selected.relatedCompany}`}</strong><p>{selected.relationshipProduct}</p><span>{selected.relationshipSourceType?.toUpperCase()} primary source · {selected.relationshipEvidenceClass?.replaceAll("_"," ")} · {selected.relationshipMateriality} · evidence dated {selected.evidenceDate}</span></div>}{(selected.companyStage==="upcoming_ipo"||selected.companyStage==="private")&&<div className="moderation-company-proposal"><small>{selected.companyStage==="upcoming_ipo"?"UPCOMING IPO":"PRIVATE COMPANY"}</small><strong>{selected.proposedCompanyName}</strong><span>{selected.proposedTicker||"Ticker not announced"}{selected.proposedExchange?` · ${selected.proposedExchange}`:""}{selected.expectedIpoDate?` · expected ${selected.expectedIpoDate}`:""}</span>{selected.companyWebsite&&<a href={selected.companyWebsite} target="_blank" rel="noreferrer">Official website ↗</a>}{selected.roadshowUrl&&<a href={selected.roadshowUrl} target="_blank" rel="noreferrer">Review {selected.roadshowTitle||"roadshow PDF"} ↗</a>}</div>}{(selected.researchAssetUrl||selected.googleSheetUrl)&&<div className="moderation-research-asset"><small>PUBLIC RESEARCH ASSET</small><strong>{selected.researchAssetTitle||selected.contributionType}</strong>{selected.researchAssetFileName&&<span>{selected.researchAssetFileName}{selected.researchAssetFileSize?` · ${(selected.researchAssetFileSize/1024/1024).toFixed(1)} MB`:""}</span>}<div>{selected.researchAssetUrl&&<button type="button" onClick={()=>openResearchAsset(selected)}>Review uploaded file ↗</button>}{selected.googleSheetUrl&&<a href={selected.googleSheetUrl} target="_blank" rel="noreferrer">Review collaborative Google Sheet ↗</a>}</div>{selected.collaborationNotes&&<p>{selected.collaborationNotes}</p>}</div>}<h3>Claim</h3><p>{selected.claim}</p><h3>Why it matters</h3><p>{selected.whyItMatters}</p><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open source evidence ↗</a><label>EDITOR NOTE<textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Explain the decision or requested revision."/></label><div className="moderation-actions"><button onClick={()=>decide("approved")}>Approve</button><button onClick={()=>decide("needs_revision")}>Request revision</button><button onClick={()=>decide("rejected")}>Reject</button></div></div></div>}
    <div className="workflow-map"><span>SUBMITTED</span><i>→</i><span>SOURCE CHECKED</span><i>→</i><span>DISCLOSURE REVIEWED</span><i>→</i><span>EDITOR DECISION</span><i>→</i><span>ELIGIBLE TO PUBLISH</span></div>
  </article>;
}
