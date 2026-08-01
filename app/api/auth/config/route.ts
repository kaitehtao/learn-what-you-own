import { getPublicSupabaseConfig } from "../../../supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(getPublicSupabaseConfig(), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Supabase is not configured" }, { status: 503 });
  }
}
