import { env } from "cloudflare:workers";
import { ensureMemberRewardsSchema } from "../../../db/runtimeSchema";
import { levelForPoints, rewardRules } from "../../../db/rewards";
import { apiError, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { profile } = await requireSupabaseUser(request);
    await ensureMemberRewardsSchema();
    const total = await env.DB.prepare("SELECT COALESCE(SUM(points),0) AS points,COUNT(*) AS awards FROM member_reward_ledger WHERE user_id=?")
      .bind(profile.user_id).first<{ points: number; awards: number }>();
    const recent = await env.DB.prepare("SELECT event_type,source_type,source_id,points,description,created_at FROM member_reward_ledger WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 20")
      .bind(profile.user_id).all<{ event_type: string; source_type: string; source_id: string; points: number; description: string; created_at: string }>();
    const points = Number(total?.points ?? 0);
    const level = levelForPoints(points);
    return Response.json({
      points,
      ownerCredits: Math.floor(points / 100),
      awards: Number(total?.awards ?? 0),
      level,
      recent: recent.results.map((item) => ({ eventType: item.event_type, sourceType: item.source_type, sourceId: item.source_id, points: item.points, description: item.description, createdAt: item.created_at })),
      rules: rewardRules,
      currencyNotice: "Owner Credits are non-transferable recognition credits with no cash value.",
    });
  } catch (error) { return apiError(error); }
}
