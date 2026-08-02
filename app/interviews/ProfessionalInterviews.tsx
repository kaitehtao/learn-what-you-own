"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { authenticatedFetch, loginPath } from "../supabase-browser";

type Interview = { id:number; username:string; guestName:string; guestTitle:string; firm:string; credentials:string; title:string; summary:string; topics:string[]; interviewUrl:string; transcriptUrl:string; disclosure:string; publishedAt:string };
const emptyForm = { guestName:"",guestTitle:"",firm:"",credentials:"",title:"",summary:"",topics:"",interviewUrl:"",transcriptUrl:"",disclosure:"" };

function youtubeId(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./,"");
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? "";
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v") ?? "";
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed","shorts","live"].includes(parts[0] ?? "")) return parts[1] ?? "";
    }
  } catch { return ""; }
  return "";
}

export function ProfessionalInterviews() {
  const [items,setItems] = useState<Interview[]|null>(null);
  const [form,setForm] = useState(emptyForm);
  const [showForm,setShowForm] = useState(false);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  useEffect(()=>{ fetch("/api/professional-interviews").then(async response=>setItems((await response.json() as {interviews:Interview[]}).interviews)).catch(()=>setItems([])); },[]);

  async function submit(event:FormEvent) {
    event.preventDefault();setBusy(true);setMessage("");
    const response = await authenticatedFetch("/api/professional-interviews",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
    if(response.status===401){window.location.href=loginPath("/interviews#professional");return;}
    const result=await response.json() as {error?:string};
    if(!response.ok){setMessage(result.error??"Interview submission failed.");setBusy(false);return;}
    setForm(emptyForm);setShowForm(false);setBusy(false);setMessage("Interview submitted. It will appear publicly after credentials, disclosures, and content are reviewed.");
  }

  return <section id="professional" className="professional-interviews">
    <div className="container">
      <header className="professional-interview-heading"><div><span className="kicker">INVESTOR &amp; CONTRIBUTOR INTERVIEWS</span><h2>Learn from people who study, build, and allocate capital.</h2></div><div><p>Professional investors, analysts, engineers, operators, and subject-matter experts can contribute interviews. This library is separate from issuer-management conversations.</p><button onClick={()=>setShowForm(!showForm)}>{showForm?"Close submission":"Submit an interview →"}</button></div></header>
      <div className="interview-standard"><span>01</span><p><strong>Credentials shown</strong> Relevant experience is reviewed and displayed.</p><span>02</span><p><strong>Conflicts disclosed</strong> Positions, compensation, and business relationships must be stated.</p><span>03</span><p><strong>Editorial approval</strong> Interviews remain private until a moderator approves them.</p></div>
      {message&&<div className="interview-submit-message">{message}</div>}
      {showForm&&<form className="professional-interview-form" onSubmit={submit}><div className="professional-form-intro"><span className="kicker">CONTRIBUTOR SUBMISSION</span><h3>Paste a YouTube link and add the research context.</h3><p>Standard YouTube, youtu.be, Shorts, Live, and embed links are automatically recognized and shown in a privacy-enhanced player after approval.</p></div><div className="professional-form-grid">
        <label>INTERVIEW TITLE<input required minLength={10} maxLength={160} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="How an infrastructure investor evaluates AI data centers"/></label>
        <label>YOUTUBE OR VIDEO LINK<input required type="url" value={form.interviewUrl} onChange={e=>setForm({...form,interviewUrl:e.target.value})} placeholder="https://www.youtube.com/watch?v=…"/><small>YouTube is recommended. Other public HTTPS video links are accepted.</small></label>
        <label>GUEST NAME<input required value={form.guestName} onChange={e=>setForm({...form,guestName:e.target.value})}/></label><label>PROFESSIONAL ROLE<input required value={form.guestTitle} onChange={e=>setForm({...form,guestTitle:e.target.value})} placeholder="Portfolio manager, analyst, engineer…"/></label>
        <label>FIRM / ORGANIZATION <em>optional</em><input value={form.firm} onChange={e=>setForm({...form,firm:e.target.value})}/></label><label>TOPICS <em>comma separated</em><input value={form.topics} onChange={e=>setForm({...form,topics:e.target.value})} placeholder="AI infrastructure, valuation, capital allocation"/></label>
        <label className="wide">RELEVANT CREDENTIALS<textarea required minLength={20} maxLength={1000} value={form.credentials} onChange={e=>setForm({...form,credentials:e.target.value})} placeholder="Explain the experience that qualifies this guest to address the subject."/></label>
        <label className="wide">INTERVIEW SUMMARY<textarea required minLength={60} maxLength={3000} value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})} placeholder="What will an owner learn, and which claims or questions matter most?"/></label>
        <label>TRANSCRIPT LINK <em>optional</em><input type="url" value={form.transcriptUrl} onChange={e=>setForm({...form,transcriptUrl:e.target.value})} placeholder="https://…"/></label><label>POSITION &amp; CONFLICT DISCLOSURE<input required minLength={10} maxLength={1500} value={form.disclosure} onChange={e=>setForm({...form,disclosure:e.target.value})} placeholder="Positions held, compensation, sponsorship, or none."/></label>
      </div>{message&&<p className="form-error">{message}</p>}<button className="submit-contribution" disabled={busy}>{busy?"Submitting…":"Submit for editorial review →"}</button></form>}
      {!items?<div className="professional-interview-state">Loading approved interviews…</div>:items.length===0?<div className="professional-interview-state"><strong>The contributor interview desk is open.</strong><p>Be the first verified member to submit a professional investor or expert conversation for review.</p><button onClick={()=>setShowForm(true)}>Add a YouTube interview</button></div>:<div className="professional-interview-grid">{items.map(item=>{const videoId=youtubeId(item.interviewUrl);return <article key={item.id}>{videoId?<div className="youtube-embed"><iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`} title={item.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/></div>:<a className="interview-video-link" href={item.interviewUrl} target="_blank" rel="noreferrer">Watch interview ↗</a>}<div className="professional-interview-copy"><small>CONTRIBUTED BY <Link href={`/members/${encodeURIComponent(item.username)}`}>@{item.username}</Link></small><h3>{item.title}</h3><strong>{item.guestName} · {item.guestTitle}{item.firm?` · ${item.firm}`:""}</strong><p>{item.summary}</p><div className="interview-topic-list">{item.topics.map(topic=><span key={topic}>{topic}</span>)}</div><details><summary>Credentials and disclosures</summary><p><b>Relevant background:</b> {item.credentials}</p><p><b>Disclosure:</b> {item.disclosure}</p></details>{item.transcriptUrl&&<a href={item.transcriptUrl} target="_blank" rel="noreferrer">Open transcript ↗</a>}</div></article>})}</div>}
    </div>
  </section>;
}
