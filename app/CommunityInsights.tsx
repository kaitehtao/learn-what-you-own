"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SaveToNotebookButton } from "./SaveToNotebookButton";

type Insight = { id:number; username:string; contributionType:string; claim:string; whyItMatters:string; sourceUrl:string; evidenceDate:string; positionDisclosure:string; createdAt:string; researchAssetType?:string|null; researchAssetTitle?:string|null; researchAssetFileName?:string|null; researchAssetUrl?:string|null; googleSheetUrl?:string|null; googleSheetEmbedUrl?:string|null; collaborationNotes?:string|null };

export function CommunityInsights({ ticker }: { ticker: string }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch(`/api/contributions?ticker=${encodeURIComponent(ticker)}`)
      .then(async response => response.ok ? response.json() as Promise<{ insights: Insight[] }> : { insights: [] })
      .then(data => active && setInsights(data.insights))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [ticker]);
  return <section className="community-insights" id="community-insights"><div className="community-heading"><div><span className="kicker">COMMUNITY INSIGHTS</span><h2>What verified members are seeing</h2><p>Approved, sourced observations attributed to each contributor’s public username.</p></div><Link href={`/contribute?ticker=${encodeURIComponent(ticker)}`}>Post an insight →</Link></div>{loading?<div className="community-empty">Loading community insights…</div>:insights.length===0?<div className="community-empty"><strong>No approved insights yet.</strong><p>Be the first verified member to submit a sourced observation for editorial review.</p><Link href={`/contribute?ticker=${encodeURIComponent(ticker)}`}>Contribute as a member →</Link></div>:<div className="insight-list">{insights.map(insight=>{
    const safeSheetEmbed = insight.googleSheetEmbedUrl?.startsWith("https://docs.google.com/spreadsheets/d/") ? insight.googleSheetEmbedUrl : null;
    return <article key={insight.id}><header><strong>@{insight.username}</strong><span>{insight.contributionType}</span><time>{new Date(insight.createdAt).toLocaleDateString()}</time></header><h3>{insight.claim}</h3><p>{insight.whyItMatters}</p>{(insight.researchAssetUrl||safeSheetEmbed)&&<div className="community-research-asset"><div><small>COMMUNITY RESEARCH ASSET</small><strong>{insight.researchAssetTitle||insight.contributionType}</strong>{insight.collaborationNotes&&<p>{insight.collaborationNotes}</p>}<div>{insight.researchAssetUrl&&<a href={insight.researchAssetUrl}>Download {insight.researchAssetFileName||"research file"} ↓</a>}{insight.googleSheetUrl&&<a href={insight.googleSheetUrl} target="_blank" rel="noreferrer">Open collaborative Google Sheet ↗</a>}</div></div>{safeSheetEmbed&&<iframe title={`${ticker} community earnings model`} src={safeSheetEmbed} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"/>}</div>}<footer><a href={insight.sourceUrl} target="_blank" rel="noreferrer">Open source ↗</a><span>Evidence: {insight.evidenceDate}</span><em>{insight.positionDisclosure}</em></footer><SaveToNotebookButton compact ticker={ticker} title={insight.claim} body={insight.whyItMatters} sourceTitle={`Community insight by @${insight.username}`} sourceUrl={insight.sourceUrl} /></article>;
  })}</div>}</section>;
}
