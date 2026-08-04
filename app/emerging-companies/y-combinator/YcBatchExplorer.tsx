"use client";

/* eslint-disable @next/next/no-img-element -- YC supplies dynamic logo URLs for this official directory dataset. */

import { useMemo, useState } from "react";
import styles from "./ycProfiles.module.css";

type YcFounder = {
  name: string;
  title: string;
  bio: string;
  active: boolean;
  linkedin: string;
  twitter: string;
};

type YcLaunch = { title: string; tagline: string; date: string; url: string };
type YcJob = { title: string; location: string; type: string; role: string; salaryRange: string; equityRange: string; experience: string; visa: string; url: string };

export type YcCompany = {
  name: string;
  slug: string;
  website: string;
  ycUrl: string;
  oneLiner: string;
  description: string;
  industry: string;
  subindustry: string;
  location: string;
  teamSize: number | null;
  status: string;
  tags: string[];
  logoUrl: string;
  yearFounded: number | null;
  primaryPartner: string;
  companyLinkedIn: string;
  companyTwitter: string;
  companyGithub: string;
  founders: YcFounder[];
  launches: YcLaunch[];
  jobs: YcJob[];
};

function safeWebsite(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function YcBatchExplorer({ companies, sourceAsOf }: { companies: YcCompany[]; sourceAsOf: string }) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All industries");
  const [sort, setSort] = useState("name");
  const industries = useMemo(() => ["All industries", ...new Set(companies.map((company) => company.industry).filter(Boolean))], [companies]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const results = companies.filter((company) => {
      const matchesIndustry = industry === "All industries" || company.industry === industry;
      const haystack = [company.name, company.oneLiner, company.description, company.industry, company.subindustry, company.location, ...company.tags].join(" ").toLowerCase();
      return matchesIndustry && (!term || haystack.includes(term));
    });
    return results.sort((left, right) => {
      if (sort === "team") return (right.teamSize ?? -1) - (left.teamSize ?? -1) || left.name.localeCompare(right.name);
      if (sort === "industry") return left.industry.localeCompare(right.industry) || left.name.localeCompare(right.name);
      return left.name.localeCompare(right.name);
    });
  }, [companies, industry, query, sort]);
  const activeCount = companies.filter((company) => company.status === "Active").length;

  return <>
    <section className="container yc-batch-summary">
      <div><strong>{companies.length}</strong><span>Official class profiles</span></div>
      <div><strong>{activeCount}</strong><span>Marked active by YC</span></div>
      <div><strong>{industries.length - 1}</strong><span>Primary industries</span></div>
      <div><strong>0</strong><span>Ranked dossiers—research begins now</span></div>
    </section>
    <section className="container yc-ranking-method">
      <div><span className="kicker">RANKING FRAMEWORK</span><h2>Rank evidence, not excitement.</h2><p>Every company begins unranked. A full private-company dossier can later earn a class rank across market opportunity, customer evidence, product differentiation, capital efficiency, team execution, and financing or concentration risk. Scores will display only after cited research is approved.</p></div>
      <ol><li><span>01</span>Market + customer evidence</li><li><span>02</span>Product + defensibility</li><li><span>03</span>Economics + capital needs</li><li><span>04</span>Team + execution</li><li><span>05</span>Risk-adjusted investor relevance</li></ol>
    </section>
    <section className="container yc-directory">
      <div className="yc-directory-heading"><div><span className="kicker">SUMMER 2026 DIRECTORY</span><h2>Explore the class</h2><p>{filtered.length} of {companies.length} companies · YC source checked {sourceAsOf}</p></div><a href="https://www.ycombinator.com/companies?batch=Summer%202026" target="_blank" rel="noreferrer">Verify official YC class ↗</a></div>
      <div className="yc-filters">
        <label><span>SEARCH THE CLASS</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Company, market, product, location…" /></label>
        <label><span>INDUSTRY</span><select value={industry} onChange={(event) => setIndustry(event.target.value)}>{industries.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>SORT</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Company A–Z</option><option value="industry">Industry</option><option value="team">Team size</option></select></label>
      </div>
      {filtered.length ? <div className="yc-company-grid">{filtered.map((company) => {
        const homepage = safeWebsite(company.website);
        return <article className="yc-company-card" key={company.slug}>
          <header>{company.logoUrl ? <img src={company.logoUrl} alt="" loading="lazy" /> : <span>{company.name.slice(0, 2).toUpperCase()}</span>}<div><small>RANK · PENDING RESEARCH</small><h3>{company.name}</h3></div></header>
          <strong>{company.oneLiner || "Company description pending"}</strong>
          <p>{company.description || company.oneLiner || "The official YC profile currently provides limited public detail."}</p>
          <div className="yc-company-tags">{[company.industry, ...company.tags].filter(Boolean).slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
          {company.founders.length ? <div className={styles.founderPreview}><small>FOUNDERS</small><strong>{company.founders.map((founder) => founder.name).join(" · ")}</strong></div> : <div className={styles.founderPreview}><small>FOUNDERS</small><strong>Not publicly listed by YC</strong></div>}
          <dl>
            <div><dt>Founded</dt><dd>{company.yearFounded ?? "Not listed"}</dd></div>
            <div><dt>Batch</dt><dd>Summer 2026</dd></div>
            <div><dt>Category</dt><dd>{company.subindustry || company.industry || "Not listed"}</dd></div>
            <div><dt>Location</dt><dd>{company.location || "Not listed"}</dd></div>
            <div><dt>Team</dt><dd>{company.teamSize || "Not listed"}</dd></div>
            <div><dt>Status</dt><dd>{company.status || "Not listed"}</dd></div>
            <div><dt>YC partner</dt><dd>{company.primaryPartner || "Not listed"}</dd></div>
          </dl>
          <details className={styles.dossier}>
            <summary><span>View full starter dossier</span><small>Founders · biographies · launch · hiring</small></summary>
            <div className={styles.dossierBody}>
              <section><h4>Founder team</h4>{company.founders.length ? <div className={styles.founders}>{company.founders.map((founder) => <article key={`${company.slug}-${founder.name}`}><header><strong>{founder.name}</strong><span>{founder.title}{founder.active ? " · Active" : " · Former"}</span></header><p>{founder.bio || "YC does not currently provide a public biography for this founder."}</p>{(founder.linkedin || founder.twitter) && <nav>{founder.linkedin && <a href={founder.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}{founder.twitter && <a href={founder.twitter} target="_blank" rel="noreferrer">X ↗</a>}</nav>}</article>)}</div> : <p>YC does not currently list a public founder profile for this company.</p>}</section>
              {company.launches.length > 0 && <section><h4>Company launch record</h4>{company.launches.map((launch) => <article className={styles.record} key={`${company.slug}-${launch.title}`}><strong>{launch.title}</strong>{launch.tagline && <p>{launch.tagline}</p>}<small>{launch.date ? new Date(launch.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Date not listed"}</small></article>)}</section>}
              <section><h4>Hiring signal</h4>{company.jobs.length ? <div className={styles.jobs}>{company.jobs.map((job) => <article key={`${company.slug}-${job.title}`}><strong>{job.title}</strong><span>{[job.role, job.type].filter(Boolean).join(" · ")}</span><p>{job.location || "Location not listed"}</p><small>{[job.salaryRange, job.equityRange, job.experience].filter(Boolean).join(" · ")}</small></article>)}</div> : <p>No public YC job postings were listed when this dossier was checked.</p>}</section>
              {(company.companyLinkedIn || company.companyTwitter || company.companyGithub) && <section><h4>Company channels</h4><nav className={styles.channels}>{company.companyLinkedIn && <a href={company.companyLinkedIn} target="_blank" rel="noreferrer">LinkedIn ↗</a>}{company.companyTwitter && <a href={company.companyTwitter} target="_blank" rel="noreferrer">X ↗</a>}{company.companyGithub && <a href={company.companyGithub} target="_blank" rel="noreferrer">GitHub ↗</a>}</nav></section>}
            </div>
          </details>
          <div className={styles.source}>Public profile facts sourced from YC · checked {sourceAsOf}. Missing fields are labeled rather than inferred.</div>
          <footer>{homepage ? <a href={homepage} target="_blank" rel="noreferrer">Company homepage ↗</a> : <span>Homepage not listed</span>}<a href={`/contribute?type=Private%20company%20dossier&company=${encodeURIComponent(company.name)}&source=${encodeURIComponent(company.ycUrl)}`}>Build dossier →</a></footer>
        </article>;
      })}</div> : <div className="emerging-empty"><strong>No companies match those filters.</strong><p>Try a broader company, product, industry, or location search.</p></div>}
    </section>
  </>;
}
