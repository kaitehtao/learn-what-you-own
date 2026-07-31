import { researchUniverse } from "../../data/universe";
import { apiError, getSupabaseForRequest, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

const allowedTypes = ["Factual correction", "Thesis update", "Industry observation", "Competitive analysis", "Financial model", "Question for management"];

function mapContribution(row: Record<string, unknown>) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    ticker: row.ticker,
    contributionType: row.contribution_type,
    claim: row.claim,
    whyItMatters: row.why_it_matters,
    sourceUrl: row.source_url,
    evidenceDate: row.evidence_date,
    confidence: row.confidence,
    timeHorizon: row.time_horizon,
    expertise: row.expertise,
    positionDisclosure: row.position_disclosure,
    conflictDisclosure: row.conflict_disclosure,
    status: row.status,
    moderationNote: row.moderation_note,
    createdAt: row.created_at,
    username: (profile as { username?: string } | null)?.username ?? "member",
  };
}

export async function GET(request: Request) {
  try {
    const ticker = new URL(request.url).searchParams.get("ticker")?.trim().toUpperCase();
    if (ticker) {
      const supabase = getSupabaseForRequest();
      const { data, error } = await supabase.from("contributions")
        .select("*,profiles!contributions_user_id_fkey(username)")
        .eq("ticker", ticker).eq("status", "approved").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return Response.json({ insights: (data ?? []).map((row) => mapContribution(row as Record<string, unknown>)) });
    }
    const { profile, supabase } = await requireSupabaseUser(request);
    const { data, error } = await supabase.from("contributions").select("*,profiles!contributions_user_id_fkey(username)").eq("user_id", profile.user_id).order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ contributions: (data ?? []).map((row) => mapContribution(row as Record<string, unknown>)) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    if (!profile.onboarding_complete) return Response.json({ error: "Choose your username before contributing." }, { status: 403 });
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
    const { data, error } = await supabase.from("contributions").insert({
      user_id: profile.user_id,
      ticker,
      contribution_type: contributionType,
      claim: claim.slice(0, 2500),
      why_it_matters: whyItMatters.slice(0, 2500),
      source_url: sourceUrl.slice(0, 1000),
      evidence_date: evidenceDate,
      confidence: String(payload.confidence ?? "Medium — supported inference").slice(0, 80),
      time_horizon: String(payload.timeHorizon ?? "Current fact").slice(0, 80),
      expertise: String(payload.expertise ?? "").trim().slice(0, 300),
      position_disclosure: positionDisclosure.slice(0, 300),
      conflict_disclosure: String(payload.conflictDisclosure ?? "").trim().slice(0, 500),
      status: "submitted",
    }).select("*").single();
    if (error) throw error;
    return Response.json({ submission: mapContribution(data as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
