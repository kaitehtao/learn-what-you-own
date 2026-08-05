import { env } from "cloudflare:workers";
import { ensureDossierQualitySchema } from "../../db/runtimeSchema";

export type DossierQualityRule = {
  id: string;
  label: string;
  min_source_count: number;
  min_verified_claim_count: number;
  min_distinct_section_count: number;
  min_distinct_claim_type_count: number;
};

export async function activeDossierQualityRule() {
  await ensureDossierQualitySchema();
  const rule = await env.DB.prepare(`SELECT id,label,min_source_count,min_verified_claim_count,
    min_distinct_section_count,min_distinct_claim_type_count
    FROM dossier_quality_rules WHERE is_active=1 ORDER BY updated_at DESC LIMIT 1`).first<DossierQualityRule>();
  if (!rule) throw new Error("No active dossier quality rule is configured.");
  return rule;
}

export async function reconcileDossierQuality() {
  const rule = await activeDossierQualityRule();
  const result = await env.DB.prepare(`WITH evidence AS (
      SELECT d.ticker,d.status,
        COUNT(DISTINCT s.url) AS source_count,
        COUNT(DISTINCT CASE WHEN cl.status IN ('verified','published') THEN cl.id END) AS verified_claim_count,
        COUNT(DISTINCT CASE WHEN cl.status IN ('verified','published') THEN cl.section END) AS distinct_section_count,
        COUNT(DISTINCT CASE WHEN cl.status IN ('verified','published') THEN cl.claim_type END) AS distinct_claim_type_count
      FROM company_dossiers d
      LEFT JOIN dossier_sources s ON s.ticker=d.ticker AND s.url LIKE 'https://%'
      LEFT JOIN dossier_claims cl ON cl.ticker=d.ticker
      GROUP BY d.ticker,d.status
    ), classified AS (
      SELECT ticker,CASE
        WHEN status='published'
          AND source_count>=?
          AND verified_claim_count>=?
          AND distinct_section_count>=?
          AND distinct_claim_type_count>=?
          THEN 'benchmark_complete'
        WHEN status='published' AND source_count>=? AND verified_claim_count>0 THEN 'editorial_review'
        WHEN status='published' THEN 'machine_enriched'
        ELSE 'starting_point'
      END AS quality_tier
      FROM evidence
    )
    UPDATE company_dossiers
    SET quality_tier=(SELECT quality_tier FROM classified WHERE classified.ticker=company_dossiers.ticker),
      quality_run_id=?,quality_reviewed_at=CURRENT_TIMESTAMP
    WHERE EXISTS (
      SELECT 1 FROM classified
      WHERE classified.ticker=company_dossiers.ticker
        AND (classified.quality_tier<>company_dossiers.quality_tier OR COALESCE(company_dossiers.quality_run_id,'')<>?)
    )`).bind(
      rule.min_source_count,
      rule.min_verified_claim_count,
      rule.min_distinct_section_count,
      rule.min_distinct_claim_type_count,
      rule.min_source_count,
      rule.id,
      rule.id,
    ).run();

  const summary = await env.DB.prepare(`SELECT quality_tier,COUNT(*) AS count
    FROM company_dossiers GROUP BY quality_tier ORDER BY quality_tier`).all<{ quality_tier: string; count: number }>();
  return { rule, changed: Number(result.meta.changes ?? 0), summary: summary.results };
}
