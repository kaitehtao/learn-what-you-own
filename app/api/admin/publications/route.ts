import { apiError, getSupabaseAdminClient, requireEditor } from "../../../supabase-server";

export const dynamic = "force-dynamic";

const fields = "id,user_id,author_username,title,summary,tickers,citations,position_disclosure,conflict_disclosure,visibility,status,editorial_status,revision_number,created_at,updated_at,published_at";
const decisions = new Set(["approved", "changes_requested", "rejected"]);

function clean(value: unknown, limit: number) { return String(value ?? "").trim().slice(0, limit); }

export async function GET(request: Request) {
  try {
    await requireEditor(request);
    const admin = getSupabaseAdminClient();
    const status = new URL(request.url).searchParams.get("status") ?? "pending";
    const { data, error } = await admin.from("research_publications").select(fields).eq("editorial_status", status).order("updated_at", { ascending: false }).limit(200);
    if (error) throw error;
    return Response.json({ publications: data ?? [] });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireEditor(request);
    const admin = getSupabaseAdminClient();
    const payload = await request.json() as Record<string, unknown>;
    const id = Number(payload.id);
    const decision = clean(payload.decision, 30);
    const reason = clean(payload.reason, 1000);
    if (!Number.isInteger(id) || id < 1 || !decisions.has(decision)) return Response.json({ error: "Choose a publication and editorial decision." }, { status: 400 });
    if (decision !== "approved" && !reason) return Response.json({ error: "A review reason is required." }, { status: 400 });
    const { data: publication } = await admin.from("research_publications").select(fields).eq("id", id).maybeSingle();
    if (!publication) return Response.json({ error: "Publication not found." }, { status: 404 });
    const approved = decision === "approved";
    const { data, error } = await admin.from("research_publications").update({ editorial_status: decision, status: approved ? "published" : "draft", published_at: approved ? new Date().toISOString() : null }).eq("id", id).select(fields).single();
    if (error) throw error;
    await admin.from("moderation_actions").insert({ actor_id: profile.user_id, actor_username: profile.username, action: `publication_${decision}`, reason_code: "editorial_review", entity_type: "publication", entity_id: String(id), detail: { reason } });
    if (approved && ["public", "followers"].includes(String(publication.visibility))) {
      const { data: followers } = await admin.from("member_follows").select("follower_id").eq("followed_id", publication.user_id);
      const notifications = (followers ?? []).map(row => ({ user_id: row.follower_id, actor_id: publication.user_id, kind: "research_publication", title: `New research from @${publication.author_username}`, detail: clean(publication.title, 160), href: `/research/community?id=${id}`, entity_type: "research_publication", entity_id: id }));
      if (notifications.length) await admin.from("notifications").upsert(notifications, { onConflict: "user_id,entity_type,entity_id", ignoreDuplicates: true });
    }
    return Response.json({ publication: data });
  } catch (error) { return apiError(error); }
}
