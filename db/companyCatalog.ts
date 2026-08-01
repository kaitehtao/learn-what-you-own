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
};

export async function findCatalogCompany(ticker: string) {
  try {
    return await env.DB.prepare(`
      SELECT ticker, name, sector, exchange, market_cap, memberships_json, index_weights_json,
        cik, listing_scope, security_type, security_description
      FROM companies
      WHERE ticker = ? AND is_active = 1
      LIMIT 1
    `).bind(ticker).first<CatalogCompany>();
  } catch {
    return null;
  }
}
