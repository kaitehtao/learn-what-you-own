import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { portfolioPositions } from "../../../db/schema";
import { researchUniverse } from "../../data/universe";
import { ensureMemberProfile } from "../../member";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await ensureMemberProfile();
  if (!profile) return Response.json({ error: "Authentication required" }, { status: 401 });
  const rows = await getDb().select().from(portfolioPositions).where(eq(portfolioPositions.userEmail, profile.email)).orderBy(desc(portfolioPositions.createdAt));
  return Response.json({
    positions: rows.map((row) => ({
      ...row,
      companyName: researchUniverse.find((company) => company.ticker === row.ticker)?.name ?? row.ticker,
    })),
  });
}

export async function POST(request: Request) {
  const profile = await ensureMemberProfile();
  if (!profile) return Response.json({ error: "Authentication required" }, { status: 401 });
  const payload = await request.json() as { ticker?: string; shares?: number | string; accountLabel?: string; notes?: string };
  const ticker = payload.ticker?.trim().toUpperCase() ?? "";
  if (!researchUniverse.some((company) => company.ticker === ticker)) {
    return Response.json({ error: "Choose a ticker from the research universe." }, { status: 400 });
  }
  const shares = payload.shares === "" || payload.shares == null ? null : Number(payload.shares);
  if (shares != null && (!Number.isFinite(shares) || shares < 0)) {
    return Response.json({ error: "Shares must be a positive number." }, { status: 400 });
  }
  const [position] = await getDb().insert(portfolioPositions).values({
    userEmail: profile.email,
    ticker,
    shares,
    accountLabel: payload.accountLabel?.trim().slice(0, 80) || "Primary portfolio",
    notes: payload.notes?.trim().slice(0, 500) || "",
  }).returning();
  return Response.json({ position }, { status: 201 });
}

export async function DELETE(request: Request) {
  const profile = await ensureMemberProfile();
  if (!profile) return Response.json({ error: "Authentication required" }, { status: 401 });
  const payload = await request.json() as { id?: number };
  if (!Number.isInteger(payload.id)) return Response.json({ error: "Position id is required." }, { status: 400 });
  await getDb().delete(portfolioPositions).where(and(eq(portfolioPositions.id, payload.id!), eq(portfolioPositions.userEmail, profile.email)));
  return Response.json({ ok: true });
}
