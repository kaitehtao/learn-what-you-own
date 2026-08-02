import { env } from "cloudflare:workers";
import { brokerages, referralUrlFor, type BrokerageKey } from "../../../brokerageDirectory";
import { apiError, requireAdmin } from "../../../supabase-server";
import { ensureBrokerageClickSchema } from "../../../../db/runtimeSchema";

export const dynamic = "force-dynamic";

type ClickRow = {
  broker_key: string;
  action: string;
  destination_type: string;
  clicks_30d: number;
  clicks_all: number;
  last_click_at: string | null;
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    await ensureBrokerageClickSchema();
    const [totals, breakdown] = await Promise.all([
      env.DB.prepare(`SELECT
        COUNT(*) AS clicks_all,
        COALESCE(SUM(CASE WHEN created_at >= datetime('now','-30 days') THEN 1 ELSE 0 END),0) AS clicks_30d,
        COALESCE(SUM(CASE WHEN action='open' AND created_at >= datetime('now','-30 days') THEN 1 ELSE 0 END),0) AS account_clicks_30d,
        COALESCE(SUM(CASE WHEN destination_type='paid_referral' AND created_at >= datetime('now','-30 days') THEN 1 ELSE 0 END),0) AS paid_referral_clicks_30d
        FROM brokerage_clicks`).first<Record<string, number>>(),
      env.DB.prepare(`SELECT broker_key,action,destination_type,
        SUM(CASE WHEN created_at >= datetime('now','-30 days') THEN 1 ELSE 0 END) AS clicks_30d,
        COUNT(*) AS clicks_all,
        MAX(created_at) AS last_click_at
        FROM brokerage_clicks
        GROUP BY broker_key,action,destination_type
        ORDER BY clicks_30d DESC,clicks_all DESC`).all<ClickRow>(),
    ]);

    return Response.json({
      totals: {
        clicks30d: Number(totals?.clicks_30d ?? 0),
        accountClicks30d: Number(totals?.account_clicks_30d ?? 0),
        paidReferralClicks30d: Number(totals?.paid_referral_clicks_30d ?? 0),
        clicksAll: Number(totals?.clicks_all ?? 0),
      },
      brokers: brokerages.map((brokerage) => ({
        key: brokerage.key,
        name: brokerage.name,
        referralActive: Boolean(referralUrlFor(brokerage.key as BrokerageKey)),
        activity: breakdown.results.filter((row) => row.broker_key === brokerage.key).map((row) => ({
          action: row.action,
          destinationType: row.destination_type,
          clicks30d: Number(row.clicks_30d ?? 0),
          clicksAll: Number(row.clicks_all ?? 0),
          lastClickAt: row.last_click_at,
        })),
      })),
      notice: "Click totals are outbound events, not approved accounts, conversions, commissions, or unique people.",
    });
  } catch (error) {
    return apiError(error);
  }
}
