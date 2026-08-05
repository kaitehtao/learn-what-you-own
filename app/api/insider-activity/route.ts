import { getSecInsiderActivity, type InsiderActivityPeriod } from "../../data/secInsiderActivityRepository";

export const dynamic = "force-dynamic";

const PERIODS = new Set<InsiderActivityPeriod>(["month", "quarter", "year"]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requested = requestUrl.searchParams.get("period") as InsiderActivityPeriod | null;
  const period = requested && PERIODS.has(requested) ? requested : "month";
  try {
    // The apex, www, and workers.dev routes are the same Worker with the same
    // D1 binding. Querying D1 here avoids a Worker-to-itself HTTP hop that can
    // turn a healthy database response into Cloudflare's plain-text 522 page.
    const response = Response.json(await getSecInsiderActivity(period));
    response.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
    return response;
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Insider activity is temporarily unavailable." }, { status: 503 });
  }
}
