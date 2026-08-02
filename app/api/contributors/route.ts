import { env } from "cloudflare:workers";
import { ensureMemberRewardsSchema } from "../../../db/runtimeSchema";
import { levelForPoints } from "../../../db/rewards";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureMemberRewardsSchema();
    const result = await env.DB.prepare(`
      SELECT username,SUM(points) AS points,COUNT(*) AS approved_awards,MAX(created_at) AS last_awarded_at
      FROM member_reward_ledger
      GROUP BY user_id,username
      HAVING SUM(points)>0
      ORDER BY points DESC,approved_awards DESC,last_awarded_at ASC
      LIMIT 100
    `).all<{ username: string; points: number; approved_awards: number; last_awarded_at: string }>();
    return Response.json({ contributors: result.results.map((item, index) => ({
      rank: index + 1,
      username: item.username,
      points: Number(item.points),
      ownerCredits: Math.floor(Number(item.points) / 100),
      approvedAwards: Number(item.approved_awards),
      level: levelForPoints(Number(item.points)).name,
      lastAwardedAt: item.last_awarded_at,
    })) }, { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
  } catch {
    return Response.json({ contributors: [] }, { headers: { "cache-control": "public, max-age=15" } });
  }
}
