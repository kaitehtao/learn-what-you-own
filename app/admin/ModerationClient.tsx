"use client";

import { useCallback, useEffect, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Contribution = { id:number; username:string; ticker:string; contributionType:string; claim:string; whyItMatters:string; sourceUrl:string; positionDisclosure:string; status:string; moderationNote:string; createdAt:string };

export function ModerationClient() {
  const [items, setItems] = useState<Contribution[]>([]);
  const [selected, setSelected] = useState<Contribution|null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

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
      setMessage(`Submission ${status.replace("_"," ")}.`);
      setSelected(null);
      setNote("");
      await load();
    }
  }

  const pending = items.filter((item)=>item.status==="submitted"||item.status==="needs_revision");
  return <article className="admin-main"><div className="admin-heading"><div><span className="kicker">EDITORIAL REVIEW</span><h1>Community moderation queue</h1><p>Nothing is approved without source review, attribution, disclosure, and an explicit editorial decision.</p></div></div>
    {message&&<div className="publish-notice">✓ {message}</div>}
    <div className="admin-stats"><div><small>AWAITING REVIEW</small><strong>{pending.length}</strong></div><div><small>APPROVED</small><strong>{items.filter(i=>i.status==="approved").length}</strong></div><div><small>REVISION REQUESTED</small><strong>{items.filter(i=>i.status==="needs_revision").length}</strong></div><div><small>TOTAL SUBMISSIONS</small><strong>{items.length}</strong></div></div>
    <div className="queue-table"><div className="queue-labels"><span>ITEM</span><span>CONTRIBUTOR</span><span>STATUS</span><span>ACTION</span></div>{items.map((item)=><div className="queue-row" key={item.id}><span><em>{item.ticker} · {item.contributionType}</em><strong>{item.claim}</strong></span><span>@{item.username}<small>{item.positionDisclosure}</small></span><span className={`queue-status status-${item.status}`}>{item.status.replace("_"," ")}</span><span><button onClick={()=>{setSelected(item);setNote(item.moderationNote)}}>Review</button></span></div>)}</div>
    {items.length===0&&<div className="queue-empty">No community submissions yet.</div>}
    {selected&&<div className="moderation-overlay" onClick={()=>setSelected(null)}><div className="moderation-panel" onClick={(event)=>event.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><span className="kicker">{selected.ticker} · {selected.contributionType}</span><h2>Review the evidence</h2><small>Submitted by @{selected.username}</small><h3>Claim</h3><p>{selected.claim}</p><h3>Why it matters</h3><p>{selected.whyItMatters}</p><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open source evidence ↗</a><label>EDITOR NOTE<textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Explain the decision or requested revision."/></label><div className="moderation-actions"><button onClick={()=>decide("approved")}>Approve</button><button onClick={()=>decide("needs_revision")}>Request revision</button><button onClick={()=>decide("rejected")}>Reject</button></div></div></div>}
    <div className="workflow-map"><span>SUBMITTED</span><i>→</i><span>SOURCE CHECKED</span><i>→</i><span>DISCLOSURE REVIEWED</span><i>→</i><span>EDITOR DECISION</span><i>→</i><span>ELIGIBLE TO PUBLISH</span></div>
  </article>;
}
