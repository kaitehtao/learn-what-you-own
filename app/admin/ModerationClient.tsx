"use client";

import { useCallback, useEffect, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Contribution = { id:number; username:string; ticker:string; contributionType:string; claim:string; whyItMatters:string; sourceUrl:string; positionDisclosure:string; status:string; moderationNote:string; createdAt:string; relatedCompany?:string|null; relatedTicker?:string|null; relationshipDirection?:string|null; relationshipProduct?:string|null; relationshipMateriality?:string|null; relationshipEvidenceClass?:string|null; relationshipSourceType?:string|null; evidenceDate?:string|null; proposedCompanyName?:string|null; companyStage?:string|null; proposedTicker?:string|null; proposedExchange?:string|null; expectedIpoDate?:string|null; companyWebsite?:string|null; roadshowTitle?:string|null; roadshowUrl?:string|null };

export function ModerationClient() {
  const [items, setItems] = useState<Contribution[]>([]);
  const [selected, setSelected] = useState<Contribution|null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [importTicker, setImportTicker] = useState("ONDS");
  const [importBusy, setImportBusy] = useState(false);

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

  const pending = items.filter((item)=>item.status==="submitted"||item.status==="needs_revision");
  return <article className="admin-main"><div className="admin-heading"><div><span className="kicker">EDITORIAL REVIEW</span><h1>Community moderation queue</h1><p>Nothing is approved without source review, attribution, disclosure, and an explicit editorial decision.</p></div></div>
    {message&&<div className="publish-notice">✓ {message}</div>}
    <div className="admin-stats"><div><small>AWAITING REVIEW</small><strong>{pending.length}</strong></div><div><small>APPROVED</small><strong>{items.filter(i=>i.status==="approved").length}</strong></div><div><small>REVISION REQUESTED</small><strong>{items.filter(i=>i.status==="needs_revision").length}</strong></div><div><small>TOTAL SUBMISSIONS</small><strong>{items.length}</strong></div></div>
    <div className="admin-research-import"><div><span className="kicker">PUBLIC FILING INGESTION</span><strong>Import normalized SEC Company Facts</strong><p>Editors can refresh filing-grounded financial records without importing analyst estimates or unsourced figures.</p></div><label>TICKER<input value={importTicker} onChange={(event)=>setImportTicker(event.target.value.toUpperCase().slice(0,12))}/></label><button disabled={importBusy||!importTicker} onClick={importSecFacts}>{importBusy?"Importing…":"Import SEC facts →"}</button></div>
    <div className="queue-table"><div className="queue-labels"><span>ITEM</span><span>CONTRIBUTOR</span><span>STATUS</span><span>ACTION</span></div>{items.map((item)=><div className="queue-row" key={item.id}><span><em>{item.ticker} · {item.contributionType}</em><strong>{item.claim}</strong></span><span>@{item.username}<small>{item.positionDisclosure}</small></span><span className={`queue-status status-${item.status}`}>{item.status.replace("_"," ")}</span><span><button onClick={()=>{setSelected(item);setNote(item.moderationNote)}}>Review</button></span></div>)}</div>
    {items.length===0&&<div className="queue-empty">No community submissions yet.</div>}
    {selected&&<div className="moderation-overlay" onClick={()=>setSelected(null)}><div className="moderation-panel" onClick={(event)=>event.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><span className="kicker">{selected.ticker} · {selected.contributionType}</span><h2>Review the evidence</h2><small>Submitted by @{selected.username}</small>{selected.contributionType==="Supplier / customer relationship"&&<div className="moderation-relationship"><small>PROPOSED GRAPH EDGE</small><strong>{selected.relationshipDirection==="supplier_to_company"?`${selected.relatedTicker||selected.relatedCompany} → ${selected.ticker}`:`${selected.ticker} → ${selected.relatedTicker||selected.relatedCompany}`}</strong><p>{selected.relationshipProduct}</p><span>{selected.relationshipSourceType?.toUpperCase()} primary source · {selected.relationshipEvidenceClass?.replaceAll("_"," ")} · {selected.relationshipMateriality} · evidence dated {selected.evidenceDate}</span></div>}{(selected.companyStage==="upcoming_ipo"||selected.companyStage==="private")&&<div className="moderation-company-proposal"><small>{selected.companyStage==="upcoming_ipo"?"UPCOMING IPO":"PRIVATE COMPANY"}</small><strong>{selected.proposedCompanyName}</strong><span>{selected.proposedTicker||"Ticker not announced"}{selected.proposedExchange?` · ${selected.proposedExchange}`:""}{selected.expectedIpoDate?` · expected ${selected.expectedIpoDate}`:""}</span>{selected.companyWebsite&&<a href={selected.companyWebsite} target="_blank" rel="noreferrer">Official website ↗</a>}{selected.roadshowUrl&&<a href={selected.roadshowUrl} target="_blank" rel="noreferrer">Review {selected.roadshowTitle||"roadshow PDF"} ↗</a>}</div>}<h3>Claim</h3><p>{selected.claim}</p><h3>Why it matters</h3><p>{selected.whyItMatters}</p><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open source evidence ↗</a><label>EDITOR NOTE<textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Explain the decision or requested revision."/></label><div className="moderation-actions"><button onClick={()=>decide("approved")}>Approve</button><button onClick={()=>decide("needs_revision")}>Request revision</button><button onClick={()=>decide("rejected")}>Reject</button></div></div></div>}
    <div className="workflow-map"><span>SUBMITTED</span><i>→</i><span>SOURCE CHECKED</span><i>→</i><span>DISCLOSURE REVIEWED</span><i>→</i><span>EDITOR DECISION</span><i>→</i><span>ELIGIBLE TO PUBLISH</span></div>
  </article>;
}
