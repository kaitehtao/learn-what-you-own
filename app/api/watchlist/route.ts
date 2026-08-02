import { researchUniverse } from "../../data/universe";
import { createDueEarningsAlerts, daysUntilEarnings, earningsSessionLabel, refreshEarningsCalendar } from "../../earnings-alerts";
import { apiError, getSupabaseAdminClient, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

function findCompany(value: unknown) {
  const ticker = typeof value === "string" ? value.trim().toUpperCase() : "";
  return researchUniverse.find((company) => company.ticker === ticker);
}

export async function GET(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const { data, error } = await supabase.from("watchlist_items").select("id,ticker,created_at").eq("user_id", profile.user_id).order("ticker");
    if (error) throw error;
    const admin = getSupabaseAdminClient();
    const calendar = await refreshEarningsCalendar(admin, (data ?? []).map((row) => row.ticker));
    await createDueEarningsAlerts(admin, (data ?? []).map((row) => ({ user_id: profile.user_id, ticker: row.ticker })), calendar);
    return Response.json({
      items: (data ?? []).map((row) => {
        const company = findCompany(row.ticker);
        const earnings = calendar.get(row.ticker);
        return {
          id: row.id,
          ticker: row.ticker,
          createdAt: row.created_at,
          name: company?.name ?? row.ticker,
          sector: company?.sector ?? "Company",
          memberships: company?.memberships ?? [],
          earnings: earnings ? {
            date: earnings.earnings_date,
            daysUntil: earnings.earnings_date ? daysUntilEarnings(earnings.earnings_date) : null,
            session: earnings.session,
            sessionLabel: earningsSessionLabel(earnings.session),
            verificationStatus: earnings.verification_status,
            sourceUrl: earnings.source_url,
            sourceLabel: earnings.source_label,
            checkedAt: earnings.checked_at,
          } : null,
        };
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { ticker?: string };
    const company = findCompany(payload.ticker);
    if (!company) return Response.json({ error: "Choose a ticker from the research universe." }, { status: 400 });
    const { error } = await supabase.from("watchlist_items").upsert({ user_id: profile.user_id, ticker: company.ticker }, { onConflict: "user_id,ticker", ignoreDuplicates: true });
    if (error) throw error;
    return Response.json({ ok: true, ticker: company.ticker }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { ticker?: string };
    const ticker = payload.ticker?.trim().toUpperCase() ?? "";
    const { error } = await supabase.from("watchlist_items").delete().eq("user_id", profile.user_id).eq("ticker", ticker);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
