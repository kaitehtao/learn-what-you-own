import { getDb } from "../../../../db";
import { companies, companyRelationships, emergingCompanyDossiers } from "../../../../db/schema";
import { researchUniverse } from "../../../data/universe";
import { apiError, requireEditor } from "../../../supabase-server";
import { awardPoints, rewardRules } from "../../../../db/rewards";
import { normalizeRelevantLinks } from "../../../contribution-links";

export const dynamic = "force-dynamic";

function mapRow(row: Record<string, unknown>) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    userId: row.user_id,
    username: (profile as { username?: string } | null)?.username ?? "member",
    ticker: row.ticker,
    contributionType: row.contribution_type,
    claim: row.claim,
    whyItMatters: row.why_it_matters,
    sourceUrl: row.source_url,
    relevantLinks: normalizeRelevantLinks(row.relevant_links) ?? [],
    positionDisclosure: row.position_disclosure,
    status: row.status,
    moderationNote: row.moderation_note,
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
    roadshowUrl: row.roadshow_storage_path ? `/api/admin/roadshows/${row.id}` : row.roadshow_source_url,
    researchAssetType: row.research_asset_type,
    researchAssetTitle: row.research_asset_title,
    researchAssetFileName: row.research_asset_file_name,
    researchAssetFileSize: row.research_asset_file_size,
    researchAssetUrl: row.research_asset_storage_path ? `/api/admin/contribution-assets/${row.id}` : null,
    googleSheetUrl: row.google_sheet_url,
    collaborationNotes: row.collaboration_notes,
    evidenceDate: row.evidence_date,
    createdAt: row.created_at,
  };
}

async function publishCompanyProposal(row: Record<string, unknown>, editorUsername: string) {
  if (row.contribution_type !== "Upcoming IPO dossier" && row.contribution_type !== "Private company dossier") return false;
  const slug = String(row.proposed_company_slug ?? "").trim();
  const companyName = String(row.proposed_company_name ?? "").trim();
  const companyType = String(row.company_stage ?? "");
  if (!slug || !companyName || !["upcoming_ipo", "private"].includes(companyType)) {
    throw new Error("The company proposal is missing its name, slug, or stage.");
  }
  const profile = (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles) as { username?: string } | null;
  const values = {
    slug,
    companyName,
    companyType: companyType as "upcoming_ipo" | "private",
    proposedTicker: row.proposed_ticker ? String(row.proposed_ticker) : null,
    proposedExchange: row.proposed_exchange ? String(row.proposed_exchange) : null,
    expectedIpoDate: row.expected_ipo_date ? String(row.expected_ipo_date) : null,
    websiteUrl: String(row.company_website),
    summary: String(row.claim).slice(0, 2500),
    whyItMatters: String(row.why_it_matters).slice(0, 2500),
    primarySourceUrl: String(row.source_url),
    roadshowTitle: row.roadshow_title ? String(row.roadshow_title) : null,
    roadshowStoragePath: row.roadshow_storage_path ? String(row.roadshow_storage_path) : null,
    roadshowSourceUrl: row.roadshow_source_url ? String(row.roadshow_source_url) : null,
    contributorUsername: profile?.username ?? "member",
    supabaseContributionId: String(row.id),
    verifiedBy: editorUsername,
    verifiedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const db = getDb();
  await db.insert(emergingCompanyDossiers).values(values).onConflictDoUpdate({
    target: emergingCompanyDossiers.slug,
    set: values,
  });
  return true;
}

async function ensureD1Company(ticker: string | null) {
  if (!ticker) return;
  const company = researchUniverse.find((candidate) => candidate.ticker === ticker);
  if (!company) return;
  const db = getDb();
  await db.insert(companies).values({
    ticker: company.ticker,
    name: company.name,
    sector: company.sector,
    exchange: company.exchange,
    marketCap: company.marketCap,
    membershipsJson: JSON.stringify(company.memberships),
    indexWeightsJson: JSON.stringify(company.indexWeights),
  }).onConflictDoNothing();
}

async function publishRelationship(row: Record<string, unknown>, editorUsername: string) {
  if (row.contribution_type !== "Supplier / customer relationship") return false;
  const ticker = String(row.ticker ?? "").toUpperCase();
  const relatedTicker = row.related_ticker ? String(row.related_ticker).toUpperCase() : null;
  const subject = researchUniverse.find((candidate) => candidate.ticker === ticker);
  if (!subject || !row.related_company || !row.relationship_product || !row.relationship_direction) {
    throw new Error("The relationship contribution is missing a valid company, direction, or product/service.");
  }
  await ensureD1Company(ticker);
  await ensureD1Company(relatedTicker);

  const relatedName = String(row.related_company);
  const subjectName = subject.name;
  const relatedIsSupplier = row.relationship_direction === "supplier_to_company";
  const sourceUrl = String(row.source_url);
  const hostname = new URL(sourceUrl).hostname.toLowerCase();
  const sourceType = String(row.relationship_source_type ?? "") as "sec" | "company";
  if (!["sec", "company"].includes(sourceType)) throw new Error("The relationship is missing its primary-source classification.");
  if (sourceType === "sec" && hostname !== "sec.gov" && !hostname.endsWith(".sec.gov")) throw new Error("SEC evidence must link directly to sec.gov.");
  const contributionProfile = (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles) as { username?: string } | null;
  const db = getDb();
  await db.insert(companyRelationships).values({
    supplierTicker: relatedIsSupplier ? relatedTicker : ticker,
    supplierName: relatedIsSupplier ? relatedName : subjectName,
    customerTicker: relatedIsSupplier ? ticker : relatedTicker,
    customerName: relatedIsSupplier ? subjectName : relatedName,
    productService: String(row.relationship_product).slice(0, 500),
    evidenceSummary: `${String(row.claim)} ${String(row.why_it_matters)}`.trim().slice(0, 3000),
    materiality: String(row.relationship_materiality ?? "unknown") as "named" | "material" | "strategic" | "unknown",
    evidenceClass: String(row.relationship_evidence_class ?? "direct_disclosure") as "direct_disclosure" | "corroborated" | "inferred",
    sourceType,
    sourceTitle: sourceType === "sec" ? "SEC filing evidence" : "Official company evidence",
    sourceUrl,
    evidenceDate: String(row.evidence_date),
    contributorUsername: contributionProfile?.username ?? "member",
    supabaseContributionId: String(row.id),
    verifiedBy: editorUsername,
  }).onConflictDoNothing();
  return true;
}

export async function GET(request: Request) {
  try {
    const { supabase } = await requireEditor(request);
    const { data, error } = await supabase
      .from("contributions")
      .select("*,profiles!contributions_user_id_fkey(username)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return Response.json({ contributions: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)) });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile, supabase } = await requireEditor(request);
    const payload = await request.json() as { id?: number; status?: string; moderationNote?: string };
    if (!Number.isInteger(payload.id) || !["approved", "needs_revision", "rejected"].includes(payload.status ?? "")) {
      return Response.json({ error: "A valid submission and moderation decision are required." }, { status: 400 });
    }
    const { data: contribution, error: contributionError } = await supabase.from("contributions")
      .select("*,profiles!contributions_user_id_fkey(username)").eq("id", payload.id!).single();
    if (contributionError || !contribution) throw contributionError ?? new Error("Submission not found.");
    const { error } = await supabase.from("contributions").update({
      status: payload.status,
      moderation_note: payload.moderationNote?.trim().slice(0, 1000) ?? "",
      moderated_by: profile.user_id,
      moderated_at: new Date().toISOString(),
    }).eq("id", payload.id!);
    if (error) throw error;
    const relationshipPublished = payload.status === "approved"
      ? await publishRelationship(contribution as Record<string, unknown>, profile.username)
      : false;
    const companyPublished = payload.status === "approved"
      ? await publishCompanyProposal(contribution as Record<string, unknown>, profile.username)
      : false;
    const contributionProfile = (Array.isArray(contribution.profiles) ? contribution.profiles[0] : contribution.profiles) as { username?: string } | null;
    const contributionType = String(contribution.contribution_type ?? "Contribution");
    const points = companyPublished ? rewardRules.approvedCompanyDossier
      : relationshipPublished ? rewardRules.approvedRelationship
        : /correction/i.test(contributionType) ? rewardRules.approvedCorrection
          : rewardRules.approvedContribution;
    const pointsAwarded = payload.status === "approved"
      ? await awardPoints({
        userId: String(contribution.user_id),
        username: contributionProfile?.username ?? "member",
        eventType: "approved_contribution",
        sourceType: "contribution",
        sourceId: String(contribution.id),
        points,
        description: `${contributionType} approved by editorial review`,
        awardedBy: profile.username,
      })
      : 0;
    return Response.json({ ok: true, relationshipPublished, companyPublished, pointsAwarded });
  } catch (error) {
    return apiError(error);
  }
}
