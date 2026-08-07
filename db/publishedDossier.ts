import { env } from "cloudflare:workers";
import type { FeaturedDossier } from "../app/data/featuredDossiers";

type StoredDossier = {
  ticker:string;description:string;lede:string;sells:string;revenue_model:string;opportunity:string;must_go_right:string;
  editor_note:string;bull_title:string;bull_json:string;bear_title:string;bear_json:string;thesis_breaker:string;
  financial_drivers_json:string;risks_json:string;monitor_json:string;questions_json:string;competitors:string;evidence_date:string|null;
};
type StoredSource = { title:string;source_type:string;url:string;evidence_date:string|null;excerpt:string|null };

function parseArray<T>(value:string):T[]{
  const parsed=JSON.parse(value) as unknown;
  if(!Array.isArray(parsed))throw new Error("Stored dossier section is invalid.");
  return parsed as T[];
}

function reviewedLabel(value:string|null){
  if(!value)return undefined;
  const date=new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf())?value:date.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"});
}

export async function findPublishedDossier(ticker:string):Promise<FeaturedDossier|null>{
  try{
    const row=await env.DB.prepare(`SELECT ticker,description,lede,sells,revenue_model,opportunity,must_go_right,
      editor_note,bull_title,bull_json,bear_title,bear_json,thesis_breaker,financial_drivers_json,risks_json,
      monitor_json,questions_json,competitors,evidence_date
      FROM company_dossiers WHERE ticker=? AND status='published' AND quality_tier='benchmark_complete'
      AND validated_at IS NOT NULL LIMIT 1`).bind(ticker).first<StoredDossier>();
    if(!row)return null;
    const sources=await env.DB.prepare(`SELECT title,source_type,url,evidence_date,excerpt FROM dossier_sources
      WHERE ticker=? AND url LIKE 'https://%' ORDER BY CASE WHEN source_type LIKE '%sec%' THEN 0 ELSE 1 END,evidence_date DESC,url`)
      .bind(ticker).all<StoredSource>();
    if(sources.results.length<2)return null;
    return {
      ticker:row.ticker,
      reviewed:reviewedLabel(row.evidence_date),
      completeness:100,
      description:row.description,
      lede:row.lede,
      sells:row.sells,
      revenueModel:row.revenue_model,
      opportunity:row.opportunity,
      mustGoRight:row.must_go_right,
      editorNote:row.editor_note,
      bullTitle:row.bull_title,
      bull:parseArray<string>(row.bull_json),
      bearTitle:row.bear_title,
      bear:parseArray<string>(row.bear_json),
      thesisBreaker:row.thesis_breaker,
      financialDrivers:parseArray<FeaturedDossier["financialDrivers"][number]>(row.financial_drivers_json),
      risks:parseArray<FeaturedDossier["risks"][number]>(row.risks_json),
      monitor:parseArray<FeaturedDossier["monitor"][number]>(row.monitor_json),
      questions:parseArray<string>(row.questions_json),
      competitors:row.competitors,
      sources:sources.results.map((source)=>({
        title:source.title,
        meta:`${source.source_type.replaceAll("_"," ")} · ${source.evidence_date??"current source"}`,
        href:source.url,
        excerpt:source.excerpt??`Open ${source.title} to verify the original evidence.`,
      })),
    };
  }catch(error){
    console.error(`Unable to load the canonical D1 dossier for ${ticker}.`,error);
    return null;
  }
}
