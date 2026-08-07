import { env } from "cloudflare:workers";
import { ensureDossierSourceBackfillSchema } from "../../../../db/runtimeSchema";
import { processDossierSourceBackfillBatch } from "../../../data/dossierSourceBackfill";
import { apiError, requireEditor } from "../../../supabase-server";

export const dynamic = "force-dynamic";

async function dashboardData() {
  await ensureDossierSourceBackfillSchema();
  const [batches, items, coverage, operations] = await Promise.all([
    env.DB.prepare(`SELECT b.id,b.universe_name,b.selection_rule,b.requested_limit,b.selected_count,
      b.success_count,b.skipped_count,b.error_count,b.source_count_added,b.status,b.started_at,b.completed_at,
      CASE WHEN b.status='failed' AND b.success_count=0 AND b.source_count_added=0
        AND EXISTS (
          SELECT 1 FROM dossier_source_backfill_batches newer
          WHERE newer.universe_name=b.universe_name AND newer.started_at>b.started_at
            AND newer.status='completed' AND newer.success_count>0
        ) THEN 1 ELSE 0 END AS is_superseded_diagnostic
      FROM dossier_source_backfill_batches b ORDER BY b.started_at DESC LIMIT 20`).all(),
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
    env.DB.prepare(`SELECT
      SUM(CASE WHEN status='queued' THEN 1 ELSE 0 END) AS queued,
      SUM(CASE WHEN status='running' THEN 1 ELSE 0 END) AS running,
      SUM(CASE WHEN status='error' AND completed_at>=datetime('now','-24 hours') THEN 1 ELSE 0 END) AS errors_24h,
      SUM(CASE WHEN status='source_foundation_complete' AND completed_at>=datetime('now','-1 hour') THEN 1 ELSE 0 END) AS completed_1h,
      MIN(CASE WHEN status IN ('queued','running') THEN started_at END) AS oldest_pending
      FROM dossier_source_backfill_items`).first(),
  ]);
  return { batches: batches.results, items: items.results, coverage, operations };
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
