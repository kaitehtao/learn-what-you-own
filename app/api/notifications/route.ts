import { apiError, requireSupabaseUser } from "../../supabase-server";
import { notificationEmailAvailable } from "../../email-notifications";

export const dynamic = "force-dynamic";

function publicNotification(row: Record<string, unknown>) {
  return { id: row.id, kind: row.kind, title: row.title, detail: row.detail, href: row.href, readAt: row.read_at, createdAt: row.created_at };
}

export async function GET(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    await supabase.from("notification_preferences").upsert({ user_id: profile.user_id }, { onConflict: "user_id", ignoreDuplicates: true });
    const compact = new URL(request.url).searchParams.get("compact") === "1";
    const [notificationsResult, unreadResult, preferenceResult] = await Promise.all([
      supabase.from("notifications").select("id,kind,title,detail,href,read_at,created_at").eq("user_id", profile.user_id).order("created_at", { ascending: false }).limit(compact ? 6 : 100),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", profile.user_id).is("read_at", null),
      supabase.from("notification_preferences").select("email_frequency,email_message_preview").eq("user_id", profile.user_id).single(),
    ]);
    if (notificationsResult.error) throw notificationsResult.error;
    if (unreadResult.error) throw unreadResult.error;
    if (preferenceResult.error) throw preferenceResult.error;
    return Response.json({ notifications: (notificationsResult.data ?? []).map((row) => publicNotification(row)), unread: unreadResult.count ?? 0, preferences: { emailFrequency: preferenceResult.data.email_frequency, emailMessagePreview: preferenceResult.data.email_message_preview }, emailAvailable: notificationEmailAvailable() });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { action?: string; id?: number; emailFrequency?: string; emailMessagePreview?: boolean };
    if (payload.action === "read_all") {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", profile.user_id).is("read_at", null);
      if (error) throw error;
      return Response.json({ updated: true });
    }
    if (payload.action === "read") {
      const id = Number(payload.id);
      if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Choose a valid notification." }, { status: 400 });
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", profile.user_id).eq("id", id);
      if (error) throw error;
      return Response.json({ updated: true });
    }
    if (payload.action === "preferences") {
      const frequency = ["off", "immediate", "daily"].includes(String(payload.emailFrequency)) ? String(payload.emailFrequency) : "off";
      if (frequency !== "off" && !notificationEmailAvailable()) return Response.json({ error: "Email delivery is not configured yet." }, { status: 503 });
      const { data, error } = await supabase.from("notification_preferences").upsert({ user_id: profile.user_id, email_frequency: frequency, email_message_preview: Boolean(payload.emailMessagePreview) }, { onConflict: "user_id" }).select("email_frequency,email_message_preview").single();
      if (error) throw error;
      return Response.json({ preferences: { emailFrequency: data.email_frequency, emailMessagePreview: data.email_message_preview } });
    }
    return Response.json({ error: "Choose a notification action." }, { status: 400 });
  } catch (error) {
    return apiError(error);
  }
}
