import { apiError, requireEditor } from "../../../supabase-server";

export const dynamic = "force-dynamic";

function mapRow(row: Record<string, unknown>) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    userId: row.user_id,
    username: (profile as { username?: string } | null)?.username ?? "member",
    ticker: row.ticker,
    contributionType: row.contribution_type,
    claim: row.claim,
    whyItMatters: row.why_it_matters,
    sourceUrl: row.source_url,
    positionDisclosure: row.position_disclosure,
    status: row.status,
    moderationNote: row.moderation_note,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  try {
    const { supabase } = await requireEditor(request);
    const { data, error } = await supabase
      .from("contributions")
      .select("*,profiles!contributions_user_id_fkey(username)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return Response.json({ contributions: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)) });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile, supabase } = await requireEditor(request);
    const payload = await request.json() as { id?: number; status?: string; moderationNote?: string };
    if (!Number.isInteger(payload.id) || !["approved", "needs_revision", "rejected"].includes(payload.status ?? "")) {
      return Response.json({ error: "A valid submission and moderation decision are required." }, { status: 400 });
    }
    const { error } = await supabase.from("contributions").update({
      status: payload.status,
      moderation_note: payload.moderationNote?.trim().slice(0, 1000) ?? "",
      moderated_by: profile.user_id,
      moderated_at: new Date().toISOString(),
    }).eq("id", payload.id!);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
