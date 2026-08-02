import { env } from "cloudflare:workers";
import { ensureFeedbackVotingSchema } from "../../../../db/runtimeSchema";
import { apiError, requireSupabaseUser } from "../../../supabase-server";

export const dynamic = "force-dynamic";

function feedbackIdFrom(payload: { feedbackId?: unknown }) {
  const id = Number(payload.feedbackId);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireSupabaseUser(request);
    const feedbackId = feedbackIdFrom(await request.json() as { feedbackId?: unknown });
    if (!feedbackId) return Response.json({ error: "Choose a valid feature request." }, { status: 400 });
    await ensureFeedbackVotingSchema();
    const eligible = await env.DB.prepare("SELECT id FROM product_feedback WHERE id=? AND category='New feature' AND status IN ('reviewing','planned','completed') LIMIT 1")
      .bind(feedbackId).first<{ id: number }>();
    if (!eligible) return Response.json({ error: "This feature request is not open for ranking." }, { status: 404 });
    await env.DB.prepare("INSERT INTO product_feedback_votes (feedback_id,user_id) VALUES (?,?) ON CONFLICT(feedback_id,user_id) DO NOTHING")
      .bind(feedbackId, profile.user_id).run();
    return Response.json({ voted: true });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
  try {
    const { profile } = await requireSupabaseUser(request);
    const feedbackId = feedbackIdFrom(await request.json() as { feedbackId?: unknown });
    if (!feedbackId) return Response.json({ error: "Choose a valid feature request." }, { status: 400 });
    await ensureFeedbackVotingSchema();
    await env.DB.prepare("DELETE FROM product_feedback_votes WHERE feedback_id=? AND user_id=?")
      .bind(feedbackId, profile.user_id).run();
    return Response.json({ voted: false });
  } catch (error) { return apiError(error); }
}
