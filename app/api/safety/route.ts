import { enforceActionRateLimit } from "../../community-safety";
import { apiError, getSupabaseAdminClient, requireSupabaseUser } from "../../supabase-server";
import { notifyPrivilegedReviewersSafely } from "../../admin-action-notifications";

export const dynamic = "force-dynamic";

const reportEntities = new Set(["member", "publication", "comment", "message", "contribution"]);
const reportReasons = new Set(["spam", "harassment", "misinformation", "copyright", "privacy", "conflict", "other"]);
function clean(value: unknown, limit: number) { return String(value ?? "").trim().slice(0, limit); }

export async function GET(request: Request) {
  try {
    const { profile } = await requireSupabaseUser(request);
    const admin = getSupabaseAdminClient();
    const [blocks, mutes, reports] = await Promise.all([
      admin.from("member_blocks").select("blocked_id,created_at,blocked:profiles!member_blocks_blocked_id_fkey(username,display_name)").eq("blocker_id", profile.user_id).order("created_at", { ascending: false }),
      admin.from("member_mutes").select("muted_id,created_at,muted:profiles!member_mutes_muted_id_fkey(username,display_name)").eq("muter_id", profile.user_id).order("created_at", { ascending: false }),
      admin.from("community_reports").select("id,entity_type,entity_id,reason_code,status,resolution,created_at,updated_at").eq("reporter_id", profile.user_id).order("created_at", { ascending: false }).limit(100),
    ]);
    if (blocks.error) throw blocks.error;
    if (mutes.error) throw mutes.error;
    if (reports.error) throw reports.error;
    return Response.json({ blocks: blocks.data ?? [], mutes: mutes.data ?? [], reports: reports.data ?? [] });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireSupabaseUser(request);
    const admin = getSupabaseAdminClient();
    const payload = await request.json() as Record<string, unknown>;
    const action = clean(payload.action, 20);
    if (["block", "unblock", "mute", "unmute"].includes(action)) {
      const username = clean(payload.username, 24);
      const { data: target } = await admin.from("profiles").select("user_id,username").ilike("username", username).eq("onboarding_complete", true).maybeSingle();
      if (!target) return Response.json({ error: "Member not found." }, { status: 404 });
      if (target.user_id === profile.user_id) return Response.json({ error: "You cannot change safety settings for yourself." }, { status: 400 });
      const blocking = action === "block" || action === "unblock";
      const table = blocking ? "member_blocks" : "member_mutes";
      const ownerColumn = blocking ? "blocker_id" : "muter_id";
      const targetColumn = blocking ? "blocked_id" : "muted_id";
      if (action === "block" || action === "mute") {
        const { error } = await admin.from(table).upsert({ [ownerColumn]: profile.user_id, [targetColumn]: target.user_id });
        if (error) throw error;
        if (action === "block") {
          await Promise.all([
            admin.from("member_follows").delete().eq("follower_id", profile.user_id).eq("followed_id", target.user_id),
            admin.from("member_follows").delete().eq("follower_id", target.user_id).eq("followed_id", profile.user_id),
          ]);
        }
      } else {
        const { error } = await admin.from(table).delete().eq(ownerColumn, profile.user_id).eq(targetColumn, target.user_id);
        if (error) throw error;
      }
      return Response.json({ username: target.username, action, active: action === "block" || action === "mute" });
    }
    if (action === "report") {
      await enforceActionRateLimit(admin, profile.user_id, "community_report", 10, 86400);
      const entityType = clean(payload.entityType, 20);
      const entityId = clean(payload.entityId, 80);
      const reasonCode = clean(payload.reasonCode, 30);
      const details = clean(payload.details, 2000);
      if (!reportEntities.has(entityType) || !entityId || !reportReasons.has(reasonCode)) return Response.json({ error: "Choose a valid item and report reason." }, { status: 400 });
      const { data, error } = await admin.from("community_reports").insert({ reporter_id: profile.user_id, entity_type: entityType, entity_id: entityId, reason_code: reasonCode, details }).select("id,status,created_at").single();
      if (error) throw error;
      await notifyPrivilegedReviewersSafely({
        actorId: profile.user_id,
        title: "Community report requires moderation",
        detail: `${reasonCode} report for ${entityType} ${entityId} · submitted by @${profile.username}`,
        href: "/admin#community-safety",
        entityType: "community_report_review",
        entityId: data.id,
      });
      return Response.json({ report: data }, { status: 201 });
    }
    return Response.json({ error: "Choose a safety action." }, { status: 400 });
  } catch (error) { return apiError(error); }
}
