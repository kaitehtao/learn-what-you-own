import { getSupabaseAdminClient } from "../../../supabase-server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_PATH = /^\/[A-Za-z0-9_?&=/%.-]*$/;
const SAFE_HOST = /^[A-Za-z0-9.-]*$/;

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { visitorId?: string; path?: string; referrerHost?: string };
    const visitorId = String(payload.visitorId ?? "");
    const path = String(payload.path ?? "").slice(0, 240);
    const referrerHost = String(payload.referrerHost ?? "").toLowerCase().slice(0, 180);
    if (!UUID.test(visitorId) || !SAFE_PATH.test(path) || !SAFE_HOST.test(referrerHost)) {
      return Response.json({ error: "Invalid visit" }, { status: 400 });
    }
    const visitBucket = new Date().toISOString().slice(0, 13);
    const { error } = await getSupabaseAdminClient().from("site_visits").upsert({
      visitor_id: visitorId,
      path,
      referrer_host: referrerHost,
      visit_bucket: visitBucket,
    }, { onConflict: "visitor_id,path,visit_bucket", ignoreDuplicates: true });
    if (error) throw error;
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Visitor analytics failed", error);
    return Response.json({ error: "Analytics unavailable" }, { status: 503 });
  }
}
