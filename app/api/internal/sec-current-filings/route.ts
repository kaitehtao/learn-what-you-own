import { discoverCurrentSecFilings } from "../../../data/secCurrentFeed";

export const dynamic = "force-dynamic";

function cronSecret() {
  return process.env.NOTIFICATION_CRON_SECRET?.trim() ?? "";
}

export async function POST(request: Request) {
  const secret = cronSecret();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const requested = Number(new URL(request.url).searchParams.get("limit") ?? "25");
    return Response.json(await discoverCurrentSecFilings(Number.isFinite(requested) ? requested : 25));
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : "SEC current-filings discovery failed." }, { status: 500 });
  }
}
