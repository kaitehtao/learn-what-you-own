import { env } from "cloudflare:workers";
import { processDossierFreshnessBatch } from "../../../data/dossierFreshness";

export const dynamic = "force-dynamic";

function cronSecret() {
  const bindings = env as unknown as Record<string, unknown>;
  const value = bindings.NOTIFICATION_CRON_SECRET || bindings.SCHEDULED_TASK_SECRET;
  return typeof value === "string" && value ? value : process.env.NOTIFICATION_CRON_SECRET || process.env.SCHEDULED_TASK_SECRET;
}

export async function POST(request: Request) {
  const secret = cronSecret();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const requested = Number(new URL(request.url).searchParams.get("limit") ?? 25);
  try {
    return Response.json(await processDossierFreshnessBatch(Number.isFinite(requested) ? requested : 10));
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : "Dossier freshness scan failed." }, { status: 500 });
  }
}
