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
    const body=await response.json() as {batchId?:string;selected?:number;tickers?:string[];reason?:string;error?:string};
    if(!response.ok)setError(body.error??"Unable to create the completion batch.");
    else if(body.batchId)setNotice(`${body.batchId}: prepared ${body.selected} evidence packets — ${body.tickers?.join(", ")}.`);
    else setNotice(body.reason==="no_eligible_narrative_ready_dossiers"?"No additional validated narrative-ready dossiers are waiting.":"No candidates were selected.");
    await load();setBusy("");
  }

  async function review(candidate:Candidate,action:"approve"|"needs_revision"){
    const note=action==="needs_revision"?window.prompt(`What must be revised for ${candidate.ticker}?`,candidate.review_note):"";
    if(action==="needs_revision"&&note===null)return;
    if(action==="approve"&&!window.confirm(`Publish the reviewed claims for ${candidate.ticker} and run the active benchmark rule?`))return;
    const key=`${candidate.batch_id}:${candidate.ticker}`;setBusy(key);setError("");setNotice("");
    const response=await authenticatedFetch("/api/admin/dossier-completion",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({batchId:candidate.batch_id,ticker:candidate.ticker,action,note})});
    const body=await response.json() as {status?:string;qualityTier?:string;error?:string};
    if(!response.ok)setError(body.error??`Unable to review ${candidate.ticker}.`);
    else setNotice(action==="approve"?`${candidate.ticker} passed the evidence rule and is now benchmark complete.`:`${candidate.ticker} was returned for revision.`);
    await load();setBusy("");
  }

  return <section className="dossier-completion-admin" id="dossier-completion">
    <header><div><span className="kicker">EVIDENCE-GATED EDITORIAL COMPLETION</span><h2>Benchmark dossier completion</h2><p>Finish the closest source-backed dossiers first, ordered by current market capitalization. Preparing a packet never publishes it; an editor must inspect every claim and exact citation.</p></div><div><button disabled={Boolean(busy)} onClick={()=>void createBatch(30)}>{busy==="batch"?"Preparing…":"Prepare next 30"}</button></div></header>
    {error&&<p className="form-error">{error}</p>}{notice&&<p className="admin-notice">{notice}</p>}
    <div className="dossier-completion-stats"><div><strong>{Number(data?.summary?.benchmark_complete??0).toLocaleString()}</strong><span>Benchmark complete</span></div><div><strong>{Number(data?.summary?.narrative_ready??0).toLocaleString()}</strong><span>Narrative ready</span></div><div><strong>{Number(data?.summary?.machine_enriched??0).toLocaleString()}</strong><span>Machine enriched</span></div><div><strong>{Number(data?.summary?.starting_point??0).toLocaleString()}</strong><span>Source foundation pending</span></div></div>
    <p className="completion-policy-note"><strong>No automatic thesis publishing.</strong> A source count establishes evidence availability; only reviewed claims across the required sections can earn benchmark status. <Link href="/learn/how-to-research-a-stock">Review the owner-research standard →</Link></p>
    {data?.batches[0]&&<div className="completion-batch-heading"><div><small>LATEST BATCH</small><strong>{data.batches[0].id}</strong><span>{label(data.batches[0].status)}</span></div><p>{data.batches[0].approved_count}/{data.batches[0].selected_count} approved · {data.batches[0].needs_revision_count} need revision</p></div>}
    <div className="completion-candidate-list">{visible.map(candidate=>{
      const preview=claims(candidate.claim_preview_json);
      const candidateBusy=busy===`${candidate.batch_id}:${candidate.ticker}`;
      return <details key={`${candidate.batch_id}:${candidate.ticker}`} className={candidate.status}>
        <summary><span><b>#{candidate.priority_rank} · {candidate.ticker}</b><strong>{candidate.name}</strong></span><span><b>{marketCap(candidate.market_cap)}</b><small>{candidate.source_count} sources · {preview.length} claim previews · {label(candidate.status)}</small></span></summary>
        <div className="completion-candidate-body"><div className="completion-candidate-meta"><Link href={`/company/${candidate.ticker.toLowerCase().replaceAll(".","-")}`}>Open current dossier ↗</Link><span>Evidence date {candidate.evidence_date??"pending"}</span><span>Current tier {label(candidate.quality_tier)}</span></div>
          <div className="completion-claim-preview">{preview.map((item,index)=><article key={`${item.section}:${index}`}><header><span>{label(item.section)}</span><em>{label(item.claimType)}</em></header><p>{item.claim}</p><small>{item.whyItMatters}</small><a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceTitle} ↗</a></article>)}</div>
          {candidate.review_note&&<p className="completion-review-note"><strong>Revision note:</strong> {candidate.review_note}</p>}
          <div className="completion-review-actions"><button disabled={candidateBusy||candidate.status==="approved"} onClick={()=>void review(candidate,"approve")}>{candidateBusy?"Saving…":candidate.status==="approved"?"Approved":"Approve benchmark normalization"}</button><button className="secondary" disabled={candidateBusy||candidate.status==="approved"} onClick={()=>void review(candidate,"needs_revision")}>Return for revision</button></div>
        </div>
      </details>;
    })}</div>
    {!visible.length&&<div className="research-foundation-state compact"><strong>No completion batch has been prepared yet.</strong><p>Prepare the next 30 validated, source-backed dossiers to begin editorial review.</p></div>}
  </section>;
}
