import { getSupabaseAdminClient } from "./supabase-server";

type AdminActionNotification = {
  actorId?: string;
  title: string;
  detail: string;
  href: string;
  entityType: string;
  entityId: number | string;
};

function clean(value: string, limit: number) {
  return value.trim().slice(0, limit);
}

function dailyDeliveryTime() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Creates one private call-to-action alert for every active administrator and
 * editor. Email remains opt-in through each recipient's existing notification
 * preference; in-app delivery is always created.
 */
export async function notifyPrivilegedReviewers(input: AdminActionNotification) {
  const admin = getSupabaseAdminClient();
  const { data: reviewers, error: reviewerError } = await admin.from("profiles")
    .select("user_id,role")
    .in("role", ["admin", "editor"])
    .eq("onboarding_complete", true);
  if (reviewerError) throw reviewerError;
  if (!reviewers?.length) return { recipients: 0, emailQueued: 0 };

  const userIds = reviewers.map((reviewer) => reviewer.user_id);
  const { error: preferenceSeedError } = await admin.from("notification_preferences")
    .upsert(userIds.map((user_id) => ({ user_id })), { onConflict: "user_id", ignoreDuplicates: true });
  if (preferenceSeedError) throw preferenceSeedError;

  const notificationRows = reviewers.map((reviewer) => ({
    user_id: reviewer.user_id,
    actor_id: input.actorId || null,
    kind: "moderation_update",
    title: clean(input.title, 160),
    detail: clean(input.detail, 240),
    href: input.href,
    entity_type: clean(input.entityType, 120),
    entity_id: String(input.entityId),
  }));
  const { data: created, error: notificationError } = await admin.from("notifications")
    .upsert(notificationRows, { onConflict: "user_id,entity_type,entity_id", ignoreDuplicates: true })
    .select("id,user_id");
  if (notificationError) throw notificationError;
  if (!created?.length) return { recipients: reviewers.length, emailQueued: 0 };

  const { data: preferences, error: preferenceError } = await admin.from("notification_preferences")
    .select("user_id,email_frequency")
    .in("user_id", created.map((notification) => notification.user_id));
  if (preferenceError) throw preferenceError;
  const frequencyByUser = new Map((preferences ?? []).map((preference) => [preference.user_id, preference.email_frequency]));
  const outboxRows = created.flatMap((notification) => {
    const frequency = frequencyByUser.get(notification.user_id);
    if (frequency !== "immediate" && frequency !== "daily") return [];
    return [{
      notification_id: notification.id,
      user_id: notification.user_id,
      frequency,
      next_attempt_at: frequency === "daily" ? dailyDeliveryTime() : new Date().toISOString(),
    }];
  });
  if (outboxRows.length) {
    const { error: outboxError } = await admin.from("email_notification_outbox")
      .upsert(outboxRows, { onConflict: "notification_id", ignoreDuplicates: true });
    if (outboxError) throw outboxError;
  }
  return { recipients: reviewers.length, emailQueued: outboxRows.length };
}

/**
 * Content submission must not be lost because an alert provider is temporarily
 * unavailable. The moderation queue remains authoritative and the error is
 * visible in Worker logs for operator follow-up.
 */
export async function notifyPrivilegedReviewersSafely(input: AdminActionNotification) {
  try {
    return await notifyPrivilegedReviewers(input);
  } catch (error) {
    console.error("Administrator action notification could not be created", error);
    return { recipients: 0, emailQueued: 0 };
  }
}
