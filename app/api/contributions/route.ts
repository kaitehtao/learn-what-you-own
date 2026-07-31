import { researchUniverse } from "../../data/universe";
import { apiError, getSupabaseForRequest, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

const allowedTypes = ["Factual correction", "Thesis update", "Industry observation", "Competitive analysis", "Financial model", "Question for management", "Supplier / customer relationship"];
const relationshipDirections = ["supplier_to_company", "company_to_customer"];
const relationshipMaterialities = ["named", "material", "strategic", "unknown"];
const relationshipEvidenceClasses = ["direct_disclosure", "corroborated", "inferred"];

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
    relatedCompany: row.related_company,
    relatedTicker: row.related_ticker,
    relationshipDirection: row.relationship_direction,
    relationshipProduct: row.relationship_product,
    relationshipMateriality: row.relationship_materiality,
    relationshipEvidenceClass: row.relationship_evidence_class,
    relationshipSourceType: row.relationship_source_type,
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
    const isRelationship = contributionType === "Supplier / customer relationship";
    const relatedCompany = String(payload.relatedCompany ?? "").trim();
    const relatedTicker = String(payload.relatedTicker ?? "").trim().toUpperCase();
    const relationshipDirection = String(payload.relationshipDirection ?? "");
    const relationshipProduct = String(payload.relationshipProduct ?? "").trim();
    const relationshipMateriality = String(payload.relationshipMateriality ?? "unknown");
    const relationshipEvidenceClass = String(payload.relationshipEvidenceClass ?? "direct_disclosure");
    const relationshipSourceType = String(payload.relationshipSourceType ?? "sec");
    if (isRelationship) {
      if (relatedCompany.length < 2 || relationshipProduct.length < 3 || !relationshipDirections.includes(relationshipDirection)) {
        return Response.json({ error: "Name the related organization, direction, and supplied product or service." }, { status: 400 });
      }
      if (relatedTicker && (!researchUniverse.some((company) => company.ticker === relatedTicker) || relatedTicker === ticker)) {
        return Response.json({ error: "The related ticker must be a different company in the research universe, or left blank for a private organization." }, { status: 400 });
      }
      if (!relationshipMaterialities.includes(relationshipMateriality) || !relationshipEvidenceClasses.includes(relationshipEvidenceClass) || !["sec", "company"].includes(relationshipSourceType)) {
        return Response.json({ error: "Choose a valid relationship significance and evidence strength." }, { status: 400 });
      }
      if (relationshipSourceType === "sec" && !new URL(sourceUrl).hostname.toLowerCase().endsWith("sec.gov")) {
        return Response.json({ error: "An SEC relationship source must link directly to sec.gov." }, { status: 400 });
      }
    }
    const contributionRecord = {
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
      ...(isRelationship ? {
        related_company: relatedCompany.slice(0, 200),
        related_ticker: relatedTicker || null,
        relationship_direction: relationshipDirection,
        relationship_product: relationshipProduct.slice(0, 500),
        relationship_materiality: relationshipMateriality,
        relationship_evidence_class: relationshipEvidenceClass,
        relationship_source_type: relationshipSourceType,
      } : {}),
    };
    const { data, error } = await supabase.from("contributions").insert(contributionRecord).select("*").single();
    if (error) {
      if (isRelationship && (error.code === "PGRST204" || error.message.includes("relationship_"))) {
        return Response.json({ error: "Relationship submissions are temporarily unavailable while the database upgrade is applied. Other insight types remain available." }, { status: 503 });
      }
      throw error;
    }
    return Response.json({ submission: mapContribution(data as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
