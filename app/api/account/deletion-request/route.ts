import { apiError, getSupabaseAdminClient, requireSupabaseUser } from "../../../supabase-server";
import { notifyPrivilegedReviewersSafely } from "../../../admin-action-notifications";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { user } = await requireSupabaseUser(request);
    const { data, error } = await getSupabaseAdminClient().from("account_deletion_requests").select("id,status,requested_at,resolved_at").eq("user_id", user.id).order("requested_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return Response.json({ request: data });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, profile } = await requireSupabaseUser(request);
    const payload = await request.json() as { confirmation?: string };
    if (payload.confirmation !== `REQUEST DELETE @${profile.username}`) return Response.json({ error: `Type REQUEST DELETE @${profile.username} to confirm.` }, { status: 400 });
    const admin = getSupabaseAdminClient();
    const { data: existing, error: existingError } = await admin.from("account_deletion_requests").select("id,status,requested_at,resolved_at").eq("user_id", user.id).eq("status", "requested").maybeSingle();
    if (existingError) throw existingError;
    if (existing) return Response.json({ request: existing });
    const { data, error } = await admin.from("account_deletion_requests").insert({ user_id: user.id }).select("id,status,requested_at,resolved_at").single();
    if (error) throw error;
    await notifyPrivilegedReviewersSafely({
      actorId: profile.user_id,
      title: "Account deletion request requires administrator action",
      detail: `@${profile.username} requested account deletion`,
      href: "/admin#accounts",
      entityType: "account_deletion_review",
      entityId: data.id,
    });
    return Response.json({ request: data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await requireSupabaseUser(request);
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin.from("account_deletion_requests").update({ status: "cancelled", resolved_at: new Date().toISOString() }).eq("user_id", user.id).eq("status", "requested").select("id").maybeSingle();
    if (error) throw error;
    return Response.json({ cancelled: Boolean(data) });
  } catch (error) {
    return apiError(error);
  }
}
