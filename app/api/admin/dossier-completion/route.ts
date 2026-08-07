import { env } from "cloudflare:workers";
import { ensureDossierCompletionSchema } from "../../../../db/runtimeSchema";
import { processAutomaticBenchmarkBatch } from "../../../data/dossierCompletion";
import { apiError, requireEditor } from "../../../supabase-server";

export const dynamic = "force-dynamic";

async function dashboardData() {
  await ensureDossierCompletionSchema();
  const [summary, batches, candidates] = await Promise.all([
    env.DB.prepare(`SELECT
      SUM(CASE WHEN quality_tier='benchmark_complete' THEN 1 ELSE 0 END) AS benchmark_complete,
      SUM(CASE WHEN quality_tier='machine_enriched' THEN 1 ELSE 0 END) AS machine_enriched,
      SUM(CASE WHEN quality_tier='machine_enriched' AND validated_at IS NOT NULL
        AND NULLIF(TRIM(description),'') IS NOT NULL AND NULLIF(TRIM(lede),'') IS NOT NULL
        AND NULLIF(TRIM(sells),'') IS NOT NULL AND NULLIF(TRIM(revenue_model),'') IS NOT NULL
        AND NULLIF(TRIM(opportunity),'') IS NOT NULL AND NULLIF(TRIM(must_go_right),'') IS NOT NULL
        AND NULLIF(TRIM(editor_note),'') IS NOT NULL AND NULLIF(TRIM(bull_title),'') IS NOT NULL
        AND NULLIF(TRIM(bear_title),'') IS NOT NULL AND NULLIF(TRIM(thesis_breaker),'') IS NOT NULL
        AND NULLIF(TRIM(competitors),'') IS NOT NULL AND json_valid(bull_json) AND json_valid(bear_json)
        AND json_valid(financial_drivers_json) AND json_valid(risks_json)
        AND json_valid(monitor_json) AND json_valid(questions_json)
        THEN 1 ELSE 0 END) AS narrative_ready,
      SUM(CASE WHEN quality_tier='starting_point' THEN 1 ELSE 0 END) AS starting_point
      FROM company_dossiers`).first(),
    env.DB.prepare(`SELECT id,universe_name,selection_rule,requested_count,selected_count,
      approved_count,needs_revision_count,status,created_by,created_at,completed_at
      FROM dossier_completion_batches
      ORDER BY CASE WHEN status<>'completed' THEN 0 ELSE 1 END,
        CASE WHEN status<>'completed' THEN created_at END ASC,created_at DESC LIMIT 12`).all(),
    env.DB.prepare(`SELECT cc.batch_id,cc.ticker,cc.priority_rank,cc.status,cc.source_count,
      cc.claim_preview_json,cc.validation_json,cc.review_note,cc.reviewed_by,cc.reviewed_at,cc.approved_at,
      c.name,c.market_cap,d.quality_tier,d.evidence_date
      FROM dossier_completion_candidates cc
      JOIN companies c ON c.ticker=cc.ticker
      JOIN company_dossiers d ON d.ticker=cc.ticker
      WHERE cc.batch_id IN (SELECT id FROM dossier_completion_batches
        ORDER BY CASE WHEN status<>'completed' THEN 0 ELSE 1 END,
          CASE WHEN status<>'completed' THEN created_at END ASC,created_at DESC LIMIT 4)
      ORDER BY cc.batch_id DESC,cc.priority_rank LIMIT 120`).all(),
  ]);
  return { summary, batches: batches.results, candidates: candidates.results };
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
    const { profile } = await requireEditor(request);
    const payload = await request.json().catch(() => ({})) as { count?: number };
    return Response.json(await processAutomaticBenchmarkBatch(Number(payload.count) || 30, `system:evidence-benchmark:${profile.username}`), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireEditor(request);
    return Response.json({
      error: "Benchmark completion is automatic. Dossiers that fail the active evidence rule remain in the exception ledger.",
    }, { status: 405, headers: { allow: "GET, POST" } });
  } catch (error) {
    return apiError(error);
  }
}
