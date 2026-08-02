import { apiError, getSupabaseAdminClient } from "../../supabase-server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 1_000;
const MAX_WATCHLIST_ROWS = 100_000;

export async function GET() {
  try {
    const admin = getSupabaseAdminClient();
    const counts = new Map<string, number>();

    for (let from = 0; from < MAX_WATCHLIST_ROWS; from += PAGE_SIZE) {
      const { data, error } = await admin.from("watchlist_items")
        .select("ticker")
        .order("id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      for (const row of data ?? []) {
        const ticker = String(row.ticker ?? "").trim().toUpperCase();
        if (/^[A-Z0-9.-]{1,12}$/.test(ticker)) counts.set(ticker, (counts.get(ticker) ?? 0) + 1);
      }
      if ((data?.length ?? 0) < PAGE_SIZE) break;
    }

    return Response.json({
      companies: [...counts].map(([ticker, follower_count]) => ({ ticker, follower_count }))
        .sort((a, b) => b.follower_count - a.follower_count || a.ticker.localeCompare(b.ticker)),
    }, { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch (error) {
    return apiError(error);
  }
}
