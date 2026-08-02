import { apiError, getSupabaseAdminClient, publicProfilePhotoUrl, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { profile, user, supabase } = await requireSupabaseUser(request);
    const [followers, following] = await Promise.all([
      supabase.from("member_follows").select("follower_id", { count: "exact", head: true }).eq("followed_id", profile.user_id),
      supabase.from("member_follows").select("followed_id", { count: "exact", head: true }).eq("follower_id", profile.user_id),
    ]);
    if (followers.error) throw followers.error;
    if (following.error) throw following.error;
    return Response.json({
      profile: { ...profile, avatar_url: publicProfilePhotoUrl(profile.avatar_path) },
      email: user.email,
      followerCount: followers.count ?? 0,
      followingCount: following.count ?? 0,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile, supabase, user } = await requireSupabaseUser(request);
    const payload = await request.json() as { username?: string; displayName?: string; bio?: string };
    const username = String(payload.username ?? "").trim();
    const displayName = String(payload.displayName ?? "").trim();
    const bio = String(payload.bio ?? profile.bio ?? "").trim();
    if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) {
      return Response.json({ error: "Username must be 3–24 letters, numbers, or underscores." }, { status: 400 });
    }
    if (bio.length > 500) return Response.json({ error: "Biography must be 500 characters or fewer." }, { status: 400 });
    const { error } = await supabase.rpc("update_own_profile", {
      new_username: username,
      new_display_name: (displayName || username).slice(0, 80),
    });
    if (error?.code === "23505") return Response.json({ error: "That username is already taken." }, { status: 409 });
    if (error) throw error;
    const admin = getSupabaseAdminClient();
    const { data: publicProfile, error: publicProfileError } = await admin.from("profiles")
      .update({ bio })
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (publicProfileError) throw publicProfileError;
    return Response.json({ profile: { ...publicProfile, avatar_url: publicProfilePhotoUrl(publicProfile.avatar_path) } });
  } catch (error) {
    return apiError(error);
  }
}
