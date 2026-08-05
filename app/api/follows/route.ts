import { apiError, getSupabaseAdminClient, requireSupabaseUser } from "../../supabase-server";
import { membersBlocked } from "../../community-safety";

export async function POST(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { username?: string; follow?: boolean };
    const username = String(payload.username ?? "").trim();
    if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) return Response.json({ error: "Member not found." }, { status: 404 });
    const { data: target, error: targetError } = await supabase.from("profiles").select("user_id,username")
      .ilike("username", username).eq("onboarding_complete", true).single();
    if (targetError || !target) return Response.json({ error: "Member not found." }, { status: 404 });
    if (target.user_id === profile.user_id) return Response.json({ error: "You cannot follow yourself." }, { status: 400 });
    if (payload.follow !== false && await membersBlocked(getSupabaseAdminClient(), profile.user_id, target.user_id)) {
      return Response.json({ error: "Following is unavailable between these accounts." }, { status: 403 });
    }

    const operation = payload.follow === false
      ? supabase.from("member_follows").delete().eq("follower_id", profile.user_id).eq("followed_id", target.user_id)
      : supabase.from("member_follows").upsert({ follower_id: profile.user_id, followed_id: target.user_id }, { onConflict: "follower_id,followed_id", ignoreDuplicates: true });
    const { error } = await operation;
    if (error) throw error;

    const { count } = await supabase.from("member_follows").select("follower_id", { count: "exact", head: true }).eq("followed_id", target.user_id);
    return Response.json({ username: target.username, following: payload.follow !== false, followerCount: count ?? 0 });
  } catch (error) {
    return apiError(error);
  }
}
