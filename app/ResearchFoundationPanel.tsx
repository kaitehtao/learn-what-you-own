"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SaveToNotebookButton } from "./SaveToNotebookButton";

type FilingFact = {
  id: number;
  metricKey: string;
  label: string;
  value: number;
  unit: string;
  periodEnd: string;
  fiscalPeriod: string | null;
  form: string;
  filedAt: string;
  sourceUrl: string;
};

type ResearchClaim = {
  id: number;
  section: string;
  claimType: "verified_fact" | "company_statement" | "editorial_analysis";
  claim: string;
  whyItMatters: string;
  sourceTitle: string;
  sourceUrl: string;
  evidenceDate: string;
};

type CompanyRelationship = {
  id: number;
  direction: "supplier" | "customer";
  relatedTicker: string | null;
  relatedName: string;
  supplierName: string;
  customerName: string;
  productService: string;
  evidenceSummary: string;
  materiality: "named" | "material" | "strategic" | "unknown";
  evidenceClass: "direct_disclosure" | "corroborated" | "inferred";
  sourceType: "sec" | "company";
  sourceTitle: string;
  sourceUrl: string;
  evidenceDate: string;
  status: "current" | "historical";
  contributorUsername: string | null;
};

type ResearchResponse = {
  facts: FilingFact[];
  claims: ResearchClaim[];
  relationships: CompanyRelationship[];
  error?: string;
};

const priorityMetrics = [
  "revenue",
  "gross_profit",
  "operating_income",
  "net_income",
  "operating_cash_flow",
  "capital_expenditures",
  "cash",
  "diluted_shares",
];

function compactNumber(value: number, unit: string) {
  const perShare = unit.includes("per") || unit.includes("/shares");
  if (perShare) return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
  const absolute = Math.abs(value);
  const divisor = absolute >= 1e12 ? 1e12 : absolute >= 1e9 ? 1e9 : absolute >= 1e6 ? 1e6 : absolute >= 1e3 ? 1e3 : 1;
  const suffix = divisor === 1e12 ? "T" : divisor === 1e9 ? "B" : divisor === 1e6 ? "M" : divisor === 1e3 ? "K" : "";
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: divisor === 1 ? 0 : 1 }).format(value / divisor);
  return unit === "USD" ? `${value < 0 ? "−" : ""}$${formatted.replace("-", "")}${suffix}` : `${formatted}${suffix}`;
}

function relationshipHref(ticker: string, type = "Supplier / customer relationship") {
  return `/contribute?ticker=${encodeURIComponent(ticker)}&type=${encodeURIComponent(type)}`;
}

function RelationshipNode({ relationship }: { relationship: CompanyRelationship }) {
  const content = <><strong>{relationship.relatedTicker ?? relationship.relatedName}</strong><span>{relationship.relatedTicker ? relationship.relatedName : relationship.productService}</span></>;
  return relationship.relatedTicker
    ? <Link className="relationship-node" href={`/company/${relationship.relatedTicker.toLowerCase()}`}>{content}</Link>
    : <div className="relationship-node private-node">{content}</div>;
}

export function ResearchFoundationPanel({ ticker, companyName }: { ticker: string; companyName: string }) {
  const [data, setData] = useState<ResearchResponse>({ facts: [], claims: [], relationships: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/research?ticker=${encodeURIComponent(ticker)}`)
      .then(async (response) => {
        const body = await response.json() as ResearchResponse;
        if (!response.ok) throw new Error(body.error ?? "Research data is unavailable.");
        if (active) setData(body);
      })
      .catch((caught: unknown) => active && setError(caught instanceof Error ? caught.message : "Research data is unavailable."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [ticker]);

  const factsByMetric = useMemo(() => {
    const grouped = new Map<string, FilingFact[]>();
    for (const fact of data.facts) grouped.set(fact.metricKey, [...(grouped.get(fact.metricKey) ?? []), fact]);
    return grouped;
  }, [data.facts]);
  const latestFacts = priorityMetrics.flatMap((metric) => factsByMetric.get(metric)?.[0] ?? []).slice(0, 8);
  const suppliers = data.relationships.filter((relationship) => relationship.direction === "supplier");
  const customers = data.relationships.filter((relationship) => relationship.direction === "customer");

  return <section className="research-foundation" id="research-foundation">
    <div className="research-foundation-heading">
      <div><span className="kicker">EVIDENCE + NETWORK INTELLIGENCE</span><h2>The facts beneath the ownership story</h2><p>Numerical facts come from public filings. Editorial analysis and member insights remain visibly labeled so evidence, interpretation, and opinion never become interchangeable.</p></div>
      <Link href={relationshipHref(ticker)}>Add relationship evidence →</Link>
    </div>

    {loading ? <div className="research-foundation-state">Loading filing-grounded research…</div> : error ? <div className="research-foundation-state error">{error}</div> : <>
      <div className="evidence-layer-legend"><span className="fact-layer">FILED FACT</span><span className="statement-layer">COMPANY STATEMENT</span><span className="analysis-layer">EDITORIAL ANALYSIS</span><span className="community-layer">MEMBER INSIGHT</span></div>

      <div className="filing-facts-block">
        <div className="research-subheading"><div><small>PUBLIC FILING FACTS</small><h3>Financial evidence</h3></div><span>{data.facts.length ? `${factsByMetric.size} normalized metrics` : "Awaiting SEC import"}</span></div>
        {latestFacts.length ? <div className="filing-fact-grid">{latestFacts.map((fact) => <div className="filing-fact-card" key={`${fact.metricKey}-${fact.periodEnd}`}><a href={fact.sourceUrl} target="_blank" rel="noreferrer"><small>{fact.label}</small><strong>{compactNumber(fact.value, fact.unit)}</strong><span>{fact.fiscalPeriod ?? fact.form} · period ended {fact.periodEnd}</span><em>{fact.form} filed {fact.filedAt} ↗</em></a><SaveToNotebookButton compact ticker={ticker} companyName={companyName} title={`${fact.label}: ${compactNumber(fact.value, fact.unit)}`} sourceTitle={`${fact.form} filed ${fact.filedAt}`} sourceUrl={fact.sourceUrl} sourceExcerpt={`${fact.label} was ${compactNumber(fact.value, fact.unit)} for the period ended ${fact.periodEnd}.`} /></div>)}</div> : <div className="research-foundation-state"><strong>No normalized filing facts published yet.</strong><p>An editor can import this company’s SEC Company Facts without turning unverified estimates into dossier data.</p></div>}
      </div>

      <div className="relationship-block">
        <div className="research-subheading"><div><small>BUSINESS RELATIONSHIP GRAPH</small><h3>Who affects—and is affected by—{ticker}</h3></div><span>{data.relationships.length} verified connections</span></div>
        {data.relationships.length ? <>
          <div className="relationship-graph">
            <div className="relationship-column"><small>SUPPLIERS</small>{suppliers.length ? suppliers.map((relationship) => <RelationshipNode relationship={relationship} key={relationship.id}/>) : <span className="relationship-placeholder">No named suppliers yet</span>}</div>
            <div className="relationship-core"><span>{ticker}</span><strong>{companyName}</strong><small>CLICK CONNECTED TICKERS TO NAVIGATE</small></div>
            <div className="relationship-column"><small>CUSTOMERS</small>{customers.length ? customers.map((relationship) => <RelationshipNode relationship={relationship} key={relationship.id}/>) : <span className="relationship-placeholder">No named customers yet</span>}</div>
          </div>
          <div className="relationship-evidence-list">{data.relationships.map((relationship) => <article key={relationship.id}><header><span>{relationship.direction === "supplier" ? "SUPPLIES THIS COMPANY" : "CUSTOMER OF THIS COMPANY"}</span><em>{relationship.evidenceClass.replaceAll("_", " ")}</em></header><h4>{relationship.supplierName} → {relationship.customerName}</h4><strong>{relationship.productService}</strong><p>{relationship.evidenceSummary}</p><footer><a href={relationship.sourceUrl} target="_blank" rel="noreferrer">{relationship.sourceType.toUpperCase()} · {relationship.sourceTitle} ↗</a><span>{relationship.evidenceDate}</span>{relationship.contributorUsername && <em>Researched by @{relationship.contributorUsername}</em>}</footer></article>)}</div>
        </> : <div className="research-foundation-state"><strong>No verified supplier or customer edges yet.</strong><p>Named relationships are published only after an editor verifies the filing or official-company evidence.</p><Link href={relationshipHref(ticker)}>Submit the first relationship →</Link></div>}
      </div>

      {data.claims.length > 0 && <div className="evidence-ledger"><div className="research-subheading"><div><small>CLAIM-LEVEL PROVENANCE</small><h3>Evidence ledger</h3></div><span>{data.claims.length} published claims</span></div><div>{data.claims.map((claim) => <article key={claim.id}><span className={`${claim.claimType.replaceAll("_", "-")}-badge`}>{claim.claimType.replaceAll("_", " ")}</span><small>{claim.section}</small><h4>{claim.claim}</h4>{claim.whyItMatters && <p>{claim.whyItMatters}</p>}<a href={claim.sourceUrl} target="_blank" rel="noreferrer">{claim.sourceTitle} · {claim.evidenceDate} ↗</a><SaveToNotebookButton compact ticker={ticker} companyName={companyName} title={claim.claim} body={claim.whyItMatters} sourceTitle={claim.sourceTitle} sourceUrl={claim.sourceUrl} /></article>)}</div></div>}
    </>}
  </section>;
}
