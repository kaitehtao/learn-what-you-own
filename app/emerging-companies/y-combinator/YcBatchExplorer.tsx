"use client";

/* eslint-disable @next/next/no-img-element -- YC supplies dynamic logo URLs for this official directory dataset. */

import { useMemo, useState } from "react";

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
          <dl>
            <div><dt>Batch</dt><dd>Summer 2026</dd></div>
            <div><dt>Category</dt><dd>{company.subindustry || company.industry || "Not listed"}</dd></div>
            <div><dt>Location</dt><dd>{company.location || "Not listed"}</dd></div>
            <div><dt>Team</dt><dd>{company.teamSize || "Not listed"}</dd></div>
            <div><dt>Status</dt><dd>{company.status || "Not listed"}</dd></div>
            <div><dt>Dossier</dt><dd>Starter profile</dd></div>
          </dl>
          <div style={{ marginTop: 12, color: "var(--muted)", fontSize: ".6875rem", lineHeight: 1.45 }}>Profile facts sourced from the official Y Combinator company record · checked {sourceAsOf}</div>
          <footer>{homepage ? <a href={homepage} target="_blank" rel="noreferrer">Company homepage ↗</a> : <span>Homepage not listed</span>}<a href={`/contribute?type=Private%20company%20dossier&company=${encodeURIComponent(company.name)}&source=${encodeURIComponent(company.ycUrl)}`}>Build dossier →</a></footer>
        </article>;
      })}</div> : <div className="emerging-empty"><strong>No companies match those filters.</strong><p>Try a broader company, product, industry, or location search.</p></div>}
    </section>
  </>;
}
