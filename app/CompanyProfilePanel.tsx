"use client";

import { useEffect, useState } from "react";

type Contact = {
  legal_name:string;street_1:string;street_2:string;city:string;state_or_country:string;postal_code:string;
  telephone:string;company_website_url:string;investor_relations_url:string;investor_relations_email:string;
  investor_relations_phone:string;sec_source_url:string;ir_source_url:string;verified_at:string;
};
type Person = { name:string;title:string;biography:string;source_url:string;source_excerpt:string;source_filing_date:string|null;verified_at:string };
type Profile = { ticker:string;contact:Contact|null;management:Person[];error?:string };

function dateLabel(value: string) {
  const date = new Date(value.endsWith("Z") ? value : `${value.replace(" ","T")}Z`);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric", timeZone:"UTC" });
}

export function CompanyProfilePanel({ ticker, companyName }: { ticker:string; companyName:string }) {
  const [profile,setProfile]=useState<Profile|null>(null);
  const [error,setError]=useState("");
  useEffect(()=>{let active=true;fetch(`/api/company-profile?ticker=${encodeURIComponent(ticker)}`)
    .then(async response=>{const body=await response.json() as Profile;if(!response.ok)throw new Error(body.error||"Profile unavailable");return body;})
    .then(body=>{if(active)setProfile(body);}).catch(reason=>{if(active)setError(reason instanceof Error?reason.message:"Profile unavailable");});
    return()=>{active=false;};},[ticker]);
  const contact=profile?.contact;
  const address=[contact?.street_1,contact?.street_2,[contact?.city,contact?.state_or_country,contact?.postal_code].filter(Boolean).join(" ")].filter(Boolean);
  return <section className="company-profile-panel" id="company-management">
    <header><div><span className="kicker">COMPANY CONTACT &amp; MANAGEMENT</span><h2>Know who runs {companyName}</h2><p>Contact details come from the SEC issuer record and official investor-relations pages. Management biographies come from the latest available proxy or annual filing.</p></div>{contact?.verified_at&&<small>Verified {dateLabel(contact.verified_at)}</small>}</header>
    {error?<div className="company-profile-empty"><strong>Profile temporarily unavailable</strong><p>{error}</p></div>:!profile?<div className="company-profile-empty"><strong>Loading company profile…</strong></div>:<>
      <div className="company-contact-grid">
        <article><small>HEADQUARTERS</small><strong>{contact?.legal_name||companyName}</strong>{address.length?<address>{address.map(line=><span key={line}>{line}</span>)}</address>:<p>Address refresh pending.</p>}{contact?.telephone?<a href={`tel:${contact.telephone}`}>{contact.telephone}</a>:<span>Telephone not disclosed in the current SEC profile.</span>}</article>
        <article><small>INVESTOR RELATIONS</small>{contact?.investor_relations_email?<a href={`mailto:${contact.investor_relations_email}`}>{contact.investor_relations_email}</a>:<strong>Email not publicly disclosed</strong>}{contact?.investor_relations_phone&&<a href={`tel:${contact.investor_relations_phone}`}>{contact.investor_relations_phone}</a>}{contact?.investor_relations_url?<a href={contact.investor_relations_url} target="_blank" rel="noreferrer">Official investor-relations site ↗</a>:<span>Official IR contact refresh pending.</span>}</article>
        <article><small>VERIFICATION SOURCES</small>{contact?.sec_source_url?<a href={contact.sec_source_url} target="_blank" rel="noreferrer">SEC company submission ↗</a>:<span>SEC profile refresh scheduled.</span>}{contact?.company_website_url&&<a href={contact.company_website_url} target="_blank" rel="noreferrer">Company website ↗</a>}{contact?.ir_source_url&&<a href={contact.ir_source_url} target="_blank" rel="noreferrer">IR source ↗</a>}</article>
      </div>
      <div className="management-heading"><div><span className="kicker">CURRENT EXECUTIVE TEAM</span><h3>Filed roles and biographies</h3></div><p>Titles and biographies are filing-derived, not inferred from social profiles.</p></div>
      {profile.management.length?<div className="management-grid">{profile.management.map(person=><article key={`${person.name}-${person.title}`}><header><div><h4>{person.name}</h4><strong>{person.title}</strong></div><span>{person.source_filing_date||dateLabel(person.verified_at)}</span></header><p>{person.biography}</p><details><summary>View filing evidence</summary><blockquote>{person.source_excerpt}</blockquote><a href={person.source_url} target="_blank" rel="noreferrer">Open source filing ↗</a></details></article>)}</div>:<div className="company-profile-empty"><strong>Management biography refresh pending</strong><p>The section is active, but no biography is displayed until a current proxy or annual-report excerpt passes exact source validation.</p></div>}
    </>}
  </section>;
}
