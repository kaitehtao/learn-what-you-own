import { apiError, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { profile, user } = await requireSupabaseUser(request);
    return Response.json({ profile, email: user.email });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { username?: string; displayName?: string };
    const username = String(payload.username ?? "").trim();
    const displayName = String(payload.displayName ?? "").trim();
    if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) {
      return Response.json({ error: "Username must be 3–24 letters, numbers, or underscores." }, { status: 400 });
    }
    const { data, error } = await supabase.rpc("update_own_profile", {
      new_username: username,
      new_display_name: (displayName || username).slice(0, 80),
    });
    if (error?.code === "23505") return Response.json({ error: "That username is already taken." }, { status: 409 });
    if (error) throw error;
    return Response.json({ profile: data });
  } catch (error) {
    return apiError(error);
  }
}
