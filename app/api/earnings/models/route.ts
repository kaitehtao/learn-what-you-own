import { env } from "cloudflare:workers";
import { ensureEarningsIntelligenceSchema } from "../../../../db/runtimeSchema";
import {
  aggregateEarningsModelCells,
  earningsModelInputs,
  earningsModelPeriods,
  isEarningsModelInputKey,
  isEarningsModelPeriodKey,
  type EarningsModelCellMap,
  type EarningsModelCellRow,
} from "../../../earnings-model";
import { apiError, getSupabaseAdminClient, requireSupabaseUser } from "../../../supabase-server";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TICKER_PATTERN = /^[A-Z0-9.-]{1,12}$/;

type ModelPayload = {
  ticker?: string;
  reportDate?: string;
  fiscalQuarter?: string;
  thesisCase?: "bull" | "base" | "bear";
  confidence?: number;
  assumptionNote?: string;
  sourceUrl?: string;
  cells?: EarningsModelCellMap;
};
type OwnCellRow = EarningsModelCellRow & { id: number; version: number };
type RevisionRow = { period_key: string; metric_key: string; old_value: number | null; new_value: number | null; version: number; changed_at: string };
type UserContext = Awaited<ReturnType<typeof requireSupabaseUser>>;

function normalizeIdentity(tickerValue: unknown, dateValue: unknown) {
  const ticker = String(tickerValue ?? "").trim().toUpperCase();
  const reportDate = String(dateValue ?? "").trim();
  if (!TICKER_PATTERN.test(ticker) || !DATE_PATTERN.test(reportDate) || Number.isNaN(Date.parse(`${reportDate}T12:00:00Z`))) {
    throw new Response(JSON.stringify({ error: "Use a valid ticker and report date." }), { status: 400, headers: { "content-type": "application/json" } });
  }
  return { ticker, reportDate };
}

function optionalHttpsUrl(value: unknown) {
  const sourceUrl = String(value ?? "").trim();
  if (!sourceUrl) return "";
  try {
    const parsed = new URL(sourceUrl);
    if (parsed.protocol !== "https:") throw new Error("protocol");
    return parsed.toString();
  } catch {
    throw new Response(JSON.stringify({ error: "The evidence link must be a complete HTTPS URL." }), { status: 400, headers: { "content-type": "application/json" } });
  }
}

function normalizeCells(value: unknown): EarningsModelCellMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: EarningsModelCellMap = {};
  for (const [periodKey, rawMetrics] of Object.entries(value)) {
    if (!isEarningsModelPeriodKey(periodKey) || !rawMetrics || typeof rawMetrics !== "object" || Array.isArray(rawMetrics)) continue;
    for (const [metricKey, rawValue] of Object.entries(rawMetrics)) {
      if (!isEarningsModelInputKey(metricKey) || rawValue === null || rawValue === "") continue;
      const numeric = Number(rawValue);
      if (!Number.isFinite(numeric)) continue;
      if (metricKey === "diluted_shares_millions" && numeric <= 0) {
        throw new Response(JSON.stringify({ error: "Diluted shares must be greater than zero." }), { status: 400, headers: { "content-type": "application/json" } });
      }
      const limit = metricKey === "adjusted_eps" ? 10_000 : 10_000_000;
      if (Math.abs(numeric) > limit) {
        throw new Response(JSON.stringify({ error: `${metricKey.replaceAll("_", " ")} is outside the supported range.` }), { status: 400, headers: { "content-type": "application/json" } });
      }
      output[periodKey] ??= {};
      output[periodKey]![metricKey] = numeric;
    }
  }
  return output;
}

function cellsToMap(rows: OwnCellRow[]) {
  const cells: EarningsModelCellMap = {};
  const versions: Record<string, number> = {};
  for (const row of rows) {
    if (!isEarningsModelPeriodKey(row.period_key) || !isEarningsModelInputKey(row.metric_key)) continue;
    cells[row.period_key] ??= {};
    cells[row.period_key]![row.metric_key] = Number(row.value);
    versions[`${row.period_key}:${row.metric_key}`] = row.version;
  }
  return { cells, versions };
}

async function loadModel(ticker: string, reportDate: string, context?: UserContext) {
  const admin = getSupabaseAdminClient();
  const [publicCells, publicSubmissions, street, result] = await Promise.all([
    admin.from("earnings_model_cells").select("period_key,metric_key,value").eq("ticker", ticker).eq("report_date", reportDate),
    admin.from("earnings_model_submissions").select("thesis_case").eq("ticker", ticker).eq("report_date", reportDate),
    env.DB.prepare(`SELECT eps_estimate AS epsEstimate,analyst_count AS analystCount,source_label AS sourceLabel,
      source_url AS sourceUrl,snapshot_date AS snapshotDate FROM earnings_consensus_snapshots
      WHERE ticker=? AND report_date=? ORDER BY snapshot_date DESC,captured_at DESC LIMIT 1`).bind(ticker, reportDate).first(),
    env.DB.prepare(`SELECT eps_actual AS epsActual,eps_consensus_at_report AS epsConsensusAtReport,
      eps_surprise_percent AS epsSurprisePercent,source_label AS sourceLabel,source_url AS sourceUrl
      FROM earnings_results WHERE ticker=? AND report_date=? LIMIT 1`).bind(ticker, reportDate).first(),
  ]);
  if (publicCells.error) throw publicCells.error;
  if (publicSubmissions.error) throw publicSubmissions.error;
  const aggregateRows = (publicCells.data ?? []).map((row) => ({ ...row, value: Number(row.value) })) as EarningsModelCellRow[];
  const cases = publicSubmissions.data ?? [];

  let ownModel = null;
  let revisions: RevisionRow[] = [];
  if (context) {
    const [submission, ownCells, ownRevisions] = await Promise.all([
      context.supabase.from("earnings_model_submissions").select("fiscal_quarter,thesis_case,confidence,assumption_note,source_url,version,updated_at")
        .eq("user_id", context.user.id).eq("ticker", ticker).eq("report_date", reportDate).maybeSingle(),
      context.supabase.from("earnings_model_cells").select("id,period_key,metric_key,value,version")
        .eq("user_id", context.user.id).eq("ticker", ticker).eq("report_date", reportDate),
      context.supabase.from("earnings_model_revisions").select("period_key,metric_key,old_value,new_value,version,changed_at")
        .eq("user_id", context.user.id).eq("ticker", ticker).eq("report_date", reportDate).order("changed_at", { ascending: false }).limit(50),
    ]);
    const failed = [submission, ownCells, ownRevisions].find((query) => query.error);
    if (failed?.error) throw failed.error;
    ownModel = submission.data ? {
      fiscalQuarter: submission.data.fiscal_quarter,
      thesisCase: submission.data.thesis_case,
      confidence: submission.data.confidence,
      assumptionNote: submission.data.assumption_note,
      sourceUrl: submission.data.source_url,
      version: submission.data.version,
      updatedAt: submission.data.updated_at,
      ...cellsToMap((ownCells.data ?? []).map((row) => ({ ...row, value: Number(row.value) })) as OwnCellRow[]),
    } : null;
    revisions = (ownRevisions.data ?? []).map((row) => ({ ...row, old_value: row.old_value === null ? null : Number(row.old_value), new_value: row.new_value === null ? null : Number(row.new_value) })) as RevisionRow[];
  }

  return {
    ticker,
    reportDate,
    locked: Boolean(result),
    periods: earningsModelPeriods,
    metrics: earningsModelInputs,
    aggregate: aggregateEarningsModelCells(aggregateRows),
    stats: {
      participantCount: cases.length,
      bullCount: cases.filter((row) => row.thesis_case === "bull").length,
      baseCount: cases.filter((row) => row.thesis_case === "base").length,
      bearCount: cases.filter((row) => row.thesis_case === "bear").length,
    },
    street: street ?? null,
    result: result ?? null,
    ownModel,
    revisions,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { ticker, reportDate } = normalizeIdentity(url.searchParams.get("ticker"), url.searchParams.get("date"));
    await ensureEarningsIntelligenceSchema();
    let context: UserContext | undefined;
    if ((request.headers.get("authorization") ?? "").startsWith("Bearer ")) {
      try { context = await requireSupabaseUser(request); } catch { context = undefined; }
    }
    return Response.json(await loadModel(ticker, reportDate, context), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const context = await requireSupabaseUser(request);
    const payload = await request.json() as ModelPayload;
    const { ticker, reportDate } = normalizeIdentity(payload.ticker, payload.reportDate);
    const fiscalQuarter = String(payload.fiscalQuarter ?? "").trim().slice(0, 40);
    const thesisCase = payload.thesisCase ?? "base";
    const confidence = Math.round(Number(payload.confidence));
    const assumptionNote = String(payload.assumptionNote ?? "").trim();
    const sourceUrl = optionalHttpsUrl(payload.sourceUrl);
    const cells = normalizeCells(payload.cells);
    const cellCount = Object.values(cells).reduce((count, period) => count + Object.keys(period ?? {}).length, 0);
    if (!( ["bull", "base", "bear"] as const).includes(thesisCase) || !Number.isInteger(confidence) || confidence < 1 || confidence > 5) {
      return Response.json({ error: "Choose a valid case and confidence score." }, { status: 400 });
    }
    if (assumptionNote.length < 12 || assumptionNote.length > 1_500) {
      return Response.json({ error: "Explain the key assumptions in 12–1,500 characters." }, { status: 400 });
    }
    if (!cellCount) return Response.json({ error: "Enter at least one model value." }, { status: 400 });

    await ensureEarningsIntelligenceSchema();
    const reported = await env.DB.prepare("SELECT id FROM earnings_results WHERE ticker=? AND report_date=? LIMIT 1").bind(ticker, reportDate).first();
    if (reported) return Response.json({ error: "This report is locked because actual results have been captured." }, { status: 409 });

    const [existingCells, existingSubmission] = await Promise.all([
      context.supabase.from("earnings_model_cells").select("id,period_key,metric_key,value,version")
        .eq("user_id", context.user.id).eq("ticker", ticker).eq("report_date", reportDate),
      context.supabase.from("earnings_model_submissions").select("version")
        .eq("user_id", context.user.id).eq("ticker", ticker).eq("report_date", reportDate).maybeSingle(),
    ]);
    if (existingCells.error) throw existingCells.error;
    if (existingSubmission.error) throw existingSubmission.error;
    const existingRows = (existingCells.data ?? []).map((row) => ({ ...row, value: Number(row.value) })) as OwnCellRow[];
    const existing = new Map(existingRows.map((row) => [`${row.period_key}:${row.metric_key}`, row]));
    const desired = new Set<string>();
    const upserts: Array<Record<string, unknown>> = [];
    const revisions: Array<Record<string, unknown>> = [];
    for (const [periodKey, metrics] of Object.entries(cells)) {
      if (!isEarningsModelPeriodKey(periodKey)) continue;
      for (const [metricKey, value] of Object.entries(metrics ?? {})) {
        if (!isEarningsModelInputKey(metricKey) || value === undefined) continue;
        const identity = `${periodKey}:${metricKey}`;
        desired.add(identity);
        const prior = existing.get(identity);
        if (prior?.value === value) continue;
        const version = (prior?.version ?? 0) + 1;
        revisions.push({ user_id: context.user.id, ticker, report_date: reportDate, period_key: periodKey, metric_key: metricKey, old_value: prior?.value ?? null, new_value: value, version });
        upserts.push({ user_id: context.user.id, ticker, report_date: reportDate, period_key: periodKey, metric_key: metricKey, value, version });
      }
    }
    const stale = existingRows.filter((row) => !desired.has(`${row.period_key}:${row.metric_key}`));
    for (const row of stale) revisions.push({ user_id: context.user.id, ticker, report_date: reportDate, period_key: row.period_key, metric_key: row.metric_key, old_value: row.value, new_value: null, version: row.version + 1 });

    const submission = {
      user_id: context.user.id,
      ticker,
      report_date: reportDate,
      fiscal_quarter: fiscalQuarter,
      thesis_case: thesisCase,
      confidence,
      assumption_note: assumptionNote,
      source_url: sourceUrl,
      version: Number(existingSubmission.data?.version ?? 0) + 1,
    };
    const { error: submissionError } = await context.supabase.from("earnings_model_submissions").upsert(submission, { onConflict: "user_id,ticker,report_date" });
    if (submissionError) throw submissionError;
    if (revisions.length) {
      const { error } = await context.supabase.from("earnings_model_revisions").insert(revisions);
      if (error) throw error;
    }
    if (upserts.length) {
      const { error } = await context.supabase.from("earnings_model_cells").upsert(upserts, { onConflict: "user_id,ticker,report_date,period_key,metric_key" });
      if (error) throw error;
    }
    if (stale.length) {
      const { error } = await context.supabase.from("earnings_model_cells").delete().eq("user_id", context.user.id).in("id", stale.map((row) => row.id));
      if (error) throw error;
    }
    return Response.json({ ok: true, model: await loadModel(ticker, reportDate, context) });
  } catch (error) { return apiError(error); }
}
