import type { SupabaseClient } from "@supabase/supabase-js";

export async function enforceActionRateLimit(admin: SupabaseClient, userId: string, actionKey: string, maximum: number, windowSeconds: number) {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count, error } = await admin.from("member_action_events").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("action_key", actionKey).gte("created_at", since);
  if (error) throw error;
  if ((count ?? 0) >= maximum) throw new Response(JSON.stringify({ error: "Rate limit reached. Please wait before trying again." }), { status: 429, headers: { "content-type": "application/json", "retry-after": String(windowSeconds) } });
  const { error: insertError } = await admin.from("member_action_events").insert({ user_id: userId, action_key: actionKey });
  if (insertError) throw insertError;
}

export async function membersBlocked(admin: SupabaseClient, firstUserId: string, secondUserId: string) {
  const [first, second] = await Promise.all([
    admin.from("member_blocks").select("blocker_id", { count: "exact", head: true }).eq("blocker_id", firstUserId).eq("blocked_id", secondUserId),
    admin.from("member_blocks").select("blocker_id", { count: "exact", head: true }).eq("blocker_id", secondUserId).eq("blocked_id", firstUserId),
  ]);
  if (first.error) throw first.error;
  if (second.error) throw second.error;
  return (first.count ?? 0) > 0 || (second.count ?? 0) > 0;
}
