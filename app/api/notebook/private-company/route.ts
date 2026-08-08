import { apiError, requireSupabaseUser } from "../../../supabase-server";

export const dynamic = "force-dynamic";

const stages = new Set(["pre_seed", "seed", "series_a", "series_b", "series_c", "series_d_plus", "growth", "pre_ipo", "bootstrapped", "acquired", "unknown"]);
const roundStages = new Set(["pre_seed", "seed", "series_a", "series_b", "series_c", "series_d_plus", "growth", "debt", "secondary", "other"]);
const metricUnits = new Set(["currency", "percent", "count", "multiple"]);
const estimateTypes = new Set(["actual", "company_forecast", "investor_forecast"]);
const holderTypes = new Set(["founder", "employee_pool", "institutional", "strategic", "angel", "other"]);

function cleanText(value: unknown, limit: number) {
  return String(value ?? "").trim().slice(0, limit);
}

function cleanDate(value: unknown) {
  const date = cleanText(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function cleanNumber(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) return null;
  return number;
}

function cleanCurrency(value: unknown) {
  const currency = cleanText(value, 3).toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : "USD";
}

function cleanUrl(value: unknown) {
  const url = cleanText(value, 2000);
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function cleanList(value: unknown, limit: number) {
  const values = Array.isArray(value) ? value : String(value ?? "").split(",");
  return [...new Set(values.map((item) => cleanText(item, 160)).filter(Boolean))].slice(0, limit);
}

function notebookJson(row: Record<string, unknown>) {
  return {
    id: row.id,
    companyKind: row.company_kind,
    companyKey: row.company_key,
    companyName: row.company_name,
    thesis: row.thesis,
    conviction: row.conviction,
    websiteUrl: row.website_url,
    stage: row.stage,
    foundedYear: row.founded_year,
    headquarters: row.headquarters,
    sector: row.sector,
    businessModel: row.business_model,
    profileSummary: row.profile_summary,
    currency: row.currency,
    currentValuation: row.current_valuation,
    valuationAsOf: row.valuation_as_of,
    totalRaised: row.total_raised,
    employeeCount: row.employee_count,
    lastVerifiedOn: row.last_verified_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function metricJson(row: Record<string, unknown>) {
  return {
    id: row.id, notebookId: row.notebook_id, metricName: row.metric_name, periodLabel: row.period_label,
    value: row.value, unit: row.unit, currency: row.currency, estimateType: row.estimate_type,
    asOfDate: row.as_of_date, notes: row.notes, sourceTitle: row.source_title, sourceUrl: row.source_url,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function fundingJson(row: Record<string, unknown>) {
  return {
    id: row.id, notebookId: row.notebook_id, roundName: row.round_name, stage: row.stage, closeDate: row.close_date,
    amountRaised: row.amount_raised, preMoneyValuation: row.pre_money_valuation, postMoneyValuation: row.post_money_valuation,
    currency: row.currency, securityType: row.security_type, leadInvestors: row.lead_investors,
    participatingInvestors: row.participating_investors, notes: row.notes, sourceTitle: row.source_title,
    sourceUrl: row.source_url, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function capTableJson(row: Record<string, unknown>) {
  return {
    id: row.id, notebookId: row.notebook_id, holderName: row.holder_name, holderType: row.holder_type,
    securityClass: row.security_class, shares: row.shares, ownershipPercent: row.ownership_percent,
    fullyDilutedPercent: row.fully_diluted_percent, asOfDate: row.as_of_date, notes: row.notes,
    sourceTitle: row.source_title, sourceUrl: row.source_url, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

async function ownedPrivateNotebook(
  supabase: Awaited<ReturnType<typeof requireSupabaseUser>>["supabase"],
  userId: string,
  notebookId: number,
) {
  const { data, error } = await supabase.from("research_notebooks").select("*")
    .eq("id", notebookId).eq("user_id", userId).eq("company_kind", "private").maybeSingle();
  if (error) throw error;
  return data as Record<string, unknown> | null;
}

function validNotebookId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const notebookId = validNotebookId(new URL(request.url).searchParams.get("notebookId"));
    if (!notebookId) return Response.json({ error: "Choose a valid private-company notebook." }, { status: 400 });
    const notebook = await ownedPrivateNotebook(supabase, profile.user_id, notebookId);
    if (!notebook) return Response.json({ error: "Private-company notebook not found." }, { status: 404 });
    const [metrics, fundingRounds, capTable, noteCount] = await Promise.all([
      supabase.from("private_company_metrics").select("*").eq("user_id", profile.user_id).eq("notebook_id", notebookId).order("period_label"),
      supabase.from("private_company_funding_rounds").select("*").eq("user_id", profile.user_id).eq("notebook_id", notebookId).order("close_date", { ascending: false, nullsFirst: false }),
      supabase.from("private_company_cap_table_entries").select("*").eq("user_id", profile.user_id).eq("notebook_id", notebookId).order("ownership_percent", { ascending: false, nullsFirst: false }),
      supabase.from("research_notes").select("id", { count: "exact", head: true }).eq("user_id", profile.user_id).eq("notebook_id", notebookId),
    ]);
    for (const result of [metrics, fundingRounds, capTable, noteCount]) if (result.error) throw result.error;
    return Response.json({
      notebook: notebookJson(notebook),
      metrics: (metrics.data ?? []).map((row) => metricJson(row)),
      fundingRounds: (fundingRounds.data ?? []).map((row) => fundingJson(row)),
      capTable: (capTable.data ?? []).map((row) => capTableJson(row)),
      noteCount: noteCount.count ?? 0,
      owner: { username: profile.username },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as Record<string, unknown>;
    const notebookId = validNotebookId(payload.notebookId);
    if (!notebookId) return Response.json({ error: "Choose a valid private-company notebook." }, { status: 400 });
    const notebook = await ownedPrivateNotebook(supabase, profile.user_id, notebookId);
    if (!notebook) return Response.json({ error: "Private-company notebook not found." }, { status: 404 });

    if (payload.entity === "profile") {
      const websiteUrl = cleanUrl(payload.websiteUrl);
      if (websiteUrl === null) return Response.json({ error: "Website must be a valid http or https address." }, { status: 400 });
      const foundedYear = cleanNumber(payload.foundedYear, 1800, 2200);
      const employeeCount = cleanNumber(payload.employeeCount, 0, 100000000);
      const updates = {
        company_name: cleanText(payload.companyName, 160) || notebook.company_name,
        thesis: cleanText(payload.thesis, 12000),
        conviction: ["unranked", "watching", "low", "medium", "high"].includes(String(payload.conviction)) ? String(payload.conviction) : notebook.conviction,
        website_url: websiteUrl,
        stage: stages.has(String(payload.stage)) ? String(payload.stage) : "unknown",
        founded_year: foundedYear,
        headquarters: cleanText(payload.headquarters, 160),
        sector: cleanText(payload.sector, 120),
        business_model: cleanText(payload.businessModel, 5000),
        profile_summary: cleanText(payload.profileSummary, 12000),
        currency: cleanCurrency(payload.currency),
        current_valuation: cleanNumber(payload.currentValuation),
        valuation_as_of: cleanDate(payload.valuationAsOf),
        total_raised: cleanNumber(payload.totalRaised),
        employee_count: employeeCount,
        last_verified_on: cleanDate(payload.lastVerifiedOn),
      };
      const { data, error } = await supabase.from("research_notebooks").update(updates)
        .eq("id", notebookId).eq("user_id", profile.user_id).eq("company_kind", "private").select("*").single();
      if (error) throw error;
      return Response.json({ notebook: notebookJson(data) });
    }

    const id = validNotebookId(payload.id);
    if (!id) return Response.json({ error: "Choose a valid record." }, { status: 400 });
    const entity = String(payload.entity);
    if (entity === "metric") {
      const value = cleanNumber(payload.value);
      if (value === null) return Response.json({ error: "Enter a valid metric value." }, { status: 400 });
      const sourceUrl = cleanUrl(payload.sourceUrl);
      if (sourceUrl === null) return Response.json({ error: "Source must be a valid http or https address." }, { status: 400 });
      const { data, error } = await supabase.from("private_company_metrics").update({
        metric_name: cleanText(payload.metricName, 80) || "ARR", period_label: cleanText(payload.periodLabel, 40), value,
        unit: metricUnits.has(String(payload.unit)) ? String(payload.unit) : "currency", currency: cleanCurrency(payload.currency),
        estimate_type: estimateTypes.has(String(payload.estimateType)) ? String(payload.estimateType) : "actual",
        as_of_date: cleanDate(payload.asOfDate), notes: cleanText(payload.notes, 5000), source_title: cleanText(payload.sourceTitle, 240), source_url: sourceUrl,
      }).eq("id", id).eq("notebook_id", notebookId).eq("user_id", profile.user_id).select("*").single();
      if (error) throw error;
      return Response.json({ metric: metricJson(data) });
    }
    if (entity === "funding_round") {
      const sourceUrl = cleanUrl(payload.sourceUrl);
      if (sourceUrl === null) return Response.json({ error: "Source must be a valid http or https address." }, { status: 400 });
      const { data, error } = await supabase.from("private_company_funding_rounds").update({
        round_name: cleanText(payload.roundName, 120), stage: roundStages.has(String(payload.stage)) ? String(payload.stage) : "other",
        close_date: cleanDate(payload.closeDate), amount_raised: cleanNumber(payload.amountRaised), pre_money_valuation: cleanNumber(payload.preMoneyValuation),
        post_money_valuation: cleanNumber(payload.postMoneyValuation), currency: cleanCurrency(payload.currency), security_type: cleanText(payload.securityType, 120),
        lead_investors: cleanList(payload.leadInvestors, 30), participating_investors: cleanList(payload.participatingInvestors, 100),
        notes: cleanText(payload.notes, 8000), source_title: cleanText(payload.sourceTitle, 240), source_url: sourceUrl,
      }).eq("id", id).eq("notebook_id", notebookId).eq("user_id", profile.user_id).select("*").single();
      if (error) throw error;
      return Response.json({ fundingRound: fundingJson(data) });
    }
    if (entity === "cap_table") {
      const sourceUrl = cleanUrl(payload.sourceUrl);
      if (sourceUrl === null) return Response.json({ error: "Source must be a valid http or https address." }, { status: 400 });
      const { data, error } = await supabase.from("private_company_cap_table_entries").update({
        holder_name: cleanText(payload.holderName, 200), holder_type: holderTypes.has(String(payload.holderType)) ? String(payload.holderType) : "other",
        security_class: cleanText(payload.securityClass, 120), shares: cleanNumber(payload.shares), ownership_percent: cleanNumber(payload.ownershipPercent, 0, 100),
        fully_diluted_percent: cleanNumber(payload.fullyDilutedPercent, 0, 100), as_of_date: cleanDate(payload.asOfDate), notes: cleanText(payload.notes, 8000),
        source_title: cleanText(payload.sourceTitle, 240), source_url: sourceUrl,
      }).eq("id", id).eq("notebook_id", notebookId).eq("user_id", profile.user_id).select("*").single();
      if (error) throw error;
      return Response.json({ capTableEntry: capTableJson(data) });
    }
    return Response.json({ error: "Unknown private-company record type." }, { status: 400 });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as Record<string, unknown>;
    const notebookId = validNotebookId(payload.notebookId);
    if (!notebookId) return Response.json({ error: "Choose a valid private-company notebook." }, { status: 400 });
    if (!await ownedPrivateNotebook(supabase, profile.user_id, notebookId)) return Response.json({ error: "Private-company notebook not found." }, { status: 404 });
    const sourceUrl = cleanUrl(payload.sourceUrl);
    if (sourceUrl === null) return Response.json({ error: "Source must be a valid http or https address." }, { status: 400 });
    if (payload.entity === "metric") {
      const value = cleanNumber(payload.value);
      const periodLabel = cleanText(payload.periodLabel, 40);
      if (value === null || !periodLabel) return Response.json({ error: "Metric period and value are required." }, { status: 400 });
      const { data, error } = await supabase.from("private_company_metrics").insert({
        user_id: profile.user_id, notebook_id: notebookId, metric_name: cleanText(payload.metricName, 80) || "ARR", period_label: periodLabel, value,
        unit: metricUnits.has(String(payload.unit)) ? String(payload.unit) : "currency", currency: cleanCurrency(payload.currency),
        estimate_type: estimateTypes.has(String(payload.estimateType)) ? String(payload.estimateType) : "actual", as_of_date: cleanDate(payload.asOfDate),
        notes: cleanText(payload.notes, 5000), source_title: cleanText(payload.sourceTitle, 240), source_url: sourceUrl,
      }).select("*").single();
      if (error) throw error;
      return Response.json({ metric: metricJson(data) }, { status: 201 });
    }
    if (payload.entity === "funding_round") {
      const roundName = cleanText(payload.roundName, 120);
      if (!roundName) return Response.json({ error: "Round name is required." }, { status: 400 });
      const { data, error } = await supabase.from("private_company_funding_rounds").insert({
        user_id: profile.user_id, notebook_id: notebookId, round_name: roundName, stage: roundStages.has(String(payload.stage)) ? String(payload.stage) : "other",
        close_date: cleanDate(payload.closeDate), amount_raised: cleanNumber(payload.amountRaised), pre_money_valuation: cleanNumber(payload.preMoneyValuation),
        post_money_valuation: cleanNumber(payload.postMoneyValuation), currency: cleanCurrency(payload.currency), security_type: cleanText(payload.securityType, 120),
        lead_investors: cleanList(payload.leadInvestors, 30), participating_investors: cleanList(payload.participatingInvestors, 100),
        notes: cleanText(payload.notes, 8000), source_title: cleanText(payload.sourceTitle, 240), source_url: sourceUrl,
      }).select("*").single();
      if (error) throw error;
      return Response.json({ fundingRound: fundingJson(data) }, { status: 201 });
    }
    if (payload.entity === "cap_table") {
      const holderName = cleanText(payload.holderName, 200);
      if (!holderName) return Response.json({ error: "Holder name is required." }, { status: 400 });
      const { data, error } = await supabase.from("private_company_cap_table_entries").insert({
        user_id: profile.user_id, notebook_id: notebookId, holder_name: holderName,
        holder_type: holderTypes.has(String(payload.holderType)) ? String(payload.holderType) : "other", security_class: cleanText(payload.securityClass, 120),
        shares: cleanNumber(payload.shares), ownership_percent: cleanNumber(payload.ownershipPercent, 0, 100),
        fully_diluted_percent: cleanNumber(payload.fullyDilutedPercent, 0, 100), as_of_date: cleanDate(payload.asOfDate), notes: cleanText(payload.notes, 8000),
        source_title: cleanText(payload.sourceTitle, 240), source_url: sourceUrl,
      }).select("*").single();
      if (error) throw error;
      return Response.json({ capTableEntry: capTableJson(data) }, { status: 201 });
    }
    return Response.json({ error: "Unknown private-company record type." }, { status: 400 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as Record<string, unknown>;
    const notebookId = validNotebookId(payload.notebookId);
    const id = validNotebookId(payload.id);
    if (!notebookId || !id) return Response.json({ error: "Choose a valid private-company record." }, { status: 400 });
    if (!await ownedPrivateNotebook(supabase, profile.user_id, notebookId)) return Response.json({ error: "Private-company notebook not found." }, { status: 404 });
    const table = payload.entity === "metric" ? "private_company_metrics"
      : payload.entity === "funding_round" ? "private_company_funding_rounds"
        : payload.entity === "cap_table" ? "private_company_cap_table_entries" : null;
    if (!table) return Response.json({ error: "Unknown private-company record type." }, { status: 400 });
    const { error } = await supabase.from(table).delete().eq("id", id).eq("notebook_id", notebookId).eq("user_id", profile.user_id);
    if (error) throw error;
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
