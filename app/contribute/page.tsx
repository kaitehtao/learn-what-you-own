"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Header } from "../ui";

const contributionTypes = ["Factual correction","Thesis update","Industry observation","Competitive analysis","Financial model","Question for management"];

export default function Contribute(){
  const [type,setType]=useState(contributionTypes[0]);
  const [submitted,setSubmitted]=useState(false);
  function submit(event:FormEvent){event.preventDefault();setSubmitted(true);}
  return <main><Header/><section className="contribute-hero"><div className="container"><span className="kicker">COMMUNITY INTELLIGENCE</span><h1>Contribute evidence,<br/>not another opinion.</h1><p>Every submission is structured, sourced, disclosed, and reviewed before it becomes part of a company’s permanent record.</p></div></section>
    <section className="container contribute-layout">
      <aside><span className="kicker">CONTRIBUTION TYPES</span>{contributionTypes.map((item,index)=><button className={type===item?"active":""} onClick={()=>setType(item)} key={item}><span>0{index+1}</span>{item}</button>)}<div className="contributor-standard"><strong>The contribution standard</strong><p>Be specific. Cite primary evidence. Separate fact from interpretation. Disclose your position and conflicts.</p></div></aside>
      <article>
        {!submitted ? <form onSubmit={submit}>
          <div className="form-heading"><span>Draft contribution</span><em>Editorial review required</em></div>
          <div className="form-grid">
            <label>COMPANY<select required defaultValue="ONDS"><option>ONDS — Ondas Holdings</option><option>NVDA — NVIDIA</option><option>BB — BlackBerry</option></select></label>
            <label>CONTRIBUTION TYPE<select value={type} onChange={(e)=>setType(e.target.value)}>{contributionTypes.map(item=><option key={item}>{item}</option>)}</select></label>
          </div>
          <label>MAIN CLAIM OR CORRECTION<textarea required placeholder="State one specific, verifiable claim. Example: The dossier overstates the recurring nature of autonomous-systems revenue." /></label>
          <label>WHY IT MATTERS<textarea required placeholder="Explain how this evidence changes—or does not change—the owner’s understanding." /></label>
          <div className="form-grid">
            <label>SOURCE URL<input required type="url" placeholder="https://sec.gov/..." /></label>
            <label>DATE OF EVIDENCE<input required type="date" /></label>
            <label>CONFIDENCE<select><option>High — direct primary evidence</option><option>Medium — supported inference</option><option>Low — question for review</option></select></label>
            <label>TIME HORIZON<select><option>Current fact</option><option>Next 12 months</option><option>Long term</option></select></label>
          </div>
          <label>RELEVANT EXPERTISE<input placeholder="e.g. Rail communications engineer, independent investor" /></label>
          <div className="disclosure-box"><label><input type="checkbox" required /> I will disclose whether I own or have a financial interest in this security.</label><label><input type="checkbox" required /> I understand that editors may request revisions and submissions are not published automatically.</label></div>
          <button className="submit-contribution">Submit for editorial review →</button>
        </form> : <div className="submission-success"><span>✓</span><h2>Submitted for editorial review.</h2><p>Your contribution is now in the ONDS correction queue. An editor can verify the source, request revisions, or attach it to the permanent dossier.</p><div><Link href="/admin">View the editorial queue →</Link><button onClick={()=>setSubmitted(false)}>Submit another</button></div></div>}
      </article>
    </section>
  </main>
}
