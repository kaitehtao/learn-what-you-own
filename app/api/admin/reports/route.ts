import { apiError, getSupabaseAdminClient, requireEditor } from "../../../supabase-server";

export const dynamic = "force-dynamic";
const decisions = new Set(["reviewing", "resolved", "dismissed"]);
function clean(value: unknown, limit: number) { return String(value ?? "").trim().slice(0, limit); }

export async function GET(request: Request) {
  try {
    await requireEditor(request);
    const admin = getSupabaseAdminClient();
    const status = clean(new URL(request.url).searchParams.get("status"), 20) || "open";
    const { data, error } = await admin.from("community_reports").select("id,entity_type,entity_id,reason_code,details,status,resolution,created_at,reporter:profiles!community_reports_reporter_id_fkey(username)").eq("status", status).order("created_at").limit(250);
    if (error) throw error;
    return Response.json({ reports: data ?? [] });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireEditor(request);
    const admin = getSupabaseAdminClient();
    const payload = await request.json() as Record<string, unknown>;
    const id = Number(payload.id);
    const status = clean(payload.status, 20);
    const resolution = clean(payload.resolution, 2000);
    if (!Number.isInteger(id) || id < 1 || !decisions.has(status)) return Response.json({ error: "Choose a report and valid status." }, { status: 400 });
    if (["resolved", "dismissed"].includes(status) && !resolution) return Response.json({ error: "Record a resolution before closing a report." }, { status: 400 });
    const { data, error } = await admin.from("community_reports").update({ status, resolution, assigned_to: profile.user_id, resolved_at: ["resolved", "dismissed"].includes(status) ? new Date().toISOString() : null }).eq("id", id).select("id,entity_type,entity_id,reason_code,status,resolution,updated_at").single();
    if (error) throw error;
    await admin.from("moderation_actions").insert({ actor_id: profile.user_id, actor_username: profile.username, action: `report_${status}`, reason_code: data.reason_code, entity_type: data.entity_type, entity_id: data.entity_id, detail: { reportId: id, resolution } });
    return Response.json({ report: data });
  } catch (error) { return apiError(error); }
}
