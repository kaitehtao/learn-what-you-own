"use client";

import { useCallback, useEffect, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Activity = { action:string; destinationType:string; clicks30d:number; clicksAll:number; lastClickAt:string|null };
type Broker = { key:string; name:string; referralActive:boolean; activity:Activity[] };
type Analytics = {
  totals:{ clicks30d:number; accountClicks30d:number; paidReferralClicks30d:number; clicksAll:number };
  brokers:Broker[];
  notice:string;
};

function actionClicks(activity: Activity[], action: string) {
  return activity.filter((row) => row.action === action).reduce((total, row) => total + row.clicks30d, 0);
}

export function BrokerageAnalytics() {
  const [data, setData] = useState<Analytics|null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await authenticatedFetch("/api/admin/brokerage-analytics");
    if (response.status === 401) return void window.location.replace(loginPath("/admin"));
    const result = await response.json() as Analytics & { error?:string };
    if (!response.ok) return void setError(result.error ?? "Unable to load brokerage traffic.");
    setData(result); setError("");
  }, []);

  useEffect(() => {
    let active = true;
    authenticatedFetch("/api/admin/brokerage-analytics").then(async (response) => {
      if (response.status === 401 && active) return void window.location.replace(loginPath("/admin"));
      const result = await response.json() as Analytics & { error?:string };
      if (!active) return;
      if (!response.ok) setError(result.error ?? "Unable to load brokerage traffic.");
      else setData(result);
    }).catch((caught) => active && setError(caught instanceof Error ? caught.message : "Unable to load brokerage traffic."));
    return () => { active = false; };
  }, []);

  return <section className="admin-brokerage-analytics" id="brokerage-referrals">
    <header><div><span className="kicker">BROKERAGE REFERRALS</span><h2>Outbound traffic and partner readiness</h2><p>Track member interest without collecting brokerage credentials, holdings, IP addresses, or user-agent fingerprints.</p></div><button onClick={()=>void load()}>Refresh traffic</button></header>
    {error && <div className="admin-error">{error}</div>}
    {!data ? <div className="admin-brokerage-loading">{error || "Loading brokerage traffic…"}</div> : <>
      <div className="brokerage-analytics-metrics">
        <div><small>CLICKS · 30 DAYS</small><strong>{data.totals.clicks30d}</strong><span>{data.totals.clicksAll} all time</span></div>
        <div><small>ACCOUNT-OPENING CLICKS</small><strong>{data.totals.accountClicks30d}</strong><span>Last 30 days</span></div>
        <div><small>PAID-REFERRAL CLICKS</small><strong>{data.totals.paidReferralClicks30d}</strong><span>Approved partner URLs only</span></div>
        <div><small>ACTIVE PROGRAMS</small><strong>{data.brokers.filter((broker)=>broker.referralActive).length}</strong><span>of {data.brokers.length} brokerages</span></div>
      </div>
      <div className="brokerage-analytics-table">
        <div className="brokerage-analytics-labels"><span>BROKERAGE</span><span>LOGIN CLICKS</span><span>ACCOUNT CLICKS</span><span>PARTNER STATUS</span></div>
        {data.brokers.map((broker) => <div className="brokerage-analytics-row" key={broker.key}><strong data-label="Brokerage">{broker.name}</strong><span data-label="Login clicks">{actionClicks(broker.activity,"login")} <small>30d</small></span><span data-label="Account clicks">{actionClicks(broker.activity,"open")} <small>30d</small></span><b data-label="Partner status" className={broker.referralActive ? "active" : "pending"}>{broker.referralActive ? "Paid link active" : "Approval / URL needed"}</b></div>)}
      </div>
      <p className="brokerage-analytics-notice">{data.notice} Actual conversions and compensation must be reconciled from each brokerage or affiliate network&apos;s reporting portal.</p>
    </>}
  </section>;
}
