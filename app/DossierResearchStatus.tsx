"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CoverageState = "complete" | "partial" | "unavailable";

type ResearchStatusResponse = {
  dossier?: { status?: string; qualityTier?: string; updatedAt?: string } | null;
  sourceCount?: number;
  facts?: Array<{ filedAt: string; updatedAt: string }>;
  claims?: Array<{ id: number }>;
  relationships?: Array<{ id: number }>;
  quarterlyUpdates?: Array<{ form: string; filedAt: string; objectiveSummary: string; sourceUrl: string }>;
  freshnessCheck?: { lastSuccessAt: string | null; latestFilingDate: string | null; error: string | null } | null;
};

function readableDate(value?: string | null) {
  if (!value) return "Not yet available";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value.slice(0, 10) : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CoverageItem({ label, state, detail, checked }: { label: string; state: CoverageState; detail: string; checked?: string | null }) {
  return <div className="research-coverage-item">
    <div><strong>{label}</strong><span>{detail}</span></div>
    <aside><b className={`coverage-state ${state}`}>{state}</b><small>{readableDate(checked)}</small></aside>
  </div>;
}

export function DossierResearchStatus({ ticker, editorialUpdatedAt, fallbackSourceCount = 0 }: { ticker: string; editorialUpdatedAt?: string; fallbackSourceCount?: number }) {
  const [data, setData] = useState<ResearchStatusResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/research?ticker=${encodeURIComponent(ticker)}`)
      .then(async response => {
        if (!response.ok) throw new Error("Coverage unavailable");
        const body = await response.json() as ResearchStatusResponse;
        if (active) setData(body);
      })
      .catch(() => active && setFailed(true));
    return () => { active = false; };
  }, [ticker]);

  const factsChecked = data?.facts?.[0]?.updatedAt ?? data?.freshnessCheck?.lastSuccessAt;
  const sourceCount = data?.sourceCount ?? fallbackSourceCount;
  const latestChange = data?.quarterlyUpdates?.[0];
  const items = useMemo(() => {
    const dossierComplete = data?.dossier?.qualityTier === "benchmark_complete";
    const hasFacts = Boolean(data?.facts?.length);
    const hasClaims = Boolean(data?.claims?.length);
    const hasRelationships = Boolean(data?.relationships?.length);
    return [
      { label: "SEC financial history", state: (hasFacts ? "complete" : "partial") as CoverageState, detail: hasFacts ? `${data?.facts?.length} filing facts normalized` : "Importer active; compatible facts pending", checked: factsChecked },
      { label: "Sources and citations", state: (sourceCount > 0 ? "complete" : "partial") as CoverageState, detail: sourceCount > 0 ? `${sourceCount} primary sources linked` : "Source foundation still building", checked: data?.dossier?.updatedAt ?? editorialUpdatedAt },
      { label: "Owner analysis", state: (dossierComplete ? "complete" : hasClaims ? "partial" : "unavailable") as CoverageState, detail: dossierComplete ? "Benchmark-complete editorial dossier" : hasClaims ? `${data?.claims?.length} published evidence claims` : "No approved editorial thesis yet", checked: data?.dossier?.updatedAt ?? editorialUpdatedAt },
      { label: "Business relationships", state: (hasRelationships ? "complete" : "partial") as CoverageState, detail: hasRelationships ? `${data?.relationships?.length} verified supplier/customer links` : "No verified relationship edges yet", checked: data?.dossier?.updatedAt },
    ];
  }, [data, editorialUpdatedAt, factsChecked, sourceCount]);

  const completeCount = items.filter(item => item.state === "complete").length;
  return <section className="dossier-research-status" id="coverage-status" aria-label={`${ticker} research coverage and freshness`}>
    <header><div><span className="kicker">RESEARCH COVERAGE &amp; FRESHNESS</span><h2>Know what is complete before relying on it.</h2><p>Coverage labels describe the evidence presently available for this company. They are not investment ratings.</p></div><div className="coverage-score"><strong>{completeCount}/{items.length}</strong><span>layers complete</span><Link href="/methodology">Read the methodology →</Link></div></header>
    {failed ? <div className="coverage-fetch-error">Live coverage status could not be loaded. The dossier remains available, but freshness is unverified.</div> : <div className="research-coverage-grid">{items.map(item => <CoverageItem key={item.label} {...item} />)}</div>}
    {latestChange && <div className="latest-material-change"><div><small>LATEST AUTOMATIC CHANGE</small><strong>{latestChange.form} filed {readableDate(latestChange.filedAt)}</strong><p>{latestChange.objectiveSummary || "Filed facts were refreshed from the latest accepted filing."}</p></div><a href={latestChange.sourceUrl} target="_blank" rel="noreferrer">Open exact filing ↗</a></div>}
  </section>;
}
