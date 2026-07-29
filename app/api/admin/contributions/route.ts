import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { contributions } from "../../../../db/schema";
import { canModerate, ensureMemberProfile } from "../../../member";

export const dynamic = "force-dynamic";

async function editorProfile() {
  const profile = await ensureMemberProfile();
  return profile && canModerate(profile) ? profile : null;
}

export async function GET() {
  const profile = await editorProfile();
  if (!profile) return Response.json({ error: "Editor access required" }, { status: 403 });
  const rows = await getDb().select().from(contributions).orderBy(desc(contributions.createdAt)).limit(100);
  return Response.json({ contributions: rows });
}

export async function PATCH(request: Request) {
  const profile = await editorProfile();
  if (!profile) return Response.json({ error: "Editor access required" }, { status: 403 });
  const payload = await request.json() as { id?: number; status?: string; moderationNote?: string };
  if (!Number.isInteger(payload.id) || !["approved", "needs_revision", "rejected"].includes(payload.status ?? "")) {
    return Response.json({ error: "A valid submission and moderation decision are required." }, { status: 400 });
  }
  await getDb().update(contributions).set({
    status: payload.status as "approved" | "needs_revision" | "rejected",
    moderationNote: payload.moderationNote?.trim().slice(0, 1000) ?? "",
    moderatedBy: profile.email,
    moderatedAt: sql`CURRENT_TIMESTAMP`,
    updatedAt: sql`CURRENT_TIMESTAMP`,
  }).where(eq(contributions.id, payload.id!));
  return Response.json({ ok: true });
}
