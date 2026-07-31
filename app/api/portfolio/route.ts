import { researchUniverse } from "../../data/universe";
import { apiError, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const { data, error } = await supabase.from("portfolio_positions").select("*").eq("user_id", profile.user_id).order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ positions: (data ?? []).map((row) => ({ id: row.id, ticker: row.ticker, accountLabel: row.account_label, shares: row.shares, notes: row.notes, createdAt: row.created_at, companyName: researchUniverse.find((company) => company.ticker === row.ticker)?.name ?? row.ticker })) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { ticker?: string; shares?: number | string; accountLabel?: string; notes?: string };
    const ticker = payload.ticker?.trim().toUpperCase() ?? "";
    if (!researchUniverse.some((company) => company.ticker === ticker)) return Response.json({ error: "Choose a ticker from the research universe." }, { status: 400 });
    const shares = payload.shares === "" || payload.shares == null ? null : Number(payload.shares);
    if (shares != null && (!Number.isFinite(shares) || shares < 0)) return Response.json({ error: "Shares must be a positive number." }, { status: 400 });
    const { data, error } = await supabase.from("portfolio_positions").insert({ user_id: profile.user_id, ticker, shares, account_label: payload.accountLabel?.trim().slice(0, 80) || "Primary portfolio", notes: payload.notes?.trim().slice(0, 500) || "" }).select("*").single();
    if (error) throw error;
    return Response.json({ position: data }, { status: 201 });
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
