import { env } from "cloudflare:workers";
import { apiError, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

const categories = new Set(["New feature", "Product improvement", "Research coverage", "Bug report", "Accessibility", "Other"]);

export async function GET(request: Request) {
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
