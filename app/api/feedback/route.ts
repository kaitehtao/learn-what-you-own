import { env } from "cloudflare:workers";
import { apiError, requireSupabaseUser } from "../../supabase-server";
import { ensureFeedbackVotingSchema } from "../../../db/runtimeSchema";

export const dynamic = "force-dynamic";

const categories = new Set(["New feature", "Product improvement", "Research coverage", "Bug report", "Accessibility", "Other"]);

export async function GET(request: Request) {
  const view = new URL(request.url).searchParams.get("view");
  if (view === "ranked") {
    try {
      await ensureFeedbackVotingSchema();
      let viewerId = "";
      if (request.headers.get("authorization")) {
        try { viewerId = (await requireSupabaseUser(request)).profile.user_id; } catch { /* Public board remains readable. */ }
      }
      const result = await env.DB.prepare(`
        SELECT feedback.id,feedback.username,feedback.title,feedback.details,feedback.status,feedback.created_at,
          COUNT(votes.user_id) AS vote_count,
          MAX(CASE WHEN votes.user_id=? THEN 1 ELSE 0 END) AS viewer_has_voted
        FROM product_feedback AS feedback
        LEFT JOIN product_feedback_votes AS votes ON votes.feedback_id=feedback.id
        WHERE feedback.category='New feature' AND feedback.status IN ('reviewing','planned','completed')
        GROUP BY feedback.id
        ORDER BY vote_count DESC, feedback.created_at DESC
        LIMIT 100
      `).bind(viewerId).all<{ id: number; username: string; title: string; details: string; status: string; created_at: string; vote_count: number; viewer_has_voted: number }>();
      return Response.json({ featureRequests: result.results.map(item => ({
        id: item.id,
        username: item.username,
        title: item.title,
        details: item.details,
        status: item.status,
        createdAt: item.created_at,
        voteCount: Number(item.vote_count),
        viewerHasVoted: Boolean(item.viewer_has_voted),
      })) }, { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
    } catch (error) { return apiError(error); }
  }
  try {
    const { profile } = await requireSupabaseUser(request);
    const result = await env.DB.prepare("SELECT id,category,title,details,status,moderator_note,created_at FROM product_feedback WHERE user_id=? ORDER BY created_at DESC")
      .bind(profile.user_id).all<{ id: number; category: string; title: string; details: string; status: string; moderator_note: string; created_at: string }>();
    return Response.json({ feedback: result.results.map(item => ({
      id: item.id,
      category: item.category,
      title: item.title,
      details: item.details,
      status: item.status,
      moderatorNote: item.moderator_note,
      createdAt: item.created_at,
    })) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireSupabaseUser(request);
    const payload = await request.json() as { category?: string; title?: string; details?: string };
    const category = String(payload.category ?? "").trim();
    const title = String(payload.title ?? "").trim();
    const details = String(payload.details ?? "").trim();
    if (!categories.has(category)) return Response.json({ error: "Choose a valid feedback category." }, { status: 400 });
    if (title.length < 8 || title.length > 120) return Response.json({ error: "Title must be 8–120 characters." }, { status: 400 });
    if (details.length < 30 || details.length > 4000) return Response.json({ error: "Details must be 30–4,000 characters." }, { status: 400 });
    const result = await env.DB.prepare("INSERT INTO product_feedback (user_id,username,category,title,details,status) VALUES (?,?,?,?,?,'submitted')")
      .bind(profile.user_id, profile.username, category, title, details).run();
    return Response.json({ id: result.meta.last_row_id }, { status: 201 });
  } catch (error) { return apiError(error); }
}
