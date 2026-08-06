import { env } from "cloudflare:workers";
import { processDossierSourceBackfillBatch } from "../../../data/dossierSourceBackfill";

export const dynamic = "force-dynamic";

function cronSecret() {
  const bindings = env as unknown as Record<string, unknown>;
  const value = bindings.NOTIFICATION_CRON_SECRET || bindings.SCHEDULED_TASK_SECRET;
  return typeof value === "string" && value ? value : process.env.NOTIFICATION_CRON_SECRET || process.env.SCHEDULED_TASK_SECRET;
}

export async function POST(request: Request) {
  const secret = cronSecret();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const requested = Number(new URL(request.url).searchParams.get("limit") ?? 12);
  try {
    return Response.json(await processDossierSourceBackfillBatch(requested), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : "Dossier source backfill failed." }, { status: 500 });
  }
}
