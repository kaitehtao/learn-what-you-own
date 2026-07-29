"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "../ui";

const initialItems=[
  {type:"Correction",title:"Recurring revenue classification may be overstated",source:"Contributor · Rail systems analyst",status:"Needs review"},
  {type:"Filing update",title:"New quarterly filing ready for claim extraction",source:"SEC EDGAR · Primary source",status:"AI draft ready"},
  {type:"Claim",title:"Recurring missions are the key operating metric",source:"Owner’s Interview · Management assertion",status:"Needs evidence"},
];

export default function Admin(){
  const [items,setItems]=useState(initialItems);
  const [published,setPublished]=useState(false);
  function approve(index:number){setItems(items.filter((_,i)=>i!==index));setPublished(true)}
  return <main><Header/><section className="admin-shell"><aside className="admin-nav"><span className="kicker">EDITORIAL DESK</span><strong>Learn What You Own</strong>{["Review queue","Companies","Documents","Claims","Research reports","Interviews","Corrections","Users"].map((x,i)=><button className={i===0?"active":""} key={x}>{x}<span>{i===0?items.length:""}</span></button>)}<Link href="/company/onds">← Public dossier</Link></aside>
    <article className="admin-main"><div className="admin-heading"><div><span className="kicker">EDITORIAL REVIEW</span><h1>Source verification queue</h1><p>Nothing reaches a public dossier without provenance, classification, and human review.</p></div><button>+ Add document</button></div>
    {published&&<div className="publish-notice">✓ Update approved. The public dossier changelog is ready to be refreshed.</div>}
    <div className="admin-stats"><div><small>AWAITING REVIEW</small><strong>{items.length}</strong></div><div><small>MISSING CITATIONS</small><strong>1</strong></div><div><small>DISPUTED CLAIMS</small><strong>2</strong></div><div><small>PUBLISHED TODAY</small><strong>{published?1:0}</strong></div></div>
    <div className="queue-table"><div className="queue-labels"><span>ITEM</span><span>SOURCE</span><span>STATUS</span><span>ACTION</span></div>{items.map((item,index)=><div className="queue-row" key={item.title}><span><em>{item.type}</em><strong>{item.title}</strong></span><span>{item.source}</span><span className="queue-status">{item.status}</span><span><button onClick={()=>approve(index)}>Review</button></span></div>)}</div>
    {items.length===0&&<div className="queue-empty">All caught up. Every submitted item has been reviewed.</div>}
    <div className="workflow-map"><span>SUBMITTED</span><i>→</i><span>SOURCE CHECKED</span><i>→</i><span>CLAIM CLASSIFIED</span><i>→</i><span>EDITOR APPROVED</span><i>→</i><span>PUBLISHED</span></div>
    </article></section></main>
}
