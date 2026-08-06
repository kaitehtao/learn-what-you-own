import { env } from "cloudflare:workers";
import { ensureDossierSourceBackfillSchema } from "../../../../db/runtimeSchema";
import { processDossierSourceBackfillBatch } from "../../../data/dossierSourceBackfill";
import { apiError, requireEditor } from "../../../supabase-server";

export const dynamic = "force-dynamic";

async function dashboardData() {
  await ensureDossierSourceBackfillSchema();
  const [batches, items, coverage] = await Promise.all([
    env.DB.prepare(`SELECT id,universe_name,selection_rule,requested_limit,selected_count,
      success_count,skipped_count,error_count,source_count_added,status,started_at,completed_at
      FROM dossier_source_backfill_batches ORDER BY started_at DESC LIMIT 20`).all(),
    env.DB.prepare(`SELECT batch_id,ticker,priority_rank,memberships_json,status,source_count_before,
      source_count_after,facts_import_status,facts_import_detail,error_message,completed_at
      FROM dossier_source_backfill_items
      WHERE batch_id IN (SELECT id FROM dossier_source_backfill_batches ORDER BY started_at DESC LIMIT 20)
      ORDER BY batch_id DESC,priority_rank`).all(),
    env.DB.prepare(`SELECT
      SUM(CASE WHEN memberships_json LIKE '%Russell 3000%' THEN 1 ELSE 0 END) AS russell_3000_total,
      SUM(CASE WHEN memberships_json LIKE '%Russell 3000%' AND NOT EXISTS (SELECT 1 FROM dossier_sources ds WHERE ds.ticker=companies.ticker) THEN 1 ELSE 0 END) AS russell_3000_zero_sources,
      SUM(CASE WHEN memberships_json LIKE '%Russell 2000%' THEN 1 ELSE 0 END) AS russell_2000_total,
      SUM(CASE WHEN memberships_json LIKE '%Russell 2000%' AND NOT EXISTS (SELECT 1 FROM dossier_sources ds WHERE ds.ticker=companies.ticker) THEN 1 ELSE 0 END) AS russell_2000_zero_sources
      FROM companies WHERE is_active=1 AND listing_scope='listed'`).first(),
  ]);
  return { batches: batches.results, items: items.results, coverage };
}

export async function GET(request: Request) {
  try {
    await requireEditor(request);
    return Response.json(await dashboardData(), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireEditor(request);
    const payload = await request.json().catch(() => ({})) as { limit?: number };
    return Response.json(await processDossierSourceBackfillBatch(Number(payload.limit) || 12), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
