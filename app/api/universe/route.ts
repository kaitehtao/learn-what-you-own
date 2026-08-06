import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

const memberships = new Set(["S&P 500", "Russell 2000", "Russell 3000", "Nasdaq-100 (QQQ)", "Extended Coverage"]);
const sorts = new Set(["ticker", "company", "market_cap"]);
const qualityTiers = new Set(["starting_point", "machine_enriched", "editorial_review", "benchmark_complete"]);

function escapedLike(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const market = url.searchParams.get("market") === "otc" ? "otc" : "listed";
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const exchange = (url.searchParams.get("exchange") ?? "").toUpperCase();
  const securityType = (url.searchParams.get("securityType") ?? "").trim().slice(0, 100);
  const sector = (url.searchParams.get("sector") ?? "").trim().slice(0, 100);
  const minMarketCap = Number(url.searchParams.get("minMarketCap"));
  const maxMarketCap = Number(url.searchParams.get("maxMarketCap"));
  const membership = (url.searchParams.get("membership") ?? "").trim();
  const qualityTier = (url.searchParams.get("qualityTier") ?? "").trim();
  const sort = sorts.has(url.searchParams.get("sort") ?? "") ? url.searchParams.get("sort")! : "ticker";
  const direction = url.searchParams.get("direction") === "desc" ? "DESC" : "ASC";
  const page = Math.max(1, Math.min(10_000, Number(url.searchParams.get("page")) || 1));
  const pageSize = Math.max(10, Math.min(100, Number(url.searchParams.get("pageSize")) || 40));
  const clauses = ["c.listing_scope = ?", "c.is_active = 1"];
  const binds: unknown[] = [market];

  if (market === "listed" && (exchange === "NYSE" || exchange === "NASDAQ")) {
    clauses.push("c.exchange = ?");
    binds.push(exchange);
  }
  if (market === "otc" && securityType) {
    clauses.push("c.security_type = ?");
    binds.push(securityType);
  }
  if (market === "listed" && sector) {
    clauses.push("c.sector = ?");
    binds.push(sector);
  }
  if (market === "listed" && Number.isFinite(minMarketCap) && minMarketCap > 0) {
    clauses.push("c.market_cap >= ?");
    binds.push(minMarketCap);
  }
  if (market === "listed" && Number.isFinite(maxMarketCap) && maxMarketCap > 0) {
    clauses.push("c.market_cap <= ?");
    binds.push(maxMarketCap);
  }
  if (market === "listed" && memberships.has(membership)) {
    clauses.push("c.memberships_json LIKE ? ESCAPE '\\'");
    binds.push(`%${escapedLike(JSON.stringify(membership).slice(1, -1))}%`);
  }
  if (qualityTiers.has(qualityTier)) {
    clauses.push("COALESCE(d.quality_tier, 'starting_point') = ?");
    binds.push(qualityTier);
  }
  const search = escapedLike(query.toUpperCase());
  if (query) {
    clauses.push("(UPPER(c.ticker) LIKE ? ESCAPE '\\' OR UPPER(c.name) LIKE ? ESCAPE '\\' OR UPPER(c.security_description) LIKE ? ESCAPE '\\')");
    binds.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = clauses.join(" AND ");
  const countResult = await env.DB.prepare(`SELECT COUNT(*) AS count FROM companies c LEFT JOIN company_dossiers d ON d.ticker=c.ticker WHERE ${where}`)
    .bind(...binds).first<{ count: number }>();
  const order = query
    ? "CASE WHEN UPPER(c.ticker) = ? THEN 0 WHEN UPPER(c.ticker) LIKE ? ESCAPE '\\' THEN 1 WHEN UPPER(c.name) LIKE ? ESCAPE '\\' THEN 2 ELSE 3 END, c.ticker ASC"
    : sort === "company"
      ? `c.name ${direction}, c.ticker ASC`
      : sort === "market_cap"
        ? `c.market_cap IS NULL, c.market_cap ${direction}, c.ticker ASC`
        : `c.ticker ${direction}`;
  const orderBinds = query ? [query.toUpperCase(), `${search}%`, `%${search}%`] : [];
  const [results, qualitySummary, qualityRule] = await Promise.all([
    env.DB.prepare(`
    SELECT c.ticker, c.name, c.sector, c.exchange, c.market_cap, c.memberships_json,
      c.cik, c.security_type, c.security_description, c.universe_source_url,
      c.universe_source_as_of, d.status AS dossier_status,
      COALESCE(d.quality_tier, 'starting_point') AS dossier_quality_tier,
      d.quality_reviewed_at AS dossier_quality_reviewed_at,
      (SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=c.ticker) AS dossier_source_count
    FROM companies c
    LEFT JOIN company_dossiers d ON d.ticker = c.ticker
    WHERE ${where}
    ORDER BY ${order}
    LIMIT ? OFFSET ?
  `).bind(...binds, ...orderBinds, pageSize, (page - 1) * pageSize).all(),
    market === "listed" && memberships.has(membership)
      ? env.DB.prepare(`SELECT
          COUNT(*) AS total,
          COUNT(DISTINCT COALESCE(NULLIF(c.cik,''),c.ticker)) AS company_count,
          SUM(CASE WHEN c.market_cap IS NOT NULL THEN 1 ELSE 0 END) AS market_cap_count,
          SUM(CASE WHEN COALESCE(d.quality_tier,'starting_point')='starting_point' THEN 1 ELSE 0 END) AS starting_point,
          SUM(CASE WHEN d.quality_tier='machine_enriched' THEN 1 ELSE 0 END) AS machine_enriched,
          SUM(CASE WHEN d.quality_tier='editorial_review' THEN 1 ELSE 0 END) AS editorial_review,
          SUM(CASE WHEN d.quality_tier='benchmark_complete' THEN 1 ELSE 0 END) AS benchmark_complete,
          SUM(CASE WHEN COALESCE(s.source_count,0)=0 THEN 1 ELSE 0 END) AS zero_sources,
          SUM(CASE WHEN COALESCE(s.source_count,0)>=5 THEN 1 ELSE 0 END) AS five_plus_sources
        FROM companies c
        LEFT JOIN company_dossiers d ON d.ticker=c.ticker
        LEFT JOIN (SELECT ticker,COUNT(*) AS source_count FROM dossier_sources GROUP BY ticker) s ON s.ticker=c.ticker
        WHERE c.listing_scope='listed' AND c.is_active=1
          AND c.memberships_json LIKE ? ESCAPE '\\'`)
        .bind(`%${escapedLike(JSON.stringify(membership).slice(1, -1))}%`).first()
      : Promise.resolve(null),
    market === "listed" && memberships.has(membership)
      ? env.DB.prepare(`SELECT id,label,min_source_count,min_verified_claim_count,
          min_distinct_section_count,min_distinct_claim_type_count
        FROM dossier_quality_rules WHERE is_active=1 ORDER BY updated_at DESC LIMIT 1`).first()
      : Promise.resolve(null),
  ]);

  return Response.json({
    market,
    page,
    pageSize,
    total: Number(countResult?.count ?? 0),
    companies: results.results,
    qualitySummary,
    qualityRule,
  }, { headers: { "cache-control": "public, max-age=300, stale-while-revalidate=900" } });
}
