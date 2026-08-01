import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

const memberships = new Set(["S&P 500", "Russell 2000", "Russell 3000", "Nasdaq-100 (QQQ)", "Extended Coverage"]);
const sorts = new Set(["ticker", "company", "market_cap"]);

function escapedLike(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const market = url.searchParams.get("market") === "otc" ? "otc" : "listed";
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const exchange = (url.searchParams.get("exchange") ?? "").toUpperCase();
  const securityType = (url.searchParams.get("securityType") ?? "").trim().slice(0, 100);
  const membership = (url.searchParams.get("membership") ?? "").trim();
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
  if (market === "listed" && memberships.has(membership)) {
    clauses.push("c.memberships_json LIKE ? ESCAPE '\\'");
    binds.push(`%${escapedLike(JSON.stringify(membership).slice(1, -1))}%`);
  }
  const search = escapedLike(query.toUpperCase());
  if (query) {
    clauses.push("(UPPER(c.ticker) LIKE ? ESCAPE '\\' OR UPPER(c.name) LIKE ? ESCAPE '\\' OR UPPER(c.security_description) LIKE ? ESCAPE '\\')");
    binds.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = clauses.join(" AND ");
  const countResult = await env.DB.prepare(`SELECT COUNT(*) AS count FROM companies c WHERE ${where}`)
    .bind(...binds).first<{ count: number }>();
  const order = query
    ? "CASE WHEN UPPER(c.ticker) = ? THEN 0 WHEN UPPER(c.ticker) LIKE ? ESCAPE '\\' THEN 1 WHEN UPPER(c.name) LIKE ? ESCAPE '\\' THEN 2 ELSE 3 END, c.ticker ASC"
    : sort === "company"
      ? `c.name ${direction}, c.ticker ASC`
      : sort === "market_cap"
        ? `c.market_cap IS NULL, c.market_cap ${direction}, c.ticker ASC`
        : `c.ticker ${direction}`;
  const orderBinds = query ? [query.toUpperCase(), `${search}%`, `%${search}%`] : [];
  const results = await env.DB.prepare(`
    SELECT c.ticker, c.name, c.sector, c.exchange, c.market_cap, c.memberships_json,
      c.cik, c.security_type, c.security_description, c.universe_source_url,
      c.universe_source_as_of, d.status AS dossier_status
    FROM companies c
    LEFT JOIN company_dossiers d ON d.ticker = c.ticker
    WHERE ${where}
    ORDER BY ${order}
    LIMIT ? OFFSET ?
  `).bind(...binds, ...orderBinds, pageSize, (page - 1) * pageSize).all();

  return Response.json({
    market,
    page,
    pageSize,
    total: Number(countResult?.count ?? 0),
    companies: results.results,
  }, { headers: { "cache-control": "public, max-age=300, stale-while-revalidate=900" } });
}
