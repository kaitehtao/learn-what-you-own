import type { SupabaseClient, User } from "@supabase/supabase-js";
import { apiError, getSupabaseAdminClient, requireAdmin } from "../../../supabase-server";

export const dynamic = "force-dynamic";

type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
  role: "member" | "contributor" | "editor" | "admin";
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
};

const USERNAME = /^[A-Za-z0-9_]{3,24}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = new Set(["member", "contributor", "editor", "admin"]);
const ACCOUNT_REDIRECT = "https://learnwhatyouown.com/auth/callback?returnTo=%2Faccount";
const VERIFICATION_RESEND_COOLDOWN_MS = 60_000;

async function allAuthUsers(admin: SupabaseClient) {
  const users: User[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 200) break;
  }
  return users;
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function signupSeries(profiles: ProfileRow[]) {
  const counts = new Map<string, number>();
  for (const profile of profiles) counts.set(dateKey(profile.created_at), (counts.get(dateKey(profile.created_at)) ?? 0) + 1);
  return Array.from({ length: 14 }, (_, index) => {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    day.setUTCDate(day.getUTCDate() - (13 - index));
    const date = day.toISOString().slice(0, 10);
    return { date, signups: counts.get(date) ?? 0 };
  });
}

async function adminCount(admin: SupabaseClient) {
  const { count, error } = await admin.from("profiles").select("user_id", { count: "exact", head: true }).eq("role", "admin");
  if (error) throw error;
  return count ?? 0;
}

async function targetProfile(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin.from("profiles").select("user_id,username,display_name,role,onboarding_complete,created_at,updated_at").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

async function targetAuthUser(admin: SupabaseClient, userId: string) {
  const { data: { user }, error } = await admin.auth.admin.getUserById(userId);
  if (error) throw error;
  if (!user) return null;
  return user;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const admin = getSupabaseAdminClient();
    const [{ data: profiles, error: profileError }, authUsers, { data: visitorMetrics, error: metricsError }, { data: audit, error: auditError }] = await Promise.all([
      admin.from("profiles").select("user_id,username,display_name,role,onboarding_complete,created_at,updated_at").order("created_at", { ascending: false }),
      allAuthUsers(admin),
      admin.rpc("admin_dashboard_visitor_metrics"),
      admin.from("admin_account_audit").select("id,actor_id,target_user_id,action,detail,created_at").order("created_at", { ascending: false }).limit(25),
    ]);
    if (profileError) throw profileError;
    if (metricsError) throw metricsError;
    if (auditError) throw auditError;
    const profileRows = (profiles ?? []) as ProfileRow[];
    const authById = new Map(authUsers.map((user) => [user.id, user]));
    const now = Date.now();
    const members = profileRows.map((profile) => {
      const auth = authById.get(profile.user_id);
      return {
        id: profile.user_id,
        username: profile.username,
        displayName: profile.display_name,
        role: profile.role,
        onboardingComplete: profile.onboarding_complete,
        email: auth?.email ?? "",
        verified: Boolean(auth?.email_confirmed_at),
        confirmationSentAt: auth?.confirmation_sent_at ?? auth?.invited_at ?? null,
        createdAt: profile.created_at,
        lastSignInAt: auth?.last_sign_in_at ?? null,
      };
    });
    const stats = {
      totalAccounts: members.length,
      verifiedAccounts: members.filter((member) => member.verified).length,
      accounts7d: profileRows.filter((profile) => now - new Date(profile.created_at).getTime() <= 7 * 86400000).length,
      accounts30d: profileRows.filter((profile) => now - new Date(profile.created_at).getTime() <= 30 * 86400000).length,
      administrators: profileRows.filter((profile) => profile.role === "admin").length,
    };
    return Response.json({ stats, visitors: visitorMetrics, signupSeries: signupSeries(profileRows), members, audit: audit ?? [] });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile: actor } = await requireAdmin(request);
    const payload = await request.json() as { action?: string; userId?: string; email?: string; username?: string; displayName?: string };
    const admin = getSupabaseAdminClient();

    if (payload.action === "resend_verification") {
      const userId = String(payload.userId ?? "");
      if (!userId) return Response.json({ error: "Account is required." }, { status: 400 });
      const [profile, authUser] = await Promise.all([targetProfile(admin, userId), targetAuthUser(admin, userId)]);
      if (!profile || !authUser) return Response.json({ error: "Account not found." }, { status: 404 });
      if (authUser.email_confirmed_at) return Response.json({ error: "This email address is already verified." }, { status: 409 });
      const email = String(authUser.email ?? "").trim().toLowerCase();
      if (!EMAIL.test(email)) return Response.json({ error: "This account does not have a valid email address." }, { status: 409 });
      const lastSentAt = authUser.confirmation_sent_at ?? authUser.invited_at;
      if (lastSentAt && Date.now() - new Date(lastSentAt).getTime() < VERIFICATION_RESEND_COOLDOWN_MS) {
        return Response.json({ error: "Wait at least one minute before resending another verification email." }, { status: 429 });
      }
      let resendError = null;
      if (authUser.invited_at) {
        const result = await admin.auth.admin.inviteUserByEmail(email, {
          redirectTo: ACCOUNT_REDIRECT,
          data: authUser.user_metadata,
        });
        resendError = result.error;
      } else {
        const result = await admin.auth.resend({ type: "signup", email, options: { emailRedirectTo: ACCOUNT_REDIRECT } });
        resendError = result.error;
      }
      if (resendError) throw resendError;
      const { error: auditError } = await admin.from("admin_account_audit").insert({
        actor_id: actor.user_id,
        target_user_id: userId,
        action: "verification_resend",
        detail: { username: profile.username, email },
      });
      if (auditError) throw auditError;
      return Response.json({ sent: true });
    }

    const email = String(payload.email ?? "").trim().toLowerCase();
    const username = String(payload.username ?? "").trim();
    const displayName = String(payload.displayName ?? "").trim().slice(0, 80);
    if (!EMAIL.test(email)) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    if (username && !USERNAME.test(username)) return Response.json({ error: "Username must be 3–24 letters, numbers, or underscores." }, { status: 400 });
    if (username) {
      const { data: existing } = await admin.from("profiles").select("user_id").ilike("username", username).maybeSingle();
      if (existing) return Response.json({ error: "That username is already in use." }, { status: 409 });
    }
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: ACCOUNT_REDIRECT,
      data: username ? { username, name: displayName || username } : { name: displayName },
    });
    if (error) throw error;
    await admin.from("admin_account_audit").insert({ actor_id: actor.user_id, target_user_id: data.user.id, action: "invite", detail: { email, username: username || null } });
    return Response.json({ invited: true, userId: data.user.id });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile: actor } = await requireAdmin(request);
    const payload = await request.json() as { action?: string; userId?: string; role?: string; confirmation?: string };
    const userId = String(payload.userId ?? "");
    const admin = getSupabaseAdminClient();

    if (payload.action === "confirm_email") {
      if (!userId) return Response.json({ error: "Account is required." }, { status: 400 });
      const [profile, authUser] = await Promise.all([targetProfile(admin, userId), targetAuthUser(admin, userId)]);
      if (!profile || !authUser) return Response.json({ error: "Account not found." }, { status: 404 });
      if (authUser.email_confirmed_at) return Response.json({ error: "This email address is already verified." }, { status: 409 });
      const email = String(authUser.email ?? "").trim().toLowerCase();
      if (!EMAIL.test(email)) return Response.json({ error: "This account does not have a valid email address." }, { status: 409 });
      if (String(payload.confirmation ?? "").trim().toLowerCase() !== email) {
        return Response.json({ error: `Type ${email} to confirm manual verification.` }, { status: 400 });
      }
      const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
      if (error) throw error;
      const { error: auditError } = await admin.from("admin_account_audit").insert({
        actor_id: actor.user_id,
        target_user_id: userId,
        action: "email_confirm",
        detail: { username: profile.username, email, method: "manual_admin" },
      });
      if (auditError) throw auditError;
      return Response.json({ verified: true });
    }

    const role = String(payload.role ?? "");
    if (!userId || !ROLES.has(role)) return Response.json({ error: "A valid user and role are required." }, { status: 400 });
    if (userId === actor.user_id) return Response.json({ error: "Use a separate administrator to change your own role." }, { status: 409 });
    const target = await targetProfile(admin, userId);
    if (!target) return Response.json({ error: "Account not found." }, { status: 404 });
    if (target.role === "admin" && role !== "admin" && await adminCount(admin) <= 1) return Response.json({ error: "The final administrator cannot be demoted." }, { status: 409 });
    const { error } = await admin.from("profiles").update({ role }).eq("user_id", userId);
    if (error) throw error;
    await admin.from("admin_account_audit").insert({ actor_id: actor.user_id, target_user_id: userId, action: "role_update", detail: { username: target.username, from: target.role, to: role } });
    return Response.json({ updated: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile: actor } = await requireAdmin(request);
    const payload = await request.json() as { userId?: string; confirmation?: string };
    const userId = String(payload.userId ?? "");
    if (!userId) return Response.json({ error: "Account is required." }, { status: 400 });
    if (userId === actor.user_id) return Response.json({ error: "You cannot delete the account you are currently using." }, { status: 409 });
    const admin = getSupabaseAdminClient();
    const target = await targetProfile(admin, userId);
    if (!target) return Response.json({ error: "Account not found." }, { status: 404 });
    if (payload.confirmation !== `DELETE @${target.username}`) return Response.json({ error: `Type DELETE @${target.username} to confirm.` }, { status: 400 });
    if (target.role === "admin" && await adminCount(admin) <= 1) return Response.json({ error: "The final administrator cannot be deleted." }, { status: 409 });
    await admin.from("admin_account_audit").insert({ actor_id: actor.user_id, target_user_id: userId, action: "delete", detail: { username: target.username, role: target.role } });
    const { error } = await admin.auth.admin.deleteUser(userId, false);
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
