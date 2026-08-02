import { env } from "cloudflare:workers";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export type SupabaseProfile = {
  user_id: string;
  username: string;
  display_name: string;
  role: "member" | "contributor" | "editor" | "admin";
  onboarding_complete: boolean;
  bio: string;
  avatar_path: string | null;
  investment_style: string;
  time_horizon: string;
  expertise_areas: string;
  linkedin_url: string | null;
  website_url: string | null;
  links_status: "unreviewed" | "pending" | "approved" | "rejected";
  credential_summary: string;
  credential_status: "unverified" | "pending" | "verified" | "rejected";
  credential_verified_by: string | null;
  credential_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

const PROFILE_PHOTO_BUCKET = "profile-photos";

function valueFromEnvironment(name: string) {
  const workerValue = (env as unknown as Record<string, unknown>)[name];
  if (typeof workerValue === "string" && workerValue) return workerValue;
  return process.env[name];
}

export function getSupabaseAdminClient(): SupabaseClient {
  const serviceRoleKey = valueFromEnvironment("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  const { url } = getPublicSupabaseConfig();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function getPublicSupabaseConfig() {
  const url = valueFromEnvironment("SUPABASE_URL") ?? valueFromEnvironment("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = valueFromEnvironment("SUPABASE_PUBLISHABLE_KEY")
    ?? valueFromEnvironment("SUPABASE_ANON_KEY")
    ?? valueFromEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !publishableKey) {
    throw new Error("Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY).");
  }
  return { url, publishableKey };
}

export function publicProfilePhotoUrl(path: string | null | undefined) {
  if (!path) return null;
  const { url } = getPublicSupabaseConfig();
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${url}/storage/v1/object/public/${PROFILE_PHOTO_BUCKET}/${encodedPath}`;
}

export { PROFILE_PHOTO_BUCKET };

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

export function getSupabaseForRequest(request?: Request): SupabaseClient {
  const { url, publishableKey } = getPublicSupabaseConfig();
  const token = request ? bearerToken(request) : "";
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}

export async function requireSupabaseUser(request: Request): Promise<{
  supabase: SupabaseClient;
  user: User;
  profile: SupabaseProfile;
}> {
  const token = bearerToken(request);
  if (!token) throw new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { "content-type": "application/json" } });
  const supabase = getSupabaseForRequest(request);
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user || !user.email_confirmed_at) {
    throw new Response(JSON.stringify({ error: "A verified account is required" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
  if (profileError || !profile) throw new Response(JSON.stringify({ error: "Account profile is unavailable" }), { status: 403, headers: { "content-type": "application/json" } });
  return { supabase, user, profile: profile as SupabaseProfile };
}

export async function requireEditor(request: Request) {
  const context = await requireSupabaseUser(request);
  if (context.profile.role !== "editor" && context.profile.role !== "admin") {
    throw new Response(JSON.stringify({ error: "Editor access required" }), { status: 403, headers: { "content-type": "application/json" } });
  }
  return context;
}

export async function requireAdmin(request: Request) {
  const context = await requireSupabaseUser(request);
  if (context.profile.role !== "admin") {
    throw new Response(JSON.stringify({ error: "Administrator access required" }), { status: 403, headers: { "content-type": "application/json" } });
  }
  return context;
}

export function apiError(error: unknown) {
  if (error instanceof Response) return error;
  console.error(error);
  return Response.json({ error: error instanceof Error ? error.message : "Unexpected server error" }, { status: 500 });
}
