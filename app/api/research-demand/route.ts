import { researchUniverse } from "../../data/universe";
import { apiError, getSupabaseAdminClient, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

function companyTicker(value: unknown) {
  const ticker = typeof value === "string" ? value.trim().toUpperCase() : "";
  return researchUniverse.some((company) => company.ticker === ticker) ? ticker : "";
}

async function viewerVotes(request: Request) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return [] as string[];
  const admin = getSupabaseAdminClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return [] as string[];
  const { data } = await admin.from("company_research_votes").select("ticker").eq("user_id", user.id);
  return (data ?? []).map((row) => String(row.ticker));
}

export async function GET(request: Request) {
  try {
    const admin = getSupabaseAdminClient();
    const [{ data, error }, votedTickers] = await Promise.all([
      admin.rpc("company_research_demand"),
      viewerVotes(request),
    ]);
    if (error) throw error;
    return Response.json({ companies: data ?? [], viewerVotes: votedTickers }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { ticker?: string };
    const ticker = companyTicker(payload.ticker);
    if (!ticker) return Response.json({ error: "Choose a ticker from the research universe." }, { status: 400 });
    const { error } = await supabase.from("company_research_votes").upsert({ user_id: profile.user_id, ticker }, { onConflict: "user_id,ticker", ignoreDuplicates: true });
    if (error) throw error;
    return Response.json({ ok: true, ticker, voted: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { ticker?: string };
    const ticker = companyTicker(payload.ticker);
    if (!ticker) return Response.json({ error: "Choose a ticker from the research universe." }, { status: 400 });
    const { error } = await supabase.from("company_research_votes").delete().eq("user_id", profile.user_id).eq("ticker", ticker);
    if (error) throw error;
    return Response.json({ ok: true, ticker, voted: false });
  } catch (error) {
    return apiError(error);
  }
}
