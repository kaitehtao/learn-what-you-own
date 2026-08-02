import { env } from "cloudflare:workers";
import { awardPoints, rewardRules } from "../../../../db/rewards";
import { apiError, requireEditor } from "../../../supabase-server";

export const dynamic = "force-dynamic";
const statuses = new Set(["submitted", "reviewing", "planned", "completed", "declined"]);

export async function GET(request: Request) {
  try {
    await requireEditor(request);
    const result = await env.DB.prepare("SELECT id,user_id,username,category,title,details,status,moderator_note,created_at FROM product_feedback ORDER BY created_at DESC LIMIT 200")
      .all<{ id: number; user_id: string; username: string; category: string; title: string; details: string; status: string; moderator_note: string; created_at: string }>();
    return Response.json({ feedback: result.results.map((item) => ({ id: item.id, userId: item.user_id, username: item.username, category: item.category, title: item.title, details: item.details, status: item.status, moderatorNote: item.moderator_note, createdAt: item.created_at })) });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireEditor(request);
    const payload = await request.json() as { id?: number; status?: string; moderatorNote?: string };
    if (!Number.isInteger(payload.id) || !statuses.has(payload.status ?? "")) return Response.json({ error: "Choose a valid feature request and status." }, { status: 400 });
    const item = await env.DB.prepare("SELECT id,user_id,username,category,status FROM product_feedback WHERE id=?").bind(payload.id).first<{ id: number; user_id: string; username: string; category: string; status: string }>();
    if (!item) return Response.json({ error: "Feedback item not found." }, { status: 404 });
    await env.DB.prepare("UPDATE product_feedback SET status=?,moderator_note=?,moderated_by=?,moderated_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(payload.status, String(payload.moderatorNote ?? "").trim().slice(0, 1000), profile.username, payload.id).run();
    let pointsAwarded = 0;
    if (item.category === "New feature" && payload.status === "planned") {
      pointsAwarded = await awardPoints({ userId: item.user_id, username: item.username, eventType: "feature_planned", sourceType: "feedback", sourceId: item.id, points: rewardRules.featurePlanned, description: "Feature request accepted into the product plan", awardedBy: profile.username });
    }
    if (item.category === "New feature" && payload.status === "completed") {
      pointsAwarded = await awardPoints({ userId: item.user_id, username: item.username, eventType: "feature_completed", sourceType: "feedback", sourceId: item.id, points: rewardRules.featureCompleted, description: "Feature request shipped to the community", awardedBy: profile.username });
    }
    return Response.json({ ok: true, pointsAwarded });
  } catch (error) { return apiError(error); }
}
