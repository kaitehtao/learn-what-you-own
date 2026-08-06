"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Batch = { id:string;selected_count:number;success_count:number;skipped_count:number;error_count:number;source_count_added:number;status:string;started_at:string;completed_at:string|null;is_superseded_diagnostic:number };
type Item = { batch_id:string;ticker:string;status:string;source_count_after:number;facts_import_status:string;error_message:string };
type Coverage = { russell_3000_total:number;russell_3000_zero_sources:number;russell_2000_total:number;russell_2000_zero_sources:number };
type Payload = { batches:Batch[];items:Item[];coverage:Coverage|null;error?:string };

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
    const body=await response.json() as {batchId?:string;selected?:number;completed?:number;skipped?:number;errors?:number;sourcesAdded?:number;error?:string};
    if(!response.ok)setError(body.error??"Unable to run the SEC source backfill.");
    else setNotice(body.batchId?`${body.batchId}: ${body.completed??0} companies sourced, ${body.sourcesAdded??0} exact SEC filings added, ${body.skipped??0} skipped, ${body.errors??0} errors.`:"No eligible zero-source Russell 3000 companies remain.");
    await load();setBusy(false);
  }
  return <section className="source-backfill-admin" id="source-backfill">
    <header><div><span className="kicker">RUSSELL 3000 · INITIAL EVIDENCE</span><h2>SEC source backfill</h2><p>A single deduplicated pass covers the Russell 2000 subset. Every completed batch records its ticker list, exact SEC accession links, Company Facts outcome, and errors.</p></div><div><button disabled={busy} onClick={()=>void run(12)}>{busy?"Running…":"Run 12 now"}</button><button disabled={busy} onClick={()=>void run(25)}>Run 25 now</button></div></header>
    {error&&<p className="form-error">{error}</p>}{notice&&<p className="admin-notice">{notice}</p>}
    <div className="source-backfill-stats"><div><strong>{Number(data?.coverage?.russell_3000_zero_sources??0).toLocaleString()}</strong><span>Russell 3000 zero-source</span></div><div><strong>{Number(data?.coverage?.russell_2000_zero_sources??0).toLocaleString()}</strong><span>Russell 2000 zero-source</span></div><div><strong>{Number(data?.batches.reduce((total,batch)=>total+Number(batch.success_count),0)??0).toLocaleString()}</strong><span>Companies sourced in recorded batches</span></div><div><strong>{Number(data?.batches.reduce((total,batch)=>total+Number(batch.source_count_added),0)??0).toLocaleString()}</strong><span>Exact filings added</span></div></div>
    <div className="source-backfill-admin-batches">{data?.batches.map(batch=>{
      const superseded=Boolean(batch.is_superseded_diagnostic);
      return <details key={batch.id} className={superseded?"superseded-diagnostic":undefined}><summary><span><strong>{batch.id}</strong><small>{superseded?"Superseded diagnostic run · inactive":`${label(batch.status)} · ${batch.success_count}/${batch.selected_count} sourced`}</small></span><span>{superseded?"Superseded by a later successful batch":`${batch.source_count_added} filings · ${batch.error_count} errors`}</span></summary><div>{(itemsByBatch.get(batch.id)??[]).map(item=><Link href={`/company/${item.ticker.toLowerCase().replaceAll(".","-")}`} key={`${batch.id}-${item.ticker}`} className={item.status}><strong>{item.ticker}</strong><span>{label(item.status)}</span><small>{item.source_count_after} sources · facts {label(item.facts_import_status)}</small>{item.error_message&&<em>{item.error_message}</em>}</Link>)}</div></details>;
    })}</div>
  </section>;
}
