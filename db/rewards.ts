import { env } from "cloudflare:workers";
import { ensureMemberRewardsSchema } from "./runtimeSchema";

export const rewardRules = {
  approvedContribution: 100,
  approvedCorrection: 125,
  approvedRelationship: 150,
  approvedCompanyDossier: 175,
  featurePlanned: 40,
  featureCompleted: 75,
  approvedInterview: 200,
} as const;

export async function awardPoints(input: {
  userId: string;
  username: string;
  eventType: string;
  sourceType: string;
  sourceId: string | number;
  points: number;
  description: string;
  awardedBy?: string;
}) {
  await ensureMemberRewardsSchema();
  const result = await env.DB.prepare(`
    INSERT INTO member_reward_ledger
      (user_id,username,event_type,source_type,source_id,points,description,awarded_by)
    VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(user_id,event_type,source_type,source_id) DO NOTHING
  `).bind(input.userId, input.username, input.eventType, input.sourceType, String(input.sourceId), input.points, input.description, input.awardedBy ?? null).run();
  return result.meta.changes > 0 ? input.points : 0;
}

export function levelForPoints(points: number) {
  const levels = [
    { name: "Community Steward", threshold: 3000 },
    { name: "Ownership Analyst", threshold: 1500 },
    { name: "Research Builder", threshold: 500 },
    { name: "Contributor", threshold: 100 },
    { name: "Observer", threshold: 0 },
  ];
  const current = levels.find((level) => points >= level.threshold) ?? levels.at(-1)!;
  const next = [...levels].reverse().find((level) => level.threshold > points) ?? null;
  return { ...current, next, progress: next ? Math.max(0, Math.min(100, ((points - current.threshold) / (next.threshold - current.threshold)) * 100)) : 100 };
}
