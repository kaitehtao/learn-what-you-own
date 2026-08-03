import { env } from "cloudflare:workers";
import { refreshSecInsiderActivityBatch } from "../../../data/secInsiderActivityRepository";

export const dynamic = "force-dynamic";

function secretValue() {
  const bindings = env as unknown as Record<string, unknown>;
  const value = bindings.NOTIFICATION_CRON_SECRET || bindings.SCHEDULED_TASK_SECRET;
  return typeof value === "string" && value
    ? value
    : process.env.NOTIFICATION_CRON_SECRET || process.env.SCHEDULED_TASK_SECRET;
}

export async function POST(request: Request) {
  const secret = secretValue();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    return Response.json(await refreshSecInsiderActivityBatch());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "SEC insider activity refresh failed." }, { status: 502 });
  }
}
