"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../ui";

export default function Watchlist(){
  const [watching,setWatching]=useState<boolean|null>(null);
  useEffect(()=>setWatching(window.localStorage.getItem("lwyo-watch-onds")==="true"),[]);
  function add(){window.localStorage.setItem("lwyo-watch-onds","true");setWatching(true)}
  function remove(){window.localStorage.setItem("lwyo-watch-onds","false");setWatching(false)}
  return <main><Header/><section className="watchlist-hero"><div className="container"><span className="kicker">YOUR WATCHLIST</span><h1>Follow understanding,<br/>not price movement.</h1><p>Only the filings, thesis changes, management statements, and new evidence that matter to businesses you follow.</p></div></section>
    <section className="container watchlist-section">
      {watching===false&&<div className="empty-watchlist"><span>LW</span><h2>Your research watchlist is empty.</h2><p>Add ONDS to preview how the product tracks thesis-relevant changes instead of price alerts.</p><button onClick={add}>+ Add ONDS to watchlist</button></div>}
      {watching&&<><div className="watchlist-summary"><div><small>WATCHED COMPANIES</small><strong>1</strong></div><div><small>NEW SINCE LAST VISIT</small><strong>3</strong></div><div><small>NEEDS ATTENTION</small><strong className="amber-text">1</strong></div><div><small>NEXT EARNINGS</small><strong>Aug 12</strong></div></div>
      <div className="watch-company-head"><div className="company-cell"><i>ON</i><span><strong>Ondas Holdings</strong><small>NASDAQ · ONDS</small></span></div><div><span className="dossier-health">82% complete</span><button onClick={remove}>Remove</button></div></div>
      <div className="watch-updates">
        <Link href="/company/onds#changes"><span className="watch-date">TODAY</span><span className="watch-kind bullish-tag">THESIS</span><div><strong>Defense program opportunity expanded</strong><p>The bull case strengthened, but timing and program economics remain unverified.</p></div><em>Review →</em></Link>
        <Link href="/company/onds#financials"><span className="watch-date">TODAY</span><span className="watch-kind filing-kind">FILING</span><div><strong>Balance-sheet runway reassessed</strong><p>New assumptions increased the importance of near-term program conversion.</p></div><em>Review →</em></Link>
        <Link href="/interviews"><span className="watch-date">YESTERDAY</span><span className="watch-kind interview-kind">INTERVIEW</span><div><strong>One new management claim needs evidence</strong><p>Editors are seeking independent support for the recurring-missions KPI.</p></div><em>Review →</em></Link>
      </div></>}
    </section>
  </main>
}
