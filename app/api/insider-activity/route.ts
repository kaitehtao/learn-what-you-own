import { getSecInsiderActivity, type InsiderActivityPeriod } from "../../data/secInsiderActivityRepository";

export const dynamic = "force-dynamic";

const PERIODS = new Set<InsiderActivityPeriod>(["month", "quarter", "year"]);
const CANONICAL_IMPORTER_ORIGIN = "https://learn-what-you-own.kaitehtao.workers.dev";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requested = requestUrl.searchParams.get("period") as InsiderActivityPeriod | null;
  const period = requested && PERIODS.has(requested) ? requested : "month";
  if (requestUrl.hostname !== "learn-what-you-own.kaitehtao.workers.dev") {
    const canonical = await fetch(`${CANONICAL_IMPORTER_ORIGIN}/api/insider-activity?period=${period}`, {
      headers: { accept: "application/json", "user-agent": "learn-what-you-own-public-insider-board/1.0" },
    });
    return new Response(await canonical.text(), {
      status: canonical.status,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=60, stale-while-revalidate=300" },
    });
  }
  try {
    const response = Response.json(await getSecInsiderActivity(period));
    response.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
    return response;
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Insider activity is temporarily unavailable." }, { status: 503 });
  }
}
