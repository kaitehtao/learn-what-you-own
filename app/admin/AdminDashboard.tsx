"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Role = "member" | "contributor" | "editor" | "admin";
type Member = { id:string; username:string; displayName:string; role:Role; onboardingComplete:boolean; email:string; verified:boolean; confirmationSentAt:string|null; createdAt:string; lastSignInAt:string|null; credentialSummary:string; credentialStatus:string; hasProfessionalLinks:boolean; linksStatus:string };
type DailyMetric = { date:string; visitors:number; pageViews:number };
type TopPage = { path:string; visitors:number; pageViews:number };
type Audit = { id:number; action:string; detail:Record<string,unknown>; created_at:string };
type Dashboard = {
  stats:{ totalAccounts:number; verifiedAccounts:number; accounts7d:number; accounts30d:number; administrators:number };
  visitors:{ visitorsToday:number; visitors7d:number; pageViewsToday:number; pageViews7d:number; daily:DailyMetric[]; topPages:TopPage[] };
  signupSeries:Array<{date:string;signups:number}>;
  members:Member[];
  audit:Audit[];
};

const roles: Role[] = ["member", "contributor", "editor", "admin"];
const shortDate = (value:string|null) => value ? new Date(value).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}) : "Never";

export function AdminDashboard() {
  const [data,setData] = useState<Dashboard|null>(null);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [busy,setBusy] = useState("");
  const [search,setSearch] = useState("");
  const [invite,setInvite] = useState({email:"",username:"",displayName:""});

  const load = useCallback(async () => {
    const response = await authenticatedFetch("/api/admin/dashboard");
    if (response.status === 401) return void window.location.replace(loginPath("/admin"));
    const result = await response.json() as Dashboard & {error?:string};
    if (!response.ok) { setError(result.error ?? "Unable to load administrator dashboard."); return; }
    setData(result); setError("");
  },[]);

  useEffect(()=>{
    let active = true;
    authenticatedFetch("/api/admin/dashboard").then(async response => {
      if (response.status === 401 && active) return void window.location.replace(loginPath("/admin"));
      const result = await response.json() as Dashboard & {error?:string};
      if (!active) return;
      if (!response.ok) setError(result.error ?? "Unable to load administrator dashboard.");
      else setData(result);
    }).catch(caught => active && setError(caught instanceof Error ? caught.message : "Unable to load administrator dashboard."));
    return () => { active = false; };
  },[]);

  const filtered = useMemo(()=>data?.members.filter(member => `${member.username} ${member.displayName} ${member.email}`.toLowerCase().includes(search.toLowerCase())) ?? [],[data,search]);
  const chart = useMemo(()=>{
    if (!data) return [];
    const signups = new Map(data.signupSeries.map(day=>[day.date,day.signups]));
    const max = Math.max(1,...data.visitors.daily.flatMap(day=>[day.visitors,signups.get(day.date)??0]));
    return data.visitors.daily.map(day=>({...day,signups:signups.get(day.date)??0,max}));
  },[data]);

  async function inviteMember(event:FormEvent) {
    event.preventDefault(); setBusy("invite"); setError(""); setNotice("");
    const response = await authenticatedFetch("/api/admin/dashboard",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(invite)});
    const result = await response.json() as {error?:string};
    if (!response.ok) setError(result.error ?? "Unable to send invitation.");
    else { setNotice(`Invitation sent to ${invite.email}.`); setInvite({email:"",username:"",displayName:""}); await load(); }
    setBusy("");
  }

  async function changeRole(member:Member,role:Role) {
    if (member.role===role) return;
    if (!window.confirm(`Change @${member.username} from ${member.role} to ${role}?`)) return;
    setBusy(member.id); setError(""); setNotice("");
    const response = await authenticatedFetch("/api/admin/dashboard",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({userId:member.id,role})});
    const result = await response.json() as {error?:string};
    if (!response.ok) setError(result.error ?? "Unable to update role.");
    else { setNotice(`@${member.username} is now ${role}.`); await load(); }
    setBusy("");
  }

  async function resendVerification(member:Member) {
    if (!window.confirm(`Resend the verification email to ${member.email}?`)) return;
    setBusy(`resend:${member.id}`); setError(""); setNotice("");
    const response = await authenticatedFetch("/api/admin/dashboard",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"resend_verification",userId:member.id})});
    const result = await response.json() as {error?:string};
    if (!response.ok) setError(result.error ?? "Unable to resend the verification email.");
    else { setNotice(`Verification email resent to ${member.email}.`); await load(); }
    setBusy("");
  }

  async function manuallyVerify(member:Member) {
    const confirmation = window.prompt(`Manual verification bypasses the user's email confirmation link. Type ${member.email} exactly to verify this account.`);
    if (!confirmation) return;
    setBusy(`verify:${member.id}`); setError(""); setNotice("");
    const response = await authenticatedFetch("/api/admin/dashboard",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({action:"confirm_email",userId:member.id,confirmation})});
    const result = await response.json() as {error?:string};
    if (!response.ok) setError(result.error ?? "Unable to verify the account.");
    else { setNotice(`${member.email} is now verified.`); await load(); }
    setBusy("");
  }

  async function reviewPublicProfile(member:Member,action:"verify_credentials"|"approve_links"|"reject_links") {
    const label = action === "verify_credentials" ? "verify these credentials" : action === "approve_links" ? "approve these professional links" : "reject these professional links";
    if (!window.confirm(`Are you sure you want to ${label} for @${member.username}?`)) return;
    setBusy(`${action}:${member.id}`); setError(""); setNotice("");
    const response = await authenticatedFetch("/api/admin/dashboard",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({action,userId:member.id})});
    const result = await response.json() as {error?:string};
    if (!response.ok) setError(result.error ?? "Unable to review this public profile.");
    else { setNotice(`@${member.username}'s public profile review was updated.`); await load(); }
    setBusy("");
  }

  async function deleteMember(member:Member) {
    const confirmation = window.prompt(`This permanently deletes @${member.username} and their private member data. Type DELETE @${member.username} to continue.`);
    if (!confirmation) return;
    setBusy(member.id); setError(""); setNotice("");
    const response = await authenticatedFetch("/api/admin/dashboard",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({userId:member.id,confirmation})});
    if (!response.ok) {
      const result = await response.json() as {error?:string}; setError(result.error ?? "Unable to delete account.");
    } else { setNotice(`@${member.username} was deleted.`); await load(); }
    setBusy("");
  }

  if (!data) return <section className="admin-dashboard" id="overview"><div className="admin-loading">{error||"Loading administrator dashboard…"}</div></section>;
  return <section className="admin-dashboard" id="overview">
    <header className="admin-dashboard-heading"><div><span className="kicker">ADMINISTRATOR CONTROL CENTER</span><h1>Audience and accounts</h1><p>Monitor adoption, invite members, manage privileges, and protect the community.</p></div><button onClick={()=>void load()}>Refresh data</button></header>
    {error&&<div className="admin-error">{error}</div>}{notice&&<div className="publish-notice">✓ {notice}</div>}
    <div className="admin-metric-grid">
      <div><small>VISITORS TODAY</small><strong>{data.visitors.visitorsToday}</strong><span>{data.visitors.pageViewsToday} page views</span></div>
      <div><small>VISITORS · 7 DAYS</small><strong>{data.visitors.visitors7d}</strong><span>{data.visitors.pageViews7d} page views</span></div>
      <div><small>TOTAL ACCOUNTS</small><strong>{data.stats.totalAccounts}</strong><span>{data.stats.verifiedAccounts} verified</span></div>
      <div><small>NEW · 30 DAYS</small><strong>{data.stats.accounts30d}</strong><span>{data.stats.accounts7d} in the last 7 days</span></div>
      <div><small>ADMINISTRATORS</small><strong>{data.stats.administrators}</strong><span>Protected privileged accounts</span></div>
    </div>
    <div className="admin-insight-grid">
      <article className="admin-activity-chart"><header><div><small>14-DAY ACTIVITY</small><h2>Visitors and registrations</h2></div><div className="admin-chart-legend"><span>Visitors</span><span>Signups</span></div></header><div className="admin-bars">{chart.map(day=><div key={day.date} title={`${day.date}: ${day.visitors} visitors, ${day.signups} signups`}><div className="admin-bar-pair"><i style={{height:`${Math.max(day.visitors?8:0,day.visitors/day.max*100)}%`}}/><i style={{height:`${Math.max(day.signups?8:0,day.signups/day.max*100)}%`}}/></div><time>{new Date(`${day.date}T00:00:00Z`).toLocaleDateString(undefined,{month:"numeric",day:"numeric",timeZone:"UTC"})}</time></div>)}</div></article>
      <article className="admin-top-pages"><header><small>LAST 7 DAYS</small><h2>Most visited pages</h2></header>{data.visitors.topPages.length?data.visitors.topPages.map(page=><div key={page.path}><code>{page.path}</code><span><strong>{page.pageViews}</strong> views · {page.visitors} visitors</span></div>):<p>Visitor tracking starts with this release; no historical browser sessions are backfilled.</p>}</article>
    </div>
    <section className="admin-account-section" id="accounts"><header><div><span className="kicker">ACCOUNT OPERATIONS</span><h2>Members</h2><p>Invite by email, verify pending accounts, update roles, or permanently remove an account.</p></div><label>SEARCH<input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Username, name, or email"/></label></header>
      <form className="admin-invite-form" onSubmit={inviteMember}><label>EMAIL<input required type="email" value={invite.email} onChange={event=>setInvite({...invite,email:event.target.value})} placeholder="new.member@example.com"/></label><label>USERNAME <em>optional</em><input minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" value={invite.username} onChange={event=>setInvite({...invite,username:event.target.value})} placeholder="owner_researcher"/></label><label>DISPLAY NAME <em>optional</em><input maxLength={80} value={invite.displayName} onChange={event=>setInvite({...invite,displayName:event.target.value})} placeholder="Member name"/></label><button disabled={busy==="invite"}>{busy==="invite"?"Sending…":"Invite member →"}</button></form>
      <div className="admin-member-table"><div className="admin-member-labels"><span>MEMBER</span><span>STATUS &amp; VERIFICATION</span><span>JOINED / LAST ACTIVE</span><span>ROLE</span><span>ACTION</span></div>{filtered.map(member=>{
        const memberBusy = busy.includes(member.id);
        return <div className="admin-member-row" key={member.id}><span><strong>@{member.username}</strong><small>{member.displayName||"No display name"}</small><em>{member.email}</em></span><span><b className={member.verified?"verified":"pending"}>{member.verified?"Email verified":"Email pending"}</b><small>{member.onboardingComplete?"Onboarded":"Needs onboarding"}</small>{!member.verified&&<div className="admin-verification-actions"><button disabled={memberBusy} onClick={()=>void resendVerification(member)}>{busy===`resend:${member.id}`?"Sending…":"Resend email"}</button><button disabled={memberBusy} onClick={()=>void manuallyVerify(member)}>{busy===`verify:${member.id}`?"Verifying…":"Verify manually"}</button><small>Last sent: {shortDate(member.confirmationSentAt)}</small></div>}<div className="admin-profile-review"><small>Credentials: {member.credentialStatus}</small>{member.credentialSummary&&member.credentialStatus!=="verified"&&<button disabled={memberBusy} onClick={()=>void reviewPublicProfile(member,"verify_credentials")}>Verify credentials</button>}<small>Links: {member.linksStatus}</small>{member.hasProfessionalLinks&&member.linksStatus!=="approved"&&<><button disabled={memberBusy} onClick={()=>void reviewPublicProfile(member,"approve_links")}>Approve links</button><button disabled={memberBusy} onClick={()=>void reviewPublicProfile(member,"reject_links")}>Reject</button></>}</div></span><span><strong>{shortDate(member.createdAt)}</strong><small>{shortDate(member.lastSignInAt)}</small></span><span><select aria-label={`Role for ${member.username}`} disabled={memberBusy} value={member.role} onChange={event=>void changeRole(member,event.target.value as Role)}>{roles.map(role=><option key={role}>{role}</option>)}</select></span><span><button className="admin-delete-account" disabled={memberBusy} onClick={()=>void deleteMember(member)}>Delete</button></span></div>;
      })}</div>
      {!filtered.length&&<div className="queue-empty">No accounts match that search.</div>}
    </section>
    <section className="admin-audit" id="audit"><header><span className="kicker">PRIVILEGED ACTIONS</span><h2>Account audit log</h2></header>{data.audit.length?data.audit.map(entry=><div key={entry.id}><strong>{entry.action.replaceAll("_"," ")}</strong><span>{String(entry.detail.username??entry.detail.email??"Member account")}</span><time>{shortDate(entry.created_at)}</time></div>):<p>No administrator account actions have been recorded yet.</p>}</section>
    <p className="admin-privacy-note">Visitor counts use a random first-party browser identifier, respect Do Not Track, and store no IP address or user-agent fingerprint. Counts represent browsers, not identified people.</p>
  </section>;
}
