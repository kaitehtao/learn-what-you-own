import { env } from "cloudflare:workers";
import { ensureDossierFreshnessSchema, ensureQuarterlyDossierUpdatesSchema } from "../../../../db/runtimeSchema";
import { processDossierFreshnessBatch } from "../../../data/dossierFreshness";
import { apiError, requireEditor } from "../../../supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireEditor(request);
    await ensureDossierFreshnessSchema();
    const [packages, statusCounts, packageCounts, checkCounts, rolloutBatch, rolloutProgress, rolloutMembers] = await Promise.all([
      env.DB.prepare(`SELECT e.ticker,c.name,printf('%04d-Q%d',CAST(substr(COALESCE(NULLIF(e.report_date,''),e.filing_date),1,4) AS INTEGER),CAST(((CAST(substr(COALESCE(NULLIF(e.report_date,''),e.filing_date),6,2) AS INTEGER)-1)/3)+1 AS INTEGER)) AS review_period,
        COUNT(*) AS event_count,MAX(e.filing_date) AS latest_filing_date,MIN(e.detected_at) AS oldest_detected_at,
        MAX(CASE e.event_type WHEN 'earnings_release' THEN 100 WHEN 'annual_report' THEN 90
          WHEN 'quarterly_report' THEN 85 WHEN 'material_8k' THEN 70 WHEN 'proxy_statement' THEN 50 ELSE 40 END
          + CASE WHEN e.facts_refresh_status='failed' THEN 20 ELSE 0 END) AS priority_score,
        GROUP_CONCAT(DISTINCT e.form) AS forms,
        json_group_array(json_object(
          'id',e.id,'accession_number',e.accession_number,'form',e.form,'filing_date',e.filing_date,
          'report_date',e.report_date,'source_url',e.source_url,'event_type',e.event_type,
          'materiality_reason',e.materiality_reason,'review_focus_json',e.review_focus_json,
          'facts_refresh_status',e.facts_refresh_status,'facts_refresh_detail',e.facts_refresh_detail,
          'editorial_summary',e.editorial_summary,'detected_at',e.detected_at
        )) AS events_json
        FROM dossier_freshness_events e JOIN companies c ON c.ticker=e.ticker
        WHERE e.status='editorial_review'
        GROUP BY e.ticker,review_period
        ORDER BY priority_score DESC,latest_filing_date DESC,c.market_cap IS NULL,c.market_cap DESC,e.ticker
        LIMIT 200`).all(),
      env.DB.prepare("SELECT status,COUNT(*) AS count FROM dossier_freshness_events GROUP BY status").all(),
      env.DB.prepare(`SELECT status,COUNT(*) AS count FROM (
        SELECT status,ticker,printf('%04d-Q%d',
          CAST(substr(COALESCE(NULLIF(report_date,''),filing_date),1,4) AS INTEGER),
          CAST(((CAST(substr(COALESCE(NULLIF(report_date,''),filing_date),6,2) AS INTEGER)-1)/3)+1 AS INTEGER)
        ) AS review_period
        FROM dossier_freshness_events GROUP BY status,ticker,review_period
      ) GROUP BY status`).all(),
      env.DB.prepare("SELECT COUNT(*) AS monitored,SUM(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END) AS errors,MIN(last_success_at) AS oldest_success,MAX(last_success_at) AS latest_success FROM dossier_freshness_checks").first(),
      env.DB.prepare("SELECT id,universe_name,selection_rule,target_count,status,created_at,updated_at FROM dossier_expansion_batches WHERE id='russell-2000-market-cap-01'").first(),
      env.DB.prepare(`SELECT COUNT(*) AS total,
        SUM(CASE WHEN m.workflow_status='benchmark_complete' THEN 1 ELSE 0 END) AS benchmark_complete,
        SUM(CASE WHEN m.workflow_status='evidence_ready' THEN 1 ELSE 0 END) AS evidence_ready,
        SUM(CASE WHEN m.workflow_status='evidence_ingestion' THEN 1 ELSE 0 END) AS evidence_ingestion,
        SUM(CASE WHEN m.workflow_status='research_backlog' THEN 1 ELSE 0 END) AS research_backlog
        FROM dossier_expansion_members m WHERE m.batch_id='russell-2000-market-cap-01'`).first(),
      env.DB.prepare(`SELECT m.ticker,m.priority_rank,m.workflow_status,m.source_count,c.name,c.market_cap,COALESCE(d.quality_tier,'starting_point') AS quality_tier FROM dossier_expansion_members m JOIN companies c ON c.ticker=m.ticker LEFT JOIN company_dossiers d ON d.ticker=m.ticker WHERE m.batch_id='russell-2000-market-cap-01' ORDER BY m.priority_rank LIMIT 100`).all(),
    ]);
    return Response.json({ packages: packages.results, statusCounts: statusCounts.results, packageCounts: packageCounts.results, checks: checkCounts, rollout: rolloutBatch ? { batch: rolloutBatch, progress: rolloutProgress, members: rolloutMembers.results } : null });
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
    const payload = await request.json() as { id?: number; eventIds?: number[]; action?: "publish" | "ignore" | "reopen"; editorialSummary?: string };
    const ids = [...new Set([...(Array.isArray(payload.eventIds) ? payload.eventIds : []), ...(payload.id ? [payload.id] : [])]
      .map(Number).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 50);
    if (!ids.length) return Response.json({ error: "At least one valid freshness event is required." }, { status: 400 });
    const placeholders = ids.map(() => "?").join(",");
    const selected = await env.DB.prepare(`SELECT id,ticker,accession_number,form,status FROM dossier_freshness_events WHERE id IN (${placeholders})`).bind(...ids).all<{id:number;ticker:string;accession_number:string;form:string;status:string}>();
    if (selected.results.length !== ids.length) return Response.json({ error: "One or more freshness events were not found." }, { status: 404 });
    const tickers = [...new Set(selected.results.map((event) => event.ticker))];
    if (tickers.length !== 1) return Response.json({ error: "A review package must belong to one company." }, { status: 400 });
    if (payload.action === "reopen") {
      await env.DB.prepare(`UPDATE dossier_freshness_events SET status='editorial_review',reviewed_by=NULL,reviewed_at=NULL,published_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).bind(...ids).run();
      return Response.json({ updated: ids.length });
    }
    if (payload.action === "ignore") {
      await env.DB.prepare(`UPDATE dossier_freshness_events SET status='ignored',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,published_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).bind(profile.username, ...ids).run();
      return Response.json({ updated: ids.length });
    }
    if (payload.action !== "publish") return Response.json({ error: "Choose publish, ignore, or reopen." }, { status: 400 });
    const summary = String(payload.editorialSummary ?? "").trim();
    if (summary.length < 40) return Response.json({ error: "Add an evidence-grounded editorial summary of at least 40 characters." }, { status: 400 });
    await env.DB.batch([
      env.DB.prepare(`UPDATE dossier_freshness_events SET status='published',editorial_summary=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,published_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).bind(summary, profile.username, ...ids),
      env.DB.prepare("UPDATE company_dossiers SET updated_at=CURRENT_TIMESTAMP WHERE ticker=?").bind(tickers[0]),
    ]);
    const periodic = selected.results.filter((event) => /^10-[KQ](?:\/A)?$/.test(event.form));
    if (periodic.length) {
      await ensureQuarterlyDossierUpdatesSchema();
      for (const event of periodic) {
        await env.DB.prepare("UPDATE quarterly_dossier_updates SET status='published',editorial_summary=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,published_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE ticker=? AND accession_number=?").bind(summary, profile.username, event.ticker, event.accession_number).run();
      }
    }
    return Response.json({ updated: ids.length });
  } catch (error) { return apiError(error); }
}
