"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Summary = { benchmark_complete:number;machine_enriched:number;narrative_ready:number;starting_point:number };
type Batch = { id:string;selected_count:number;approved_count:number;needs_revision_count:number;status:string;created_at:string };
type Claim = { section:string;claimType:string;claim:string;whyItMatters:string;sourceTitle:string;sourceUrl:string };
type Candidate = { batch_id:string;ticker:string;priority_rank:number;status:string;source_count:number;claim_preview_json:string;validation_json:string;review_note:string;name:string;market_cap:number|null;quality_tier:string;evidence_date:string|null };
type Payload = { summary:Summary|null;batches:Batch[];candidates:Candidate[];error?:string };

function label(value:string){return value.replaceAll("_"," ");}
function marketCap(value:number|null){
  if(value===null)return "Market cap pending";
  if(value>=1e12)return `$${(value/1e12).toFixed(1)}T`;
  if(value>=1e9)return `$${(value/1e9).toFixed(1)}B`;
  return `$${(value/1e6).toFixed(0)}M`;
}
function claims(value:string){try{return JSON.parse(value) as Claim[];}catch{return [];}}

export function DossierCompletionQueue(){
  const [data,setData]=useState<Payload|null>(null);
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const load=useCallback(async()=>{
    const response=await authenticatedFetch("/api/admin/dossier-completion");
    if(response.status===401)return void window.location.replace(loginPath("/admin"));
    const body=await response.json() as Payload;
    if(!response.ok)setError(body.error??"Unable to load benchmark completion.");else{setData(body);setError("");}
  },[]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer);},[load]);
  const latestBatch=useMemo(()=>data?.batches[0]?.id??"",[data?.batches]);
  const visible=(data?.candidates??[]).filter((item)=>item.batch_id===latestBatch);

  async function createBatch(count:number){
    setBusy("batch");setError("");setNotice("");
    const response=await authenticatedFetch("/api/admin/dossier-completion",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({count})});
    const body=await response.json() as {batchId?:string;selected?:number;approved?:number;needsRevision?:number;tickers?:string[];reason?:string;error?:string};
    if(!response.ok)setError(body.error??"Unable to create the completion batch.");
    else if(body.batchId)setNotice(`${body.batchId}: automatically validated ${body.selected} dossiers — ${body.approved??0} benchmark complete, ${body.needsRevision??0} exceptions.`);
    else if(body.reason==="no_eligible_narrative_ready_dossiers")setNotice("No additional validated narrative-ready dossiers are waiting.");
    else if(body.reason==="automatic_validation_already_running")setNotice("Automatic validation is already running; no duplicate batch was created.");
    else setNotice("No candidates were selected.");
    await load();setBusy("");
  }

  return <section className="dossier-completion-admin" id="dossier-completion">
    <header><div><span className="kicker">EVIDENCE-GATED AUTOMATIC COMPLETION</span><h2>Benchmark dossier completion</h2><p>The active database rule automatically validates required sections, claim diversity, exact citations, and source depth. Passing dossiers publish immediately; failures remain visible as exceptions.</p></div><div><button disabled={Boolean(busy)} onClick={()=>void createBatch(30)}>{busy==="batch"?"Validating…":"Validate next 30 automatically"}</button></div></header>
    {error&&<p className="form-error">{error}</p>}{notice&&<p className="admin-notice">{notice}</p>}
    <div className="dossier-completion-stats"><div><strong>{Number(data?.summary?.benchmark_complete??0).toLocaleString()}</strong><span>Benchmark complete</span></div><div><strong>{Number(data?.summary?.narrative_ready??0).toLocaleString()}</strong><span>Narrative ready</span></div><div><strong>{Number(data?.summary?.machine_enriched??0).toLocaleString()}</strong><span>Machine enriched</span></div><div><strong>{Number(data?.summary?.starting_point??0).toLocaleString()}</strong><span>Source foundation pending</span></div></div>
    <p className="completion-policy-note"><strong>Automatic benchmark publication.</strong> No per-ticker approval is required. The system publishes only when every active evidence and completeness threshold passes, records the validating rule and system identity, and leaves exceptions unpublished at benchmark status. <Link href="/learn/how-to-research-a-stock">Review the owner-research standard →</Link></p>
    {data?.batches[0]&&<div className="completion-batch-heading"><div><small>LATEST AUTOMATIC BATCH</small><strong>{data.batches[0].id}</strong><span>{label(data.batches[0].status)}</span></div><p>{data.batches[0].approved_count}/{data.batches[0].selected_count} automatically complete · {data.batches[0].needs_revision_count} exceptions</p></div>}
    <div className="completion-candidate-list">{visible.map(candidate=>{
      const preview=claims(candidate.claim_preview_json);
      return <details key={`${candidate.batch_id}:${candidate.ticker}`} className={candidate.status}>
        <summary><span><b>#{candidate.priority_rank} · {candidate.ticker}</b><strong>{candidate.name}</strong></span><span><b>{marketCap(candidate.market_cap)}</b><small>{candidate.source_count} sources · {preview.length} claim previews · {label(candidate.status)}</small></span></summary>
        <div className="completion-candidate-body"><div className="completion-candidate-meta"><Link href={`/company/${candidate.ticker.toLowerCase().replaceAll(".","-")}`}>Open current dossier ↗</Link><span>Evidence date {candidate.evidence_date??"pending"}</span><span>Current tier {label(candidate.quality_tier)}</span></div>
          <div className="completion-claim-preview">{preview.map((item,index)=><article key={`${item.section}:${index}`}><header><span>{label(item.section)}</span><em>{label(item.claimType)}</em></header><p>{item.claim}</p><small>{item.whyItMatters}</small><a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceTitle} ↗</a></article>)}</div>
          {candidate.review_note&&<p className="completion-review-note"><strong>{candidate.status==="approved"?"Automatic validation:":"Exception:"}</strong> {candidate.review_note}</p>}
        </div>
      </details>;
    })}</div>
    {!visible.length&&<div className="research-foundation-state compact"><strong>No automatic completion batch has run yet.</strong><p>The scheduler will process eligible source-backed dossiers, or an administrator can run the next 30 now.</p></div>}
  </section>;
}
