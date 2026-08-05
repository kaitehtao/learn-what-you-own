import { env } from "cloudflare:workers";

export type CatalogCompany = {
  ticker: string;
  name: string;
  sector: string;
  exchange: string;
  market_cap: number | null;
  memberships_json: string;
  index_weights_json: string;
  cik: string | null;
  listing_scope: "listed" | "otc" | "other";
  security_type: string;
  security_description: string;
  dossier_status: "queued" | "researching" | "verified" | "published" | null;
  dossier_quality_tier: "starting_point" | "machine_enriched" | "editorial_review" | "benchmark_complete";
  dossier_updated_at: string | null;
  rollout_priority_rank: number | null;
  rollout_batch_name: string | null;
};

export async function findCatalogCompany(ticker: string) {
  try {
    return await env.DB.prepare(`
      SELECT c.ticker, c.name, c.sector, c.exchange, c.market_cap, c.memberships_json, c.index_weights_json,
        c.cik, c.listing_scope, c.security_type, c.security_description,
        d.status AS dossier_status,
        COALESCE(d.quality_tier, 'starting_point') AS dossier_quality_tier,
        d.updated_at AS dossier_updated_at,
        (SELECT m.priority_rank FROM dossier_expansion_members m
          JOIN dossier_expansion_batches b ON b.id=m.batch_id
          WHERE m.ticker=c.ticker AND b.status IN ('active','in_progress')
          ORDER BY b.updated_at DESC LIMIT 1) AS rollout_priority_rank,
        (SELECT b.universe_name FROM dossier_expansion_members m
          JOIN dossier_expansion_batches b ON b.id=m.batch_id
          WHERE m.ticker=c.ticker AND b.status IN ('active','in_progress')
          ORDER BY b.updated_at DESC LIMIT 1) AS rollout_batch_name
      FROM companies c
      LEFT JOIN company_dossiers d ON d.ticker=c.ticker
      WHERE c.ticker = ? AND c.is_active = 1
      LIMIT 1
    `).bind(ticker).first<CatalogCompany>();
  } catch {
    return null;
  }
}
