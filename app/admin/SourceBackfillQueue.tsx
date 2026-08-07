"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Batch = { id:string;selected_count:number;success_count:number;skipped_count:number;error_count:number;source_count_added:number;status:string;started_at:string;completed_at:string|null;is_superseded_diagnostic:number };
type Item = { batch_id:string;ticker:string;status:string;source_count_after:number;facts_import_status:string;error_message:string };
type Coverage = { russell_3000_total:number;russell_3000_zero_sources:number;russell_2000_total:number;russell_2000_zero_sources:number };
type Operations = {queued:number;running:number;errors_24h:number;completed_1h:number;oldest_pending:string|null};
type Payload = { batches:Batch[];items:Item[];coverage:Coverage|null;operations:Operations|null;error?:string };

function label(value: string) {
  return value.replaceAll("_", " ");
}

export function SourceBackfillQueue() {
  const [data,setData]=useState<Payload|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const load=useCallback(async()=>{
    const response=await authenticatedFetch("/api/admin/source-backfill");
    if(response.status===401)return void window.location.replace(loginPath("/admin"));
    const body=await response.json() as Payload;
    if(!response.ok)setError(body.error??"Unable to load source backfill progress.");else{setData(body);setError("");}
  },[]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer);},[load]);
  const itemsByBatch=useMemo(()=>{
    const grouped=new Map<string,Item[]>();
    for(const item of data?.items??[])grouped.set(item.batch_id,[...(grouped.get(item.batch_id)??[]),item]);
    return grouped;
  },[data?.items]);
  async function run(limit:number){
    setBusy(true);setError("");setNotice("");
    const response=await authenticatedFetch("/api/admin/source-backfill",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({limit})});
    const body=await response.json() as {batchId?:string;selected?:number;queued?:number;reason?:string;error?:string};
    if(!response.ok)setError(body.error??"Unable to run the SEC source backfill.");
    else setNotice(body.batchId?`${body.batchId}: ${body.queued??body.selected??0} ticker jobs added to the durable ingestion queue.`:body.reason==="selection_lease_active"?"Another scheduler is selecting the next source batch; no duplicate jobs were created.":"No eligible Russell 3000 companies with fewer than five sources remain.");
    await load();setBusy(false);
  }
  return <section className="source-backfill-admin" id="source-backfill">
    <header><div><span className="kicker">RUSSELL 3000 · DURABLE EVIDENCE INGESTION</span><h2>SEC source backfill</h2><p>Each ticker is an independent Cloudflare Queue job with bounded concurrency, retry backoff, and a D1 audit ledger. A dossier stays private until at least five exact SEC sources are available.</p></div><div><button disabled={busy} onClick={()=>void run(12)}>{busy?"Queueing…":"Queue 12"}</button><button disabled={busy} onClick={()=>void run(25)}>Queue 25</button></div></header>
    {error&&<p className="form-error">{error}</p>}{notice&&<p className="admin-notice">{notice}</p>}
    <div className="source-backfill-stats"><div><strong>{Number(data?.operations?.queued??0).toLocaleString()}</strong><span>Queued ticker jobs</span></div><div><strong>{Number(data?.operations?.running??0).toLocaleString()}</strong><span>Running ticker jobs</span></div><div><strong>{Number(data?.operations?.completed_1h??0).toLocaleString()}</strong><span>Completed in one hour</span></div><div><strong>{Number(data?.operations?.errors_24h??0).toLocaleString()}</strong><span>Terminal errors in 24h</span></div></div>
    <p className="source-backfill-coverage-note">Coverage remaining: {Number(data?.coverage?.russell_3000_zero_sources??0).toLocaleString()} Russell 3000 and {Number(data?.coverage?.russell_2000_zero_sources??0).toLocaleString()} Russell 2000 companies have zero sources. Oldest pending job: {data?.operations?.oldest_pending??"none"}.</p>
    <div className="source-backfill-admin-batches">{data?.batches.map(batch=>{
      const superseded=Boolean(batch.is_superseded_diagnostic);
      return <details key={batch.id} className={superseded?"superseded-diagnostic":undefined}><summary><span><strong>{batch.id}</strong><small>{superseded?"Superseded diagnostic run · inactive":`${label(batch.status)} · ${batch.success_count}/${batch.selected_count} sourced`}</small></span><span>{superseded?"Superseded by a later successful batch":`${batch.source_count_added} filings · ${batch.error_count} errors`}</span></summary><div>{(itemsByBatch.get(batch.id)??[]).map(item=><Link href={`/company/${item.ticker.toLowerCase().replaceAll(".","-")}`} key={`${batch.id}-${item.ticker}`} className={item.status}><strong>{item.ticker}</strong><span>{label(item.status)}</span><small>{item.source_count_after} sources · facts {label(item.facts_import_status)}</small>{item.error_message&&<em>{item.error_message}</em>}</Link>)}</div></details>;
    })}</div>
  </section>;
}
