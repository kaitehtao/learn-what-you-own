import { env } from "cloudflare:workers";
import { featuredDossiers } from "../../data/featuredDossiers";

export const dynamic = "force-dynamic";

const sourceCte = `
WITH raw(ticker, url) AS (
  SELECT ds.ticker, ds.url FROM dossier_sources ds
  JOIN company_dossiers cd ON cd.ticker = ds.ticker AND cd.status = 'published'
  UNION SELECT ticker, source_url FROM filing_facts
  UNION SELECT coalesce(customer_ticker, supplier_ticker), source_url FROM company_relationships
    WHERE customer_ticker IS NOT NULL OR supplier_ticker IS NOT NULL
  UNION SELECT slug, primary_source_url FROM emerging_company_dossiers
  UNION SELECT slug, roadshow_source_url FROM emerging_company_dossiers WHERE roadshow_source_url IS NOT NULL AND roadshow_source_url <> ''
), prepared AS (
  SELECT ticker, url,
    CASE WHEN instr(url, '/Archives/edgar/data/') > 0
      THEN substr(url, instr(url, '/Archives/edgar/data/') + length('/Archives/edgar/data/'))
      ELSE NULL END AS rest
  FROM raw WHERE url LIKE 'https://%'
), normalized AS (
  SELECT ticker, CASE
    WHEN rest IS NOT NULL AND instr(rest, '/') > 0 AND instr(substr(rest, instr(rest, '/') + 1), '/') > 0
      THEN 'sec-accession:' || substr(rest, 1, instr(rest, '/') + instr(substr(rest, instr(rest, '/') + 1), '/') - 1)
    ELSE lower(rtrim(url, '/')) END AS source_key
  FROM prepared
)`;

export async function GET() {
  const [catalog, dossiers, sources, sourceCounts, claims] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS total,
      SUM(CASE WHEN listing_scope='listed' THEN 1 ELSE 0 END) AS listed,
      SUM(CASE WHEN listing_scope='otc' THEN 1 ELSE 0 END) AS otc
      FROM companies WHERE is_active=1`).first<{ total: number; listed: number; otc: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM company_dossiers WHERE status='published'").first<{ count: number }>(),
    env.DB.prepare(`${sourceCte} SELECT COUNT(DISTINCT source_key) AS count FROM normalized`).first<{ count: number }>(),
    env.DB.prepare(`${sourceCte} SELECT ticker, COUNT(DISTINCT source_key) AS count FROM normalized GROUP BY ticker`).all<{ ticker: string; count: number }>(),
    env.DB.prepare(`SELECT COUNT(*) AS total,
      SUM(CASE WHEN source_url LIKE 'https://%' THEN 1 ELSE 0 END) AS sourced
      FROM dossier_claims WHERE status='published'`).first<{ total: number; sourced: number }>(),
  ]);

  const publishedClaims = Number(claims?.total ?? 0);
  const sourcedClaims = Number(claims?.sourced ?? 0);
  const sourceCountsByTicker = Object.fromEntries(sourceCounts.results.map((row) => [row.ticker, Number(row.count)]));
  for (const [ticker, dossier] of Object.entries(featuredDossiers)) {
    sourceCountsByTicker[ticker] = Math.max(sourceCountsByTicker[ticker] ?? 0, new Set(dossier.sources.map((source) => source.href)).size);
  }
  return Response.json({
    researchableSymbols: Number(catalog?.total ?? 0),
    listedSymbols: Number(catalog?.listed ?? 0),
    otcSymbols: Number(catalog?.otc ?? 0),
    publishedDossiers: Number(dossiers?.count ?? 0),
    uniquePrimarySources: Number(sources?.count ?? 0),
    publishedClaims,
    sourcedClaims,
    claimSourceCoverage: publishedClaims ? Math.round((sourcedClaims / publishedClaims) * 100) : 0,
    sourceCountsByTicker,
    definitions: {
      researchableSymbols: "Distinct active NYSE, Nasdaq, and OTC symbols in the authoritative D1 companies table.",
      uniquePrimarySources: "Distinct HTTPS evidence documents, with SEC URLs deduplicated by filing accession.",
    },
    checkedAt: new Date().toISOString(),
  }, { headers: { "cache-control": "public, max-age=300, stale-while-revalidate=900" } });
}
