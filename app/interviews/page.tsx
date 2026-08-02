"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "../ui";
import { ProfessionalInterviews } from "./ProfessionalInterviews";

const chapters = [
  { time: "00:00", title: "What investors misunderstand", answer: "The market often treats autonomous drones as a hardware sale. The more durable model is an operating system for repeatable, remotely managed missions." },
  { time: "08:42", title: "From pilot to scaled program", answer: "A pilot proves the aircraft. A scaled program requires regulatory approval, reliable operations, customer integration, and a budget that survives the next planning cycle." },
  { time: "17:18", title: "The next dollar of capital", answer: "Capital should go first to programs where the customer, regulatory path, and deployment economics are already visible." },
  { time: "26:06", title: "A milestone investors can measure", answer: "Watch the number of systems operating recurring missions—not simply units announced or ordered." },
];

export default function Interviews() {
  const [active, setActive] = useState(0);
  const [search, setSearch] = useState("");
  const visible = chapters.filter((chapter) => `${chapter.title} ${chapter.answer}`.toLowerCase().includes(search.toLowerCase()));
  return <main><Header />
    <section className="interview-hero"><div className="container"><span className="kicker">TWO INTERVIEW LIBRARIES · ONE RESEARCH STANDARD</span><h1>Conversations built<br />for owners.</h1><p>Separate issuer-management interviews from professional investor and community-expert conversations, while applying clear credentials, disclosures, sourcing, and editorial review.</p><nav className="interview-library-nav"><a href="#company">Company &amp; management interviews<span>Direct conversations with executives and issuer leadership.</span></a><a href="#professional">Investor &amp; contributor interviews<span>Professional investors, analysts, operators, and subject experts.</span></a></nav></div></section>
    <section id="company" className="company-interview-section"><div className="container company-interview-heading"><span className="kicker">COMPANY &amp; MANAGEMENT INTERVIEWS</span><h2>Ask executives what owners need answered.</h2><p>Business mechanics, competitive positioning, capital allocation, accountability, and measurable milestones—clearly labeled as management statements until independently verified.</p></div></section>
    <div className="container interview-layout">
      <article>
        <div className="video-stage"><div className="play-button">▶</div><div><span>DEMONSTRATION INTERVIEW</span><strong>Ondas Holdings · 34:12</strong></div></div>
        <div className="guest-card"><div className="guest-initials">EX</div><div><small>FEATURED GUEST</small><h2>Executive conversation</h2><p>Ondas Autonomous Systems · Recorded for the prototype</p></div><Link href="/company/onds">View company dossier →</Link></div>
        <div className="transcript-head"><div><span className="kicker">SEARCHABLE TRANSCRIPT</span><h2>Answers become research.</h2></div><label>⌕<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transcript" /></label></div>
        <div className="transcript-list">{visible.map((chapter) => <button className={chapters[active].time === chapter.time ? "active" : ""} onClick={() => setActive(chapters.indexOf(chapter))} key={chapter.time}><span>{chapter.time}</span><div><strong>{chapter.title}</strong><p>{chapter.answer}</p></div></button>)}</div>
      </article>
      <aside className="interview-aside"><span className="kicker">CHAPTERS</span>{chapters.map((chapter,index)=><button className={active===index?"active":""} onClick={()=>setActive(index)} key={chapter.time}><span>{chapter.time}</span>{chapter.title}</button>)}<div className="claim-check"><small>CLAIM CHECK</small><strong>Recurring missions are the key operating metric.</strong><p>Classification: Management assertion</p><span>Editorial status: Needs independent evidence</span></div><Link className="button dark-button" href="/contribute">Submit a follow-up question</Link></aside>
    </div>
    <ProfessionalInterviews />
  </main>;
}
