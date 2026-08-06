import { apiError, getSupabaseAdminClient, publicProfilePhotoUrl, requireSupabaseUser } from "../../supabase-server";
import { notifyPrivilegedReviewersSafely } from "../../admin-action-notifications";

export const dynamic = "force-dynamic";

function optionalWebUrl(value: unknown, type: "linkedin" | "website") {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  let parsed: URL;
  const invalid = (message: string) => new Response(JSON.stringify({ error: message }), { status: 400, headers: { "content-type": "application/json" } });
  try { parsed = new URL(raw); } catch { throw invalid(`${type === "linkedin" ? "LinkedIn" : "Website"} must be a complete https:// link.`); }
  if (parsed.protocol !== "https:") throw invalid("Professional links must use https://.");
  if (type === "linkedin" && !/(^|\.)linkedin\.com$/i.test(parsed.hostname)) throw invalid("Enter a valid LinkedIn profile URL.");
  if (raw.length > 300) throw invalid("Professional links must be 300 characters or fewer.");
  return parsed.toString();
}

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
    const { profile, user } = await requireSupabaseUser(request);
    const payload = await request.json() as { username?: string; displayName?: string; bio?: string; investmentStyle?: string; timeHorizon?: string; expertiseAreas?: string; linkedinUrl?: string; websiteUrl?: string; credentialSummary?: string };
    const username = String(payload.username ?? "").trim();
    const displayName = String(payload.displayName ?? "").trim();
    const bio = String(payload.bio ?? profile.bio ?? "").trim();
    const investmentStyle = String(payload.investmentStyle ?? profile.investment_style ?? "").trim();
    const timeHorizon = String(payload.timeHorizon ?? profile.time_horizon ?? "").trim();
    const expertiseAreas = String(payload.expertiseAreas ?? profile.expertise_areas ?? "").trim();
    const credentialSummary = String(payload.credentialSummary ?? profile.credential_summary ?? "").trim();
    const linkedinUrl = optionalWebUrl(payload.linkedinUrl ?? profile.linkedin_url, "linkedin");
    const websiteUrl = optionalWebUrl(payload.websiteUrl ?? profile.website_url, "website");
    if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) {
      return Response.json({ error: "Username must be 3–24 letters, numbers, or underscores." }, { status: 400 });
    }
    if (bio.length > 500) return Response.json({ error: "Biography must be 500 characters or fewer." }, { status: 400 });
    if (investmentStyle.length > 160 || timeHorizon.length > 80 || expertiseAreas.length > 240 || credentialSummary.length > 240) {
      return Response.json({ error: "One or more public profile fields are too long." }, { status: 400 });
    }
    const admin = getSupabaseAdminClient();
    const { error } = await admin.rpc("server_update_own_profile", {
      actor_user_id: user.id,
      new_username: username,
      new_display_name: (displayName || username).slice(0, 80),
    });
    if (error?.code === "23505") return Response.json({ error: "That username is already taken." }, { status: 409 });
    if (error) throw error;
    const linksChanged = linkedinUrl !== profile.linkedin_url || websiteUrl !== profile.website_url;
    const credentialChanged = credentialSummary !== profile.credential_summary;
    const { data: publicProfile, error: publicProfileError } = await admin.from("profiles")
      .update({
        bio,
        investment_style: investmentStyle,
        time_horizon: timeHorizon,
        expertise_areas: expertiseAreas,
        linkedin_url: linkedinUrl,
        website_url: websiteUrl,
        links_status: linksChanged ? (linkedinUrl || websiteUrl ? "pending" : "unreviewed") : profile.links_status,
        credential_summary: credentialSummary,
        credential_status: credentialChanged ? (credentialSummary ? "pending" : "unverified") : profile.credential_status,
        credential_verified_by: credentialChanged ? null : profile.credential_verified_by,
        credential_verified_at: credentialChanged ? null : profile.credential_verified_at,
      })
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (publicProfileError) throw publicProfileError;
    if ((linksChanged && (linkedinUrl || websiteUrl)) || (credentialChanged && credentialSummary)) {
      await notifyPrivilegedReviewersSafely({
        actorId: profile.user_id,
        title: "Member profile requires verification",
        detail: `@${username} updated ${linksChanged && credentialChanged ? "professional links and credentials" : linksChanged ? "professional links" : "credentials"}`,
        href: "/admin#accounts",
        entityType: "member_profile_review",
        entityId: Date.now(),
      });
    }
    return Response.json({ profile: { ...publicProfile, avatar_url: publicProfilePhotoUrl(publicProfile.avatar_path) } });
  } catch (error) {
    return apiError(error);
  }
}
