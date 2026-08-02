import { researchUniverse } from "../../data/universe";
import { fetchNasdaqQuotes, type MarketQuote } from "../../market-quotes";
import { apiError, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

const POSITION_META_PREFIX = "__LWYO_POSITION_V1__";

function storedDetails(value: unknown) {
  const stored = typeof value === "string" ? value : "";
  if (!stored.startsWith(POSITION_META_PREFIX)) return { notes: stored, averageCost: null as number | null };
  try {
    const parsed = JSON.parse(stored.slice(POSITION_META_PREFIX.length)) as { notes?: unknown; averageCost?: unknown };
    const averageCost = parsed.averageCost == null ? null : Number(parsed.averageCost);
    return { notes: typeof parsed.notes === "string" ? parsed.notes : "", averageCost: averageCost !== null && Number.isFinite(averageCost) && averageCost >= 0 ? averageCost : null };
  } catch {
    return { notes: stored, averageCost: null as number | null };
  }
}

function serializeDetails(notes: string, averageCost: number | null) {
  return POSITION_META_PREFIX + JSON.stringify({ notes, averageCost });
}

function positionPayload(row: Record<string, unknown>, quote: MarketQuote | undefined) {
  const details = storedDetails(row.notes);
  const shares = row.shares == null ? null : Number(row.shares);
  const currentPrice = quote?.price ?? null;
  const marketValue = shares != null && currentPrice != null ? shares * currentPrice : null;
  const costBasis = shares != null && details.averageCost != null ? shares * details.averageCost : null;
  const gainLoss = marketValue != null && costBasis != null ? marketValue - costBasis : null;
  const gainLossPercent = gainLoss != null && costBasis != null && costBasis > 0 ? gainLoss / costBasis * 100 : null;
  return {
    id: row.id,
    ticker: row.ticker,
    accountLabel: row.account_label,
    shares,
    averageCost: details.averageCost,
    currentPrice,
    marketValue,
    costBasis,
    gainLoss,
    gainLossPercent,
    notes: details.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    companyName: researchUniverse.find((company) => company.ticker === row.ticker)?.name ?? row.ticker,
    quote: quote ? { asOf: quote.asOf, marketStatus: quote.marketStatus, isRealTime: quote.isRealTime, sourceLabel: quote.sourceLabel, sourceUrl: quote.sourceUrl } : null,
  };
}

function numberOrNull(value: unknown) {
  if (value === "" || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

export async function GET(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const { data, error } = await supabase.from("portfolio_positions").select("*").eq("user_id", profile.user_id).order("created_at", { ascending: false });
    if (error) throw error;
    const quotes = await fetchNasdaqQuotes((data ?? []).map((row) => row.ticker));
    return Response.json({ positions: (data ?? []).map((row) => positionPayload(row, quotes.get(row.ticker))) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { ticker?: string; shares?: number | string; averageCost?: number | string; accountLabel?: string; notes?: string };
    const ticker = payload.ticker?.trim().toUpperCase() ?? "";
    if (!researchUniverse.some((company) => company.ticker === ticker)) return Response.json({ error: "Choose a ticker from the research universe." }, { status: 400 });
    const shares = numberOrNull(payload.shares);
    const averageCost = numberOrNull(payload.averageCost);
    if (Number.isNaN(shares)) return Response.json({ error: "Shares must be zero or a positive number." }, { status: 400 });
    if (Number.isNaN(averageCost)) return Response.json({ error: "Average purchase price must be zero or a positive number." }, { status: 400 });
    const notes = payload.notes?.trim().slice(0, 500) || "";
    const { data, error } = await supabase.from("portfolio_positions").insert({ user_id: profile.user_id, ticker, shares, account_label: payload.accountLabel?.trim().slice(0, 80) || "Primary portfolio", notes: serializeDetails(notes, averageCost) }).select("*").single();
    if (error) throw error;
    return Response.json({ position: data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { id?: number; shares?: number | string; averageCost?: number | string; accountLabel?: string; notes?: string };
    if (!Number.isInteger(payload.id)) return Response.json({ error: "Position id is required." }, { status: 400 });
    const shares = numberOrNull(payload.shares);
    const averageCost = numberOrNull(payload.averageCost);
    if (Number.isNaN(shares)) return Response.json({ error: "Shares must be zero or a positive number." }, { status: 400 });
    if (Number.isNaN(averageCost)) return Response.json({ error: "Average purchase price must be zero or a positive number." }, { status: 400 });
    const notes = payload.notes?.trim().slice(0, 500) || "";
    const { data, error } = await supabase.from("portfolio_positions").update({ shares, account_label: payload.accountLabel?.trim().slice(0, 80) || "Primary portfolio", notes: serializeDetails(notes, averageCost) }).eq("user_id", profile.user_id).eq("id", payload.id!).select("*").single();
    if (error) throw error;
    return Response.json({ position: data });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { id?: number };
    if (!Number.isInteger(payload.id)) return Response.json({ error: "Position id is required." }, { status: 400 });
    const { error } = await supabase.from("portfolio_positions").delete().eq("user_id", profile.user_id).eq("id", payload.id!);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
