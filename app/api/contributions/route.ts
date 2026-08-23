import { researchUniverse } from "../../data/universe";
import { CONTRIBUTION_RESEARCH_BUCKET, normalizeGoogleSheetUrl } from "../../contribution-research-assets";
import { apiError, getSupabaseAdminClient, getSupabaseForRequest, requireSupabaseUser } from "../../supabase-server";
import { enforceActionRateLimit } from "../../community-safety";
import { notifyPrivilegedReviewersSafely } from "../../admin-action-notifications";
import { normalizeRelevantLinks } from "../../contribution-links";

export const dynamic = "force-dynamic";

const allowedTypes = ["Factual correction", "Thesis update", "Industry observation", "External dataset observation", "Competitive analysis", "Financial model", "Earnings model", "Research report", "Question for management", "Supplier / customer relationship", "Upcoming IPO dossier", "Private company dossier"];
const relationshipDirections = ["supplier_to_company", "company_to_customer"];
const relationshipMaterialities = ["named", "material", "strategic", "unknown"];
const relationshipEvidenceClasses = ["direct_disclosure", "corroborated", "inferred"];

function mapContribution(row: Record<string, unknown>) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const sheet = normalizeGoogleSheetUrl(String(row.google_sheet_url ?? ""));
  return {
    id: row.id,
    ticker: row.ticker,
    contributionType: row.contribution_type,
    claim: row.claim,
    whyItMatters: row.why_it_matters,
    sourceUrl: row.source_url,
    relevantLinks: normalizeRelevantLinks(row.relevant_links) ?? [],
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
    proposedCompanyName: row.proposed_company_name,
    proposedCompanySlug: row.proposed_company_slug,
    companyStage: row.company_stage,
    proposedTicker: row.proposed_ticker,
    proposedExchange: row.proposed_exchange,
    expectedIpoDate: row.expected_ipo_date,
    companyWebsite: row.company_website,
    roadshowTitle: row.roadshow_title,
    roadshowUrl: row.roadshow_storage_path ? `/api/roadshows/${row.id}` : row.roadshow_source_url,
    researchAssetType: row.research_asset_type,
    researchAssetTitle: row.research_asset_title,
    researchAssetFileName: row.research_asset_file_name,
    researchAssetFileSize: row.research_asset_file_size,
    researchAssetUrl: row.research_asset_storage_path && row.status === "approved" ? `/api/contribution-assets/${row.id}` : null,
    googleSheetUrl: sheet?.viewUrl ?? null,
    googleSheetEmbedUrl: sheet?.embedUrl ?? null,
    collaborationNotes: row.collaboration_notes,
    status: row.status,
    moderationNote: row.moderation_note,
    createdAt: row.created_at,
    username: (profile as { username?: string } | null)?.username ?? "member",
  };
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const ticker = searchParams.get("ticker")?.trim().toUpperCase();
    if (searchParams.get("companyProposals") === "true") {
      const supabase = getSupabaseForRequest();
      const { data, error } = await supabase.from("contributions")
        .select("*,profiles!contributions_user_id_fkey(username)")
        .in("contribution_type", ["Upcoming IPO dossier", "Private company dossier"])
        .eq("status", "approved").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return Response.json({ companies: (data ?? []).map((row) => mapContribution(row as Record<string, unknown>)) });
    }
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
    await enforceActionRateLimit(getSupabaseAdminClient(), profile.user_id, "contribution", 10, 86400);
    const contributionType = String(payload.contributionType ?? "");
    const isCompanyProposal = contributionType === "Upcoming IPO dossier" || contributionType === "Private company dossier";
    const proposedCompanyName = String(payload.proposedCompanyName ?? "").trim();
    const proposedCompanySlug = proposedCompanyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    const proposedTicker = String(payload.proposedTicker ?? "").trim().toUpperCase().slice(0, 12);
    const ticker = isCompanyProposal ? (proposedTicker || `PRIVATE-${proposedCompanySlug.slice(0, 20)}`) : String(payload.ticker ?? "").trim().toUpperCase();
    const claim = String(payload.claim ?? "").trim();
    const whyItMatters = String(payload.whyItMatters ?? "").trim();
    const sourceUrl = String(payload.sourceUrl ?? "").trim();
    const relevantLinks = normalizeRelevantLinks(payload.relevantLinks);
    const evidenceDate = String(payload.evidenceDate ?? "").trim();
    const positionDisclosure = String(payload.positionDisclosure ?? "").trim();
    if (!allowedTypes.includes(contributionType)) return Response.json({ error: "Choose a valid contribution type." }, { status: 400 });
    if (!isCompanyProposal && !researchUniverse.some((company) => company.ticker === ticker)) return Response.json({ error: "Choose a valid company ticker." }, { status: 400 });
    if (claim.length < 20 || whyItMatters.length < 20) return Response.json({ error: "Explain the claim and why it matters in at least 20 characters each." }, { status: 400 });
    try { new URL(sourceUrl); } catch { return Response.json({ error: "Enter a valid source URL." }, { status: 400 }); }
    if (!relevantLinks) return Response.json({ error: "Add no more than five valid web links, one per line." }, { status: 400 });
    if (!evidenceDate || !positionDisclosure) return Response.json({ error: "Evidence date and position disclosure are required." }, { status: 400 });
    const supportsResearchAsset = ["Financial model", "Earnings model", "Research report"].includes(contributionType);
    const researchAssetType = String(payload.researchAssetType ?? "");
    const researchAssetTitle = String(payload.researchAssetTitle ?? "").trim().slice(0, 200);
    const researchAssetStoragePath = String(payload.researchAssetStoragePath ?? "").trim();
    const researchAssetFileName = String(payload.researchAssetFileName ?? "").trim().slice(0, 240);
    const researchAssetMimeType = String(payload.researchAssetMimeType ?? "").trim();
    const researchAssetFileSize = Number(payload.researchAssetFileSize ?? 0);
    const googleSheetInput = String(payload.googleSheetUrl ?? "").trim();
    const googleSheet = normalizeGoogleSheetUrl(googleSheetInput);
    const collaborationNotes = String(payload.collaborationNotes ?? "").trim().slice(0, 1500);
    if (!supportsResearchAsset && (researchAssetStoragePath || googleSheetInput)) {
      return Response.json({ error: "Files and collaborative worksheets are available for financial models, earnings models, and research reports." }, { status: 400 });
    }
    if (googleSheetInput && !googleSheet) {
      return Response.json({ error: "Use a valid Google Sheets URL from docs.google.com/spreadsheets." }, { status: 400 });
    }
    if ((researchAssetStoragePath || googleSheet) && !researchAssetTitle) {
      return Response.json({ error: "Add a clear public title for the research file or worksheet." }, { status: 400 });
    }
    if (researchAssetStoragePath) {
      const expectedType = contributionType === "Research report" ? "research_report" : "earnings_model";
      const allowedMimes = expectedType === "research_report"
        ? ["application/pdf"]
        : ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"];
      if (!researchAssetStoragePath.startsWith(`${profile.user_id}/`) || researchAssetStoragePath.includes("..")
        || researchAssetType !== expectedType || !researchAssetTitle || !researchAssetFileName
        || !allowedMimes.includes(researchAssetMimeType) || !Number.isInteger(researchAssetFileSize)
        || researchAssetFileSize < 1 || researchAssetFileSize > 20 * 1024 * 1024) {
        return Response.json({ error: "The uploaded research file metadata is invalid." }, { status: 400 });
      }
    }
    if (contributionType === "Research report" && !researchAssetStoragePath) {
      return Response.json({ error: "Upload a PDF research report before submitting." }, { status: 400 });
    }
    if (contributionType === "Earnings model" && !researchAssetStoragePath && !googleSheet) {
      return Response.json({ error: "Upload an XLSX/CSV model or add a collaborative Google Sheets URL." }, { status: 400 });
    }
    const isRelationship = contributionType === "Supplier / customer relationship";
    const companyStage = contributionType === "Upcoming IPO dossier" ? "upcoming_ipo" : contributionType === "Private company dossier" ? "private" : "";
    const proposedExchange = String(payload.proposedExchange ?? "").trim().slice(0, 80);
    const expectedIpoDate = String(payload.expectedIpoDate ?? "").trim();
    const companyWebsite = String(payload.companyWebsite ?? "").trim();
    const roadshowTitle = String(payload.roadshowTitle ?? "").trim().slice(0, 200);
    const roadshowStoragePath = String(payload.roadshowStoragePath ?? "").trim();
    const roadshowSourceUrl = String(payload.roadshowSourceUrl ?? "").trim();
    if (isCompanyProposal) {
      if (proposedCompanyName.length < 2 || proposedCompanySlug.length < 2) return Response.json({ error: "Enter the proposed company name." }, { status: 400 });
      if (proposedTicker && !/^[A-Z0-9.-]{1,12}$/.test(proposedTicker)) return Response.json({ error: "Use a valid proposed ticker or leave it blank." }, { status: 400 });
      try { new URL(companyWebsite); } catch { return Response.json({ error: "Enter the company’s official website." }, { status: 400 }); }
      if (companyStage === "upcoming_ipo" && !expectedIpoDate) return Response.json({ error: "Enter the expected IPO date or best currently announced date." }, { status: 400 });
      if (roadshowStoragePath && (!roadshowStoragePath.startsWith(`${profile.user_id}/`) || !roadshowStoragePath.toLowerCase().endsWith(".pdf"))) {
        return Response.json({ error: "The roadshow upload path is invalid." }, { status: 400 });
      }
      if (roadshowSourceUrl) try { new URL(roadshowSourceUrl); } catch { return Response.json({ error: "Enter a valid official roadshow URL." }, { status: 400 }); }
    }
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
      relevant_links: relevantLinks,
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
      ...(isCompanyProposal ? {
        proposed_company_name: proposedCompanyName.slice(0, 200),
        proposed_company_slug: proposedCompanySlug,
        company_stage: companyStage,
        proposed_ticker: proposedTicker || null,
        proposed_exchange: proposedExchange || null,
        expected_ipo_date: expectedIpoDate || null,
        company_website: companyWebsite.slice(0, 1000),
        roadshow_title: roadshowTitle || null,
        roadshow_storage_path: roadshowStoragePath || null,
        roadshow_source_url: roadshowSourceUrl || null,
      } : {}),
      ...(supportsResearchAsset ? {
        research_asset_type: researchAssetStoragePath ? researchAssetType : googleSheet ? "earnings_model" : null,
        research_asset_title: researchAssetStoragePath || googleSheet ? researchAssetTitle : null,
        research_asset_storage_path: researchAssetStoragePath || null,
        research_asset_file_name: researchAssetStoragePath ? researchAssetFileName : null,
        research_asset_mime_type: researchAssetStoragePath ? researchAssetMimeType : null,
        research_asset_file_size: researchAssetStoragePath ? researchAssetFileSize : null,
        google_sheet_url: googleSheet?.viewUrl ?? null,
        collaboration_notes: collaborationNotes || null,
      } : {}),
    };
    const { data, error } = await supabase.from("contributions").insert(contributionRecord).select("*").single();
    if (error) {
      if (researchAssetStoragePath) {
        await getSupabaseAdminClient().storage.from(CONTRIBUTION_RESEARCH_BUCKET).remove([researchAssetStoragePath]);
      }
      if ((isRelationship || isCompanyProposal) && (error.code === "PGRST204" || error.message.includes("relationship_") || error.message.includes("proposed_") || error.message.includes("roadshow_"))) {
        return Response.json({ error: "This submission workflow is temporarily unavailable while the database upgrade is applied." }, { status: 503 });
      }
      if (supportsResearchAsset && (error.code === "PGRST204" || error.message.includes("research_asset_") || error.message.includes("google_sheet_"))) {
        return Response.json({ error: "Research uploads are temporarily unavailable while the database upgrade is applied." }, { status: 503 });
      }
      if (error.code === "PGRST204" || error.message.includes("relevant_links")) {
        return Response.json({ error: "Supporting links are temporarily unavailable while the database upgrade is applied." }, { status: 503 });
      }
      throw error;
    }
    await notifyPrivilegedReviewersSafely({
      actorId: profile.user_id,
      title: "Research contribution awaiting review",
      detail: `${ticker} · ${contributionType} submitted by @${profile.username}`,
      href: "/admin#moderation",
      entityType: "contribution_review",
      entityId: data.id,
    });
    return Response.json({ submission: mapContribution(data as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
