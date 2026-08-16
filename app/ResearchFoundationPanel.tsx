"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { filingHistoryLabel, selectComparableHistory, selectDisplayedFact } from "./filingHistory";
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
  updatedAt: string;
};

type FactsImport = {
  status: "success" | "no_compatible_facts" | "error";
  sourceUrl: string;
  importedCount: number;
  metricCount: number;
  lastAttemptedAt: string;
  lastSuccessAt: string | null;
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

type QuarterlyDossierUpdate = {
  id: number;
  accessionNumber: string;
  form: string;
  periodEnd: string;
  filedAt: string;
  sourceUrl: string;
  status: "facts_refreshed" | "editorial_review" | "published";
  objectiveSummary: string;
  comparisons: Array<{
    metricKey: string; label: string; unit: string; currentValue: number; currentPeriodEnd: string; currentSourceUrl: string;
    priorQuarterValue: number | null; priorQuarterPeriodEnd: string | null; priorQuarterSourceUrl: string | null; quarterOverQuarterPercent: number | null;
    priorYearValue: number | null; priorYearPeriodEnd: string | null; priorYearSourceUrl: string | null; yearOverYearPercent: number | null;
  }>;
  comparisonBasis: string;
  comparisonGeneratedAt: string | null;
  editorialSummary: string;
  reviewedAt: string | null;
  publishedAt: string | null;
};

type DossierFreshnessEvent = { id:number;accessionNumber:string;form:string;filingDate:string;reportDate:string;sourceUrl:string;eventType:"earnings_release"|"annual_report"|"quarterly_report"|"proxy_statement"|"material_8k";materialityReason:string;factsRefreshStatus:"not_applicable"|"pending"|"refreshed"|"failed";status:"editorial_review"|"published"|"ignored"|"failed";editorialSummary:string;publishedAt:string|null };
type DossierFreshnessCheck = { lastAttemptedAt:string;lastSuccessAt:string|null;latestFilingDate:string|null;error:string|null };

type ResearchResponse = {
  facts: FilingFact[];
  claims: ResearchClaim[];
  relationships: CompanyRelationship[];
  factsImport: FactsImport | null;
  quarterlyUpdates: QuarterlyDossierUpdate[];
  freshnessEvents: DossierFreshnessEvent[];
  freshnessCheck: DossierFreshnessCheck | null;
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
  "shares_outstanding",
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

function shortDate(value: string | null | undefined) {
  if (!value) return "not yet refreshed";
  if (/^[A-Za-z]+\s+\d{4}$/.test(value.trim())) return value.trim();
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value.slice(0, 10) : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function percentChange(current: number, prior: number) {
  if (prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

function RelationshipNode({ relationship }: { relationship: CompanyRelationship }) {
  const content = <><strong>{relationship.relatedTicker ?? relationship.relatedName}</strong><span>{relationship.relatedTicker ? relationship.relatedName : relationship.productService}</span></>;
  return relationship.relatedTicker
    ? <Link className="relationship-node" href={`/company/${relationship.relatedTicker.toLowerCase()}`}>{content}</Link>
    : <div className="relationship-node private-node">{content}</div>;
}

function quarterlyStatusLabel(status: QuarterlyDossierUpdate["status"]) {
  if (status === "published") return "Editorial update published";
  if (status === "editorial_review") return "Optional analyst interpretation in progress";
  return "Filing and facts automatically added";
}

export function ResearchFoundationPanel({ ticker, companyName, editorialUpdatedAt }: { ticker: string; companyName: string; editorialUpdatedAt?: string }) {
  const [data, setData] = useState<ResearchResponse>({ facts: [], claims: [], relationships: [], factsImport: null, quarterlyUpdates: [], freshnessEvents: [], freshnessCheck: null });
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
  const displayMetrics = [...priorityMetrics, ...[...factsByMetric.keys()].filter((metric) => !priorityMetrics.includes(metric))];
  const latestFacts = displayMetrics.flatMap((metric) => selectDisplayedFact(ticker, metric, factsByMetric.get(metric) ?? []) ?? []);
  const latestPeriodEnd = data.facts.reduce((latest, fact) => fact.periodEnd > latest ? fact.periodEnd : latest, "");
  const suppliers = data.relationships.filter((relationship) => relationship.direction === "supplier");
  const customers = data.relationships.filter((relationship) => relationship.direction === "customer");
  const filedDataUpdatedAt = data.factsImport?.lastSuccessAt ?? data.facts[0]?.updatedAt;

  return <section className="research-foundation" id="research-foundation">
    <div className="research-foundation-heading">
      <div><span className="kicker">EVIDENCE + NETWORK INTELLIGENCE</span><h2>The facts beneath the ownership story</h2><p>Numerical facts come from public filings. Editorial analysis and member insights remain visibly labeled so evidence, interpretation, and opinion never become interchangeable.</p></div>
      <div className="research-foundation-actions">
        <div className="dossier-update-dates"><small>DOSSIER LAST UPDATED</small><strong>{editorialUpdatedAt ? shortDate(editorialUpdatedAt) : "Editorial research not yet published"}</strong><span>{filedDataUpdatedAt ? `SEC facts refreshed ${shortDate(filedDataUpdatedAt)}` : "Awaiting first SEC facts refresh"}</span></div>
        {ticker==="AAPL"&&<Link href="/company/aapl/supply-chain">Open Apple supply-chain document →</Link>}<Link href={relationshipHref(ticker)}>Add relationship evidence →</Link>
      </div>
    </div>

    {loading ? <div className="research-foundation-state">Loading filing-grounded research…</div> : error ? <div className="research-foundation-state error">{error}</div> : <>
      <div className="evidence-layer-legend"><span className="fact-layer">FILED FACT</span><span className="statement-layer">COMPANY STATEMENT</span><span className="analysis-layer">EDITORIAL ANALYSIS</span><span className="community-layer">MEMBER INSIGHT</span></div>

      {data.freshnessEvents[0] && <div className="freshness-public-block"><div><small>AUTOMATED FILING MONITOR</small><h3>{data.freshnessEvents[0].form} · {data.freshnessEvents[0].eventType.replaceAll("_", " ")}</h3><p>{data.freshnessEvents[0].materialityReason}</p>{data.freshnessEvents[0].editorialSummary && <blockquote>{data.freshnessEvents[0].editorialSummary}</blockquote>}</div><aside><span className={`freshness-public-status ${data.freshnessEvents[0].status}`}>{data.freshnessEvents[0].status === "published" ? "Automatically added" : data.freshnessEvents[0].status.replaceAll("_", " ")}</span><strong>Filed {shortDate(data.freshnessEvents[0].filingDate)}</strong><small>{data.freshnessEvents[0].factsRefreshStatus === "refreshed" ? "Filed facts refreshed" : data.freshnessEvents[0].factsRefreshStatus.replaceAll("_", " ")}</small><a href={data.freshnessEvents[0].sourceUrl} target="_blank" rel="noreferrer">Open exact SEC filing ↗</a>{data.freshnessCheck?.lastSuccessAt && <em>Monitor checked {shortDate(data.freshnessCheck.lastSuccessAt)}</em>}</aside></div>}

      {data.quarterlyUpdates[0] && <div className="quarterly-update-block">
        <div><small>QUARTERLY DOSSIER REFRESH</small><h3>{data.quarterlyUpdates[0].form} filed {shortDate(data.quarterlyUpdates[0].filedAt)}</h3><p>Primary financial facts now reflect the period ended {data.quarterlyUpdates[0].periodEnd}. The filing and filed facts appear automatically without analyst approval. Any later change to the owner summary, bull case, bear case, risks, or valuation framing remains separately moderated.</p></div>
        <div className={`quarterly-update-status ${data.quarterlyUpdates[0].status.replaceAll("_", "-")}`}><span>{quarterlyStatusLabel(data.quarterlyUpdates[0].status)}</span><a href={data.quarterlyUpdates[0].sourceUrl} target="_blank" rel="noreferrer">Open exact SEC filing ↗</a></div>
        {data.quarterlyUpdates[0].objectiveSummary && <div className="filing-change-summary"><small>AUTOMATIC WHAT CHANGED · FILED FACTS</small><p>{data.quarterlyUpdates[0].objectiveSummary}</p></div>}
        {!!data.quarterlyUpdates[0].comparisons?.length && <div className="filing-change-table" role="table" aria-label="Quarter over quarter and year over year filed fact comparisons">
          <div className="filing-change-row filing-change-head" role="row"><span>Metric</span><span>Current</span><span>QoQ</span><span>YoY</span></div>
          {data.quarterlyUpdates[0].comparisons.map((comparison) => <div className="filing-change-row" role="row" key={comparison.metricKey}>
            <a href={comparison.currentSourceUrl} target="_blank" rel="noreferrer">{comparison.label}</a>
            <strong>{compactNumber(comparison.currentValue, comparison.unit)}</strong>
            <span className={comparison.quarterOverQuarterPercent === null ? "" : comparison.quarterOverQuarterPercent >= 0 ? "positive" : "negative"}>{comparison.quarterOverQuarterPercent === null ? "—" : `${comparison.quarterOverQuarterPercent >= 0 ? "+" : ""}${comparison.quarterOverQuarterPercent.toFixed(1)}%`}</span>
            <span className={comparison.yearOverYearPercent === null ? "" : comparison.yearOverYearPercent >= 0 ? "positive" : "negative"}>{comparison.yearOverYearPercent === null ? "—" : `${comparison.yearOverYearPercent >= 0 ? "+" : ""}${comparison.yearOverYearPercent.toFixed(1)}%`}</span>
          </div>)}
          <p>{data.quarterlyUpdates[0].comparisonBasis}</p>
        </div>}
        {data.quarterlyUpdates[0].editorialSummary && <blockquote>{data.quarterlyUpdates[0].editorialSummary}</blockquote>}
      </div>}

      <div className="filing-facts-block">
        <div className="research-subheading"><div><small>PUBLIC FILING FACTS</small><h3>Filed financial history</h3></div><span>{data.facts.length ? `${factsByMetric.size} metrics · through ${latestPeriodEnd}` : data.factsImport?.status === "no_compatible_facts" ? "SEC data reviewed" : "Financial import queued"}</span></div>
        {latestFacts.length ? <>
          <p className="filing-facts-explainer">Values are normalized from SEC XBRL and link to the exact 10-K or 10-Q accession. Comparable-period changes use the same fiscal-period label, avoiding a quarterly-versus-annual comparison.</p>
          <div className="filing-fact-grid">{latestFacts.map((fact) => {
            const history = selectComparableHistory(ticker, factsByMetric.get(fact.metricKey) ?? [], fact);
            const prior = history[1];
            const change = prior ? percentChange(fact.value, prior.value) : null;
            const displayLabel = filingHistoryLabel(ticker, fact, fact.label);
            return <div className="filing-fact-card" key={`${fact.metricKey}-${fact.periodEnd}`}><a href={fact.sourceUrl} target="_blank" rel="noreferrer"><small>{displayLabel}</small><strong>{compactNumber(fact.value, fact.unit)}</strong>{change !== null && <b className={change >= 0 ? "fact-change positive" : "fact-change negative"}>{change >= 0 ? "+" : ""}{change.toFixed(1)}% vs prior {fact.fiscalPeriod ?? "period"}</b>}<span>{fact.fiscalPeriod ?? fact.form} · period ended {fact.periodEnd}</span><div className="filing-history" aria-label={`${displayLabel} comparable filing history`}>{[...history].reverse().map((point) => <i key={`${point.periodEnd}-${point.fiscalPeriod}`}><span>{point.periodEnd.slice(0, 4)}</span><em>{compactNumber(point.value, point.unit)}</em></i>)}</div><em>{fact.form} filed {fact.filedAt} · open SEC filing ↗</em></a><SaveToNotebookButton compact ticker={ticker} companyName={companyName} title={`${displayLabel}: ${compactNumber(fact.value, fact.unit)}`} sourceTitle={`${fact.form} filed ${fact.filedAt}`} sourceUrl={fact.sourceUrl} sourceExcerpt={`${displayLabel} was ${compactNumber(fact.value, fact.unit)} for the period ended ${fact.periodEnd}.`} /></div>;
          })}</div>
          <div className="filing-facts-provenance"><span>Source: SEC Company Facts and direct EDGAR accessions</span>{data.factsImport?.sourceUrl && <a href={data.factsImport.sourceUrl} target="_blank" rel="noreferrer">Open machine-readable source ↗</a>}<span>Refreshed {shortDate(data.factsImport?.lastSuccessAt ?? data.facts[0]?.updatedAt)}</span></div>
        </> : data.factsImport?.status === "no_compatible_facts" ? <div className="research-foundation-state compact"><strong>No compatible standardized facts were reported.</strong><p>The SEC Company Facts record was checked, but this issuer did not expose the supported US-GAAP or IFRS concepts. No estimates were substituted.</p><a href={data.factsImport.sourceUrl} target="_blank" rel="noreferrer">Inspect the SEC Company Facts record ↗</a></div> : <div className="research-foundation-state compact"><strong>Filed financial history is being normalized.</strong><p>The dossier can remain readable while the scheduled importer retries the SEC record. No placeholder or analyst estimate is shown as a filed fact.</p></div>}
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
