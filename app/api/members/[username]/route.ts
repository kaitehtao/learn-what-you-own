import { apiError, getSupabaseForRequest, publicProfilePhotoUrl } from "../../../supabase-server";

export const dynamic = "force-dynamic";

type RelatedProfile = { username?: string; display_name?: string } | Array<{ username?: string; display_name?: string }> | null;

function oneProfile(value: RelatedProfile) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function GET(request: Request, context: { params: Promise<{ username: string }> }) {
  try {
    const username = decodeURIComponent((await context.params).username).trim();
    if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) return Response.json({ error: "Member not found." }, { status: 404 });
    const supabase = getSupabaseForRequest(request);
    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("user_id,username,display_name,role,bio,avatar_path,created_at")
      .ilike("username", username)
      .eq("onboarding_complete", true)
      .single();
    if (profileError || !profile) return Response.json({ error: "Member not found." }, { status: 404 });

    const [{ data: followerRows, error: followersError }, { data: followingRows, error: followingError }, { data: publicMessages, error: messagesError }, { data: researchRows, error: researchError }] = await Promise.all([
      supabase.from("member_follows")
        .select("created_at,follower:profiles!member_follows_follower_id_fkey(username,display_name)")
        .eq("followed_id", profile.user_id).order("created_at", { ascending: false }).limit(100),
      supabase.from("member_follows")
        .select("created_at,followed:profiles!member_follows_followed_id_fkey(username,display_name)")
        .eq("follower_id", profile.user_id).order("created_at", { ascending: false }).limit(100),
      supabase.from("private_messages")
        .select("id,subject,body,created_at,sender:profiles!private_messages_sender_id_fkey(username,display_name)")
        .eq("recipient_id", profile.user_id).eq("visibility", "public")
        .is("sender_deleted_at", null).is("recipient_deleted_at", null)
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("contributions")
        .select("ticker,contribution_type,expertise")
        .eq("user_id", profile.user_id).eq("status", "approved")
        .order("created_at", { ascending: false }).limit(250),
    ]);
    if (followersError) throw followersError;
    if (followingError) throw followingError;
    if (messagesError) throw messagesError;
    if (researchError) throw researchError;

    const authorization = request.headers.get("authorization") ?? "";
    let viewerId = "";
    if (authorization.startsWith("Bearer ")) {
      const { data: { user } } = await supabase.auth.getUser(authorization.slice(7).trim());
      viewerId = user?.id ?? "";
    }
    let isFollowing = false;
    if (viewerId && viewerId !== profile.user_id) {
      const { count } = await supabase.from("member_follows").select("followed_id", { count: "exact", head: true })
        .eq("follower_id", viewerId).eq("followed_id", profile.user_id);
      isFollowing = (count ?? 0) > 0;
    }

    return Response.json({
      profile: {
        username: profile.username,
        displayName: profile.display_name,
        role: profile.role,
        bio: profile.bio ?? "",
        avatarUrl: publicProfilePhotoUrl(profile.avatar_path),
        joinedAt: profile.created_at,
      },
      researchActivity: {
        approvedContributions: researchRows?.length ?? 0,
        companiesCovered: new Set((researchRows ?? []).map(row => row.ticker)).size,
        expertise: Array.from(new Set((researchRows ?? []).flatMap(row => String(row.expertise ?? "").split(",").map(value => value.trim()).filter(Boolean)))).slice(0, 6),
      },
      followerCount: followerRows?.length ?? 0,
      followingCount: followingRows?.length ?? 0,
      followers: (followerRows ?? []).map(row => oneProfile(row.follower as RelatedProfile)).filter(Boolean),
      following: (followingRows ?? []).map(row => oneProfile(row.followed as RelatedProfile)).filter(Boolean),
      publicMessages: (publicMessages ?? []).map(row => ({
        id: row.id,
        subject: row.subject,
        body: row.body,
        createdAt: row.created_at,
        sender: oneProfile(row.sender as RelatedProfile),
      })),
      isFollowing,
      isOwnProfile: viewerId === profile.user_id,
      signedIn: Boolean(viewerId),
    }, { headers: { "cache-control": viewerId ? "private, no-store" : "public, max-age=60, s-maxage=300" } });
  } catch (error) {
    return apiError(error);
  }
}
