import { env } from "cloudflare:workers";
import { ensureDossierFreshnessSchema, ensureQuarterlyDossierUpdatesSchema } from "../../../../db/runtimeSchema";
import { processDossierFreshnessBatch } from "../../../data/dossierFreshness";
import { apiError, requireEditor } from "../../../supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireEditor(request);
    await ensureDossierFreshnessSchema();
    const [events, statusCounts, checkCounts] = await Promise.all([
      env.DB.prepare(`SELECT id,ticker,accession_number,form,filing_date,report_date,source_url,event_type,sec_items_json,materiality_reason,review_focus_json,facts_refresh_status,facts_refresh_detail,status,editorial_summary,reviewed_by,reviewed_at,published_at,detected_at FROM dossier_freshness_events ORDER BY CASE status WHEN 'editorial_review' THEN 0 WHEN 'failed' THEN 1 ELSE 2 END,filing_date DESC,detected_at DESC LIMIT 200`).all(),
      env.DB.prepare("SELECT status,COUNT(*) AS count FROM dossier_freshness_events GROUP BY status").all(),
      env.DB.prepare("SELECT COUNT(*) AS monitored,SUM(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END) AS errors,MIN(last_success_at) AS oldest_success,MAX(last_success_at) AS latest_success FROM dossier_freshness_checks").first(),
    ]);
    return Response.json({ events: events.results, statusCounts: statusCounts.results, checks: checkCounts });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await requireEditor(request);
    const payload = await request.json().catch(() => ({})) as { limit?: number };
    return Response.json(await processDossierFreshnessBatch(Number(payload.limit) || 25));
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireEditor(request);
    await ensureDossierFreshnessSchema();
    const payload = await request.json() as { id?: number; action?: "publish" | "ignore" | "reopen"; editorialSummary?: string };
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id < 1) return Response.json({ error: "A valid freshness event is required." }, { status: 400 });
    const event = await env.DB.prepare("SELECT id,ticker,accession_number,form,status FROM dossier_freshness_events WHERE id=?").bind(id).first<{id:number;ticker:string;accession_number:string;form:string;status:string}>();
    if (!event) return Response.json({ error: "Freshness event not found." }, { status: 404 });
    if (payload.action === "reopen") {
      await env.DB.prepare("UPDATE dossier_freshness_events SET status='editorial_review',reviewed_by=NULL,reviewed_at=NULL,published_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();
      return Response.json({ updated: true });
    }
    if (payload.action === "ignore") {
      await env.DB.prepare("UPDATE dossier_freshness_events SET status='ignored',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,published_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(profile.username, id).run();
      return Response.json({ updated: true });
    }
    if (payload.action !== "publish") return Response.json({ error: "Choose publish, ignore, or reopen." }, { status: 400 });
    const summary = String(payload.editorialSummary ?? "").trim();
    if (summary.length < 40) return Response.json({ error: "Add an evidence-grounded editorial summary of at least 40 characters." }, { status: 400 });
    await env.DB.batch([
      env.DB.prepare("UPDATE dossier_freshness_events SET status='published',editorial_summary=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,published_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(summary, profile.username, id),
      env.DB.prepare("UPDATE company_dossiers SET updated_at=CURRENT_TIMESTAMP WHERE ticker=?").bind(event.ticker),
    ]);
    if (/^10-[KQ](?:\/A)?$/.test(event.form)) {
      await ensureQuarterlyDossierUpdatesSchema();
      await env.DB.prepare("UPDATE quarterly_dossier_updates SET status='published',editorial_summary=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,published_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE ticker=? AND accession_number=?").bind(summary, profile.username, event.ticker, event.accession_number).run();
    }
    return Response.json({ updated: true });
  } catch (error) { return apiError(error); }
}
