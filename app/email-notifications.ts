import { env } from "cloudflare:workers";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./supabase-server";

function environmentValue(name: string) {
  const workerValue = (env as unknown as Record<string, unknown>)[name];
  if (typeof workerValue === "string" && workerValue) return workerValue;
  return process.env[name];
}

function configuration() {
  return {
    resendKey: environmentValue("RESEND_API_KEY"),
    serviceRoleKey: environmentValue("SUPABASE_SERVICE_ROLE_KEY"),
    fromEmail: environmentValue("NOTIFICATION_FROM_EMAIL"),
    siteUrl: (environmentValue("NOTIFICATION_SITE_URL") ?? "https://learnwhatyouown.com").replace(/\/$/, ""),
  };
}

export function notificationEmailAvailable() {
  const config = configuration();
  return Boolean(config.resendKey && config.serviceRoleKey && config.fromEmail);
}

function adminClient(serviceRoleKey: string) {
  const { url } = getPublicSupabaseConfig();
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

async function sendEmail(to: string, subject: string, html: string) {
  const config = configuration();
  if (!config.resendKey || !config.fromEmail) throw new Error("Email delivery is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.resendKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from: config.fromEmail, to: [to], subject, html }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}

export async function deliverImmediateMessageEmail(input: { recipientId: string; messageId: number; senderUsername: string; subject: string; visibility: "private" | "public" }) {
  const config = configuration();
  if (!config.resendKey || !config.serviceRoleKey || !config.fromEmail) return { status: "not_configured" as const };
  const supabase = adminClient(config.serviceRoleKey);
  const { data: preference } = await supabase.from("notification_preferences").select("email_frequency,email_message_preview").eq("user_id", input.recipientId).maybeSingle();
  if (preference?.email_frequency !== "immediate") return { status: "not_immediate" as const };

  const [{ data: userData, error: userError }, { data: notification }] = await Promise.all([
    supabase.auth.admin.getUserById(input.recipientId),
    supabase.from("notifications").select("id").eq("user_id", input.recipientId).eq("entity_type", "message").eq("entity_id", input.messageId).maybeSingle(),
  ]);
  if (userError || !userData.user.email) throw userError ?? new Error("Recipient email is unavailable");
  const destination = `${config.siteUrl}/messages?open=${input.messageId}`;
  const visibleSubject = preference.email_message_preview ? escapeHtml(input.subject) : "Open Learn What You Own to view the subject.";
  const kind = input.visibility === "public" ? "public message" : "private message";
  try {
    await sendEmail(
      userData.user.email,
      `New ${kind} from @${input.senderUsername}`,
      `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#18372d"><p style="font-size:12px;letter-spacing:.08em;color:#287052">LEARN WHAT YOU OWN</p><h1 style="font-family:Georgia,serif;font-weight:400">You received a new ${kind}.</h1><p><strong>@${escapeHtml(input.senderUsername)}</strong> sent you a message.</p><p style="padding:16px;background:#f0f5f2">${visibleSubject}</p><p>The private message body is never included in notification email.</p><p><a href="${destination}" style="display:inline-block;background:#18372d;color:#fff;text-decoration:none;padding:12px 18px">Open your message</a></p><p style="font-size:12px;color:#64736d">Change email frequency or disable these alerts in <a href="${config.siteUrl}/notifications">notification settings</a>.</p></div>`,
    );
    if (notification?.id) await supabase.from("email_notification_outbox").update({ status: "sent", sent_at: new Date().toISOString(), attempts: 1, last_error: "" }).eq("notification_id", notification.id);
    return { status: "sent" as const };
  } catch (error) {
    if (notification?.id) await supabase.from("email_notification_outbox").update({ status: "failed", attempts: 1, last_error: error instanceof Error ? error.message.slice(0, 500) : "Delivery failed" }).eq("notification_id", notification.id);
    throw error;
  }
}

export async function deliverDueDailyDigests() {
  const config = configuration();
  if (!config.resendKey || !config.serviceRoleKey || !config.fromEmail) throw new Error("Email delivery is not configured");
  const supabase = adminClient(config.serviceRoleKey);
  const { data: due, error } = await supabase.from("email_notification_outbox").select("id,notification_id,user_id")
    .eq("status", "queued").eq("frequency", "daily").lte("next_attempt_at", new Date().toISOString()).order("next_attempt_at").limit(200);
  if (error) throw error;
  const grouped = new Map<string, Array<{ id: number; notification_id: number }>>();
  for (const row of due ?? []) grouped.set(row.user_id, [...(grouped.get(row.user_id) ?? []), row]);
  let delivered = 0;
  for (const [userId, rows] of grouped) {
    const ids = rows.map((row) => row.notification_id);
    const [{ data: userData }, { data: notifications }] = await Promise.all([
      supabase.auth.admin.getUserById(userId),
      supabase.from("notifications").select("title,detail,href,created_at").in("id", ids).order("created_at", { ascending: false }),
    ]);
    if (!userData.user?.email || !notifications?.length) continue;
    const items = notifications.map((item) => `<li style="margin-bottom:12px"><strong>${escapeHtml(item.title)}</strong><br><span>${escapeHtml(item.detail)}</span><br><a href="${config.siteUrl}${item.href}">Open message</a></li>`).join("");
    try {
      await sendEmail(userData.user.email, `${notifications.length} new Learn What You Own notification${notifications.length === 1 ? "" : "s"}`, `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#18372d"><p style="font-size:12px;letter-spacing:.08em;color:#287052">LEARN WHAT YOU OWN</p><h1 style="font-family:Georgia,serif;font-weight:400">Your daily message digest</h1><ul>${items}</ul><p style="font-size:12px;color:#64736d">Message bodies are not included. Manage delivery in <a href="${config.siteUrl}/notifications">notification settings</a>.</p></div>`);
      await supabase.from("email_notification_outbox").update({ status: "sent", sent_at: new Date().toISOString(), attempts: 1, last_error: "" }).in("id", rows.map((row) => row.id));
      delivered += 1;
    } catch (caught) {
      await supabase.from("email_notification_outbox").update({ status: "failed", attempts: 1, last_error: caught instanceof Error ? caught.message.slice(0, 500) : "Delivery failed" }).in("id", rows.map((row) => row.id));
    }
  }
  return { recipients: delivered, notifications: due?.length ?? 0 };
}
