import { env } from "cloudflare:workers";
import { refreshAllWatchlistEarningsAlerts } from "../../../earnings-alerts";
import { getSupabaseAdminClient } from "../../../supabase-server";

export const dynamic = "force-dynamic";

function secretValue() {
  const value = (env as unknown as Record<string, unknown>).NOTIFICATION_CRON_SECRET;
  return typeof value === "string" && value ? value : process.env.NOTIFICATION_CRON_SECRET;
}

export async function POST(request: Request) {
  const secret = secretValue();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await refreshAllWatchlistEarningsAlerts(getSupabaseAdminClient()));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Earnings alert refresh failed" }, { status: 500 });
  }
}
