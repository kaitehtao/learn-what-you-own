"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type EventRow = {
  id:number;accession_number:string;form:string;filing_date:string;report_date:string;source_url:string;
  event_type:string;materiality_reason:string;review_focus_json:string;facts_refresh_status:string;
  facts_refresh_detail:string;editorial_summary:string;detected_at:string;
};
type ReviewPackage = {
  ticker:string;name:string;review_period:string;event_count:number;latest_filing_date:string;
  oldest_detected_at:string;priority_score:number;forms:string;events_json:string;
};
type RolloutMember = {ticker:string;priority_rank:number;workflow_status:string;source_count:number;name:string;market_cap:number|null;quality_tier:string};
type QueueResponse = {
  packages:ReviewPackage[];
  statusCounts:Array<{status:string;count:number}>;
  packageCounts:Array<{status:string;count:number}>;
  checks:{monitored:number;errors:number;oldest_success:string|null;latest_success:string|null}|null;
  rollout:{batch:{universe_name:string;selection_rule:string;target_count:number;status:string};progress:{total:number;benchmark_complete:number;evidence_ready:number;evidence_ingestion:number;research_backlog:number}|null;members:RolloutMember[]}|null;
  error?:string;
};
const eventLabel=(value:string)=>value.replaceAll("_"," ").replace(/\b\w/g,(letter)=>letter.toUpperCase());

function packageEvents(reviewPackage: ReviewPackage) {
  try { return JSON.parse(reviewPackage.events_json) as EventRow[]; } catch { return []; }
}

export function FreshnessQueue(){
  const [data,setData]=useState<QueueResponse|null>(null);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState("");
  const load=useCallback(async()=>{const response=await authenticatedFetch("/api/admin/freshness");if(response.status===401)return void window.location.replace(loginPath("/admin"));const body=await response.json() as QueueResponse;if(!response.ok)setError(body.error??"Unable to load filing freshness.");else{setData(body);setError("");}},[]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer);},[load]);
  const counts=useMemo(()=>new Map(data?.statusCounts.map(row=>[row.status,Number(row.count)])??[]),[data]);
  const packageCounts=useMemo(()=>new Map(data?.packageCounts.map(row=>[row.status,Number(row.count)])??[]),[data]);

  async function runNow(){
    setBusy("scan");setError("");
    const response=await authenticatedFetch("/api/admin/freshness",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({limit:10})});
    const body=await response.json() as {detected?:number;processed?:number;error?:string};
    if(!response.ok)setError(body.error??"Unable to run freshness scan.");else{setNotice(`Scanned ${body.processed??0} dossiers and detected ${body.detected??0} new filing events.`);await load();}
    setBusy("");
  }

  return <section className="freshness-admin" id="freshness"><header><div><span className="kicker">AUTOMATED DOSSIER FRESHNESS</span><h2>Automatic SEC filing updates</h2><p>Every detected earnings release, periodic report, definitive proxy, and material 8-K is added automatically with its exact EDGAR link. Filed facts refresh without approval. Human review is reserved for separate thesis and interpretation changes.</p></div><button disabled={Boolean(busy)} onClick={()=>void runNow()}>{busy==="scan"?"Scanning…":"Scan next 10 now"}</button></header>
    <div className="freshness-stats"><div><strong>{data?.checks?.monitored??0}</strong><span>Dossiers monitored</span></div><div><strong>{packageCounts.get("published")??0}</strong><span>Published packages</span></div><div><strong>{counts.get("published")??0}</strong><span>Automatically added filings</span></div><div><strong>{data?.checks?.errors??0}</strong><span>Scan errors</span></div></div>
    {data?.rollout&&<details className="rollout-batch"><summary><strong>Russell 2000 · full-universe dossier program</strong><span>{Number(data.rollout.progress?.total??data.rollout.batch.target_count).toLocaleString()} tracked · {Number(data.rollout.progress?.benchmark_complete??0).toLocaleString()} benchmark complete</span></summary><p>{data.rollout.batch.selection_rule} A candidate is not called complete until it passes the same evidence benchmark as the flagship dossiers. Showing the next 100 ranked records.</p><div className="rollout-member-grid">{data.rollout.members.map(member=><div key={member.ticker}><b>#{member.priority_rank} {member.ticker}</b><span>{member.name}</span><small>{eventLabel(member.workflow_status)} · {member.source_count} sources · {eventLabel(member.quality_tier)}</small></div>)}</div></details>}
    {error&&<p className="form-error">{error}</p>}{notice&&<p className="form-notice">{notice}</p>}
    <div className="freshness-list">{data?.packages.map(reviewPackage=>{
      const events=packageEvents(reviewPackage);
      const packageKey=`${reviewPackage.ticker}:${reviewPackage.review_period}`;
      return <article key={packageKey} className="freshness-item published"><header><div><strong>{reviewPackage.ticker}</strong><span>{reviewPackage.forms}</span><em>Automatically published</em><em>{reviewPackage.event_count} {reviewPackage.event_count===1?"filing":"related filings"}</em></div><time>{reviewPackage.latest_filing_date}</time></header><h3>{reviewPackage.name} · period {reviewPackage.review_period}</h3>
        <div className="freshness-package-events">{events.map(event=><details key={event.id}><summary><span>{event.form} · {event.filing_date}</span><em>{eventLabel(event.event_type)}</em></summary><p>{event.materiality_reason}</p><small>FACTS: {event.facts_refresh_status.replaceAll("_"," ")}{event.facts_refresh_detail?` · ${event.facts_refresh_detail}`:""}</small><ul>{(JSON.parse(event.review_focus_json||"[]") as string[]).map(focus=><li key={focus}>{focus}</li>)}</ul><a href={event.source_url} target="_blank" rel="noreferrer">Open exact SEC filing ↗</a></details>)}</div>
      </article>;
    })}{data&&!data.packages.length&&<p className="research-foundation-state compact">No automatic filing updates have been detected yet.</p>}</div>
  </section>;
}
