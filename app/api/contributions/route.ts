import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { contributions } from "../../../db/schema";
import { researchUniverse } from "../../data/universe";
import { ensureMemberProfile } from "../../member";

export const dynamic = "force-dynamic";

const allowedTypes = ["Factual correction", "Thesis update", "Industry observation", "Competitive analysis", "Financial model", "Question for management"];

export async function GET() {
  const profile = await ensureMemberProfile();
  if (!profile) return Response.json({ error: "Authentication required" }, { status: 401 });
  const rows = await getDb().select().from(contributions).where(eq(contributions.userEmail, profile.email)).orderBy(desc(contributions.createdAt));
  return Response.json({ contributions: rows });
}

export async function POST(request: Request) {
  const profile = await ensureMemberProfile();
  if (!profile) return Response.json({ error: "Authentication required" }, { status: 401 });
  const payload = await request.json() as Record<string, unknown>;
  const ticker = String(payload.ticker ?? "").trim().toUpperCase();
  const contributionType = String(payload.contributionType ?? "");
  const claim = String(payload.claim ?? "").trim();
  const whyItMatters = String(payload.whyItMatters ?? "").trim();
  const sourceUrl = String(payload.sourceUrl ?? "").trim();
  const evidenceDate = String(payload.evidenceDate ?? "").trim();
  const positionDisclosure = String(payload.positionDisclosure ?? "").trim();
  if (!researchUniverse.some((company) => company.ticker === ticker)) return Response.json({ error: "Choose a valid company ticker." }, { status: 400 });
  if (!allowedTypes.includes(contributionType)) return Response.json({ error: "Choose a valid contribution type." }, { status: 400 });
  if (claim.length < 20 || whyItMatters.length < 20) return Response.json({ error: "Explain the claim and why it matters in at least 20 characters each." }, { status: 400 });
  try { new URL(sourceUrl); } catch { return Response.json({ error: "Enter a valid source URL." }, { status: 400 }); }
  if (!evidenceDate || !positionDisclosure) return Response.json({ error: "Evidence date and position disclosure are required." }, { status: 400 });
  const [submission] = await getDb().insert(contributions).values({
    userEmail: profile.email,
    ticker,
    contributionType,
    claim: claim.slice(0, 2500),
    whyItMatters: whyItMatters.slice(0, 2500),
    sourceUrl: sourceUrl.slice(0, 1000),
    evidenceDate,
    confidence: String(payload.confidence ?? "Medium — supported inference").slice(0, 80),
    timeHorizon: String(payload.timeHorizon ?? "Current fact").slice(0, 80),
    expertise: String(payload.expertise ?? "").trim().slice(0, 300),
    positionDisclosure: positionDisclosure.slice(0, 300),
    conflictDisclosure: String(payload.conflictDisclosure ?? "").trim().slice(0, 500),
  }).returning();
  return Response.json({ submission }, { status: 201 });
}
