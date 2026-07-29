import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { watchlistItems } from "../../../db/schema";
import { researchUniverse } from "../../data/universe";
import { ensureMemberProfile } from "../../member";

export const dynamic = "force-dynamic";

function findCompany(value: unknown) {
  const ticker = typeof value === "string" ? value.trim().toUpperCase() : "";
  return researchUniverse.find((company) => company.ticker === ticker);
}

export async function GET() {
  const profile = await ensureMemberProfile();
  if (!profile) return Response.json({ error: "Authentication required" }, { status: 401 });
  const rows = await getDb().select().from(watchlistItems).where(eq(watchlistItems.userEmail, profile.email)).orderBy(asc(watchlistItems.ticker));
  return Response.json({
    items: rows.map((row) => {
      const company = findCompany(row.ticker);
      return { ...row, name: company?.name ?? row.ticker, sector: company?.sector ?? "Company", memberships: company?.memberships ?? [] };
    }),
  });
}

export async function POST(request: Request) {
  const profile = await ensureMemberProfile();
  if (!profile) return Response.json({ error: "Authentication required" }, { status: 401 });
  const payload = await request.json() as { ticker?: string };
  const company = findCompany(payload.ticker);
  if (!company) return Response.json({ error: "Choose a ticker from the research universe." }, { status: 400 });
  await getDb().insert(watchlistItems).values({ userEmail: profile.email, ticker: company.ticker }).onConflictDoNothing();
  return Response.json({ ok: true, ticker: company.ticker }, { status: 201 });
}

export async function DELETE(request: Request) {
  const profile = await ensureMemberProfile();
  if (!profile) return Response.json({ error: "Authentication required" }, { status: 401 });
  const payload = await request.json() as { ticker?: string };
  const ticker = payload.ticker?.trim().toUpperCase() ?? "";
  await getDb().delete(watchlistItems).where(and(eq(watchlistItems.userEmail, profile.email), eq(watchlistItems.ticker, ticker)));
  return Response.json({ ok: true });
}
