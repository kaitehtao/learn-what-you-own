import { env } from "cloudflare:workers";
import { ensureEarningsIntelligenceSchema } from "../../../../db/runtimeSchema";
import { loadEarningsIntelligence } from "../../../earnings-intelligence";
import { requireSupabaseUser } from "../../../supabase-server";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TICKER_PATTERN = /^[A-Z0-9.-]{1,12}$/;

type EstimatePayload = {
  ticker?: string;
  reportDate?: string;
  fiscalQuarter?: string;
  epsEstimate?: number | null;
  revenueEstimateMillions?: number | null;
  thesisCase?: "bull" | "base" | "bear";
  confidence?: number;
  keyDriver?: string;
};

function normalizedQuery(url: URL) {
  const ticker = (url.searchParams.get("ticker") ?? "").trim().toUpperCase();
  const reportDate = (url.searchParams.get("date") ?? "").trim();
  if (!TICKER_PATTERN.test(ticker) || !DATE_PATTERN.test(reportDate)) {
    throw new Response(JSON.stringify({ error: "Use a valid ticker and report date." }), { status: 400, headers: { "content-type": "application/json" } });
  }
  return { ticker, reportDate };
}

function finiteOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export async function GET(request: Request) {
  try {
    const { ticker, reportDate } = normalizedQuery(new URL(request.url));
    await ensureEarningsIntelligenceSchema();
    const aggregate = (await loadEarningsIntelligence(reportDate, [ticker])).get(ticker) ?? null;
    let ownEstimate = null;
    if ((request.headers.get("authorization") ?? "").startsWith("Bearer ")) {
      try {
        const { user } = await requireSupabaseUser(request);
        ownEstimate = await env.DB.prepare(`SELECT eps_estimate AS epsEstimate,
          revenue_estimate_millions AS revenueEstimateMillions,thesis_case AS thesisCase,
          confidence,key_driver AS keyDriver,updated_at AS updatedAt
          FROM earnings_community_estimates WHERE user_id=? AND ticker=? AND report_date=? LIMIT 1`)
          .bind(user.id, ticker, reportDate).first();
      } catch {
        ownEstimate = null;
      }
    }
    return Response.json({ ticker, reportDate, aggregate, ownEstimate }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Unable to load community estimate", error);
    return Response.json({ error: "Unable to load the earnings estimate." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, profile } = await requireSupabaseUser(request);
    const payload = await request.json() as EstimatePayload;
    const ticker = (payload.ticker ?? "").trim().toUpperCase();
    const reportDate = (payload.reportDate ?? "").trim();
    const fiscalQuarter = (payload.fiscalQuarter ?? "").trim().slice(0, 40);
    const epsEstimate = finiteOrNull(payload.epsEstimate);
    const revenueEstimateMillions = finiteOrNull(payload.revenueEstimateMillions);
    const thesisCase = payload.thesisCase ?? "base";
    const confidence = Math.round(Number(payload.confidence));
    const keyDriver = (payload.keyDriver ?? "").trim();
    if (!TICKER_PATTERN.test(ticker) || !DATE_PATTERN.test(reportDate)) {
      return Response.json({ error: "Use a valid ticker and report date." }, { status: 400 });
    }
    if (epsEstimate === null && revenueEstimateMillions === null) {
      return Response.json({ error: "Enter an EPS estimate, a revenue estimate, or both." }, { status: 400 });
    }
    if (epsEstimate !== null && (epsEstimate < -1_000 || epsEstimate > 1_000)) {
      return Response.json({ error: "EPS estimate is outside the supported range." }, { status: 400 });
    }
    if (revenueEstimateMillions !== null && (revenueEstimateMillions < 0 || revenueEstimateMillions > 10_000_000)) {
      return Response.json({ error: "Revenue must be entered in USD millions." }, { status: 400 });
    }
    if (!(["bull", "base", "bear"] as const).includes(thesisCase) || !Number.isInteger(confidence) || confidence < 1 || confidence > 5) {
      return Response.json({ error: "Choose a valid case and confidence score." }, { status: 400 });
    }
    if (keyDriver.length < 12 || keyDriver.length > 500) {
      return Response.json({ error: "Explain the key driver in 12–500 characters." }, { status: 400 });
    }
    await ensureEarningsIntelligenceSchema();
    const reported = await env.DB.prepare("SELECT id FROM earnings_results WHERE ticker=? AND report_date=? LIMIT 1")
      .bind(ticker, reportDate).first();
    if (reported) return Response.json({ error: "This company has already reported. Estimates are locked for scoring." }, { status: 409 });

    await env.DB.prepare(`INSERT INTO earnings_community_estimates
      (user_id,username,ticker,report_date,fiscal_quarter,eps_estimate,revenue_estimate_millions,thesis_case,confidence,key_driver)
      VALUES (?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(user_id,ticker,report_date) DO UPDATE SET
        username=excluded.username,
        fiscal_quarter=excluded.fiscal_quarter,
        eps_estimate=excluded.eps_estimate,
        revenue_estimate_millions=excluded.revenue_estimate_millions,
        thesis_case=excluded.thesis_case,
        confidence=excluded.confidence,
        key_driver=excluded.key_driver,
        updated_at=CURRENT_TIMESTAMP`)
      .bind(user.id, profile.username, ticker, reportDate, fiscalQuarter, epsEstimate, revenueEstimateMillions, thesisCase, confidence, keyDriver)
      .run();
    const aggregate = (await loadEarningsIntelligence(reportDate, [ticker])).get(ticker) ?? null;
    return Response.json({ ok: true, aggregate });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Unable to save community estimate", error);
    return Response.json({ error: "Unable to save the earnings estimate." }, { status: 500 });
  }
}
