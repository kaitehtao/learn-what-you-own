import { researchUniverse } from "../../data/universe";
import { apiError, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

const statuses = new Set(["triage","researching","ready_for_review","owned","rejected","archived"]);
const recommendations = new Set(["unrated","positive","neutral","negative"]);
const horizons = new Set(["short","medium","long"]);
const directions = new Set(["bull","bear","neutral"]);
const driverStatuses = new Set(["active","confirmed","weakened","invalidated","archived"]);
const decisions = new Set(["watch","research","add","hold","reduce","exit","reject"]);
const factsDimensions = ["financial","accounting","credibility","timing","sector"] as const;
const factsStatuses = new Set(["not_started","in_progress","evidence_complete","reviewed"]);
const stockProfiles = new Set(["unclassified","growth","value","turnaround"]);
const commitmentStatuses = new Set(["open","achieved","partially_achieved","delayed","missed","unverifiable"]);
const channelTypes = new Set(["management","customer","supplier","distributor","competitor","consultant","trade_show","other"]);
const thesisImpacts = new Set(["bull","bear","neutral"]);
const postmortemOutcomes = new Set(["open","win","loss","avoided_loss","missed_opportunity"]);
const thesisResults = new Set(["correct","incorrect","mixed","too_early","unresolved"]);

function cleanText(value: unknown, limit: number) { return String(value ?? "").trim().slice(0, limit); }
function integer(value: unknown, minimum: number, maximum: number, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}
function optionalNumber(value: unknown) {
  if (value === "" || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function sourceUrl(value: unknown) {
  const text = cleanText(value, 2000);
  if (!text) return "";
  try { const parsed = new URL(text); return ["http:","https:"].includes(parsed.protocol) ? parsed.toString() : null; } catch { return null; }
}
function validTicker(value: unknown) {
  const ticker = cleanText(value, 12).toUpperCase();
  return researchUniverse.find((company) => company.ticker === ticker) ?? null;
}

async function ownedWorkspace(supabase: Awaited<ReturnType<typeof requireSupabaseUser>>["supabase"], userId: string, tickerValue: unknown) {
  const company = validTicker(tickerValue);
  if (!company) throw new Response(JSON.stringify({ error: "Choose a ticker from the research universe." }), { status: 400, headers: { "content-type": "application/json" } });
  const { data: notebook, error: notebookError } = await supabase.from("research_notebooks")
    .upsert({ user_id: userId, ticker: company.ticker, company_name: company.name }, { onConflict: "user_id,ticker" })
    .select("id,ticker,company_name,thesis,conviction,updated_at").single();
  if (notebookError) throw notebookError;
  const { data: workspace, error: workspaceError } = await supabase.from("analyst_workspaces")
    .upsert({ user_id: userId, notebook_id: notebook.id, ticker: company.ticker }, { onConflict: "user_id,ticker" })
    .select("*").single();
  if (workspaceError) throw workspaceError;
  const { error: factsError } = await supabase.from("analyst_facts_assessments").upsert(
    factsDimensions.map((dimension) => ({ workspace_id: workspace.id, user_id: userId, dimension })),
    { onConflict: "workspace_id,dimension", ignoreDuplicates: true },
  );
  if (factsError) throw factsError;
  return { company, notebook, workspace };
}

async function responsePayload(supabase: Awaited<ReturnType<typeof requireSupabaseUser>>["supabase"], userId: string, ticker: string) {
  const core = await ownedWorkspace(supabase, userId, ticker);
  const [drivers, scenarios, journal, facts, commitments, channelChecks, postmortems] = await Promise.all([
    supabase.from("analyst_thesis_drivers").select("*").eq("workspace_id", core.workspace.id).eq("user_id", userId).order("rank").order("updated_at", { ascending: false }),
    supabase.from("analyst_valuation_scenarios").select("*").eq("workspace_id", core.workspace.id).eq("user_id", userId).order("scenario"),
    supabase.from("analyst_decision_journal").select("*").eq("workspace_id", core.workspace.id).eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
    supabase.from("analyst_facts_assessments").select("*").eq("workspace_id", core.workspace.id).eq("user_id", userId).order("dimension"),
    supabase.from("analyst_management_commitments").select("*").eq("workspace_id", core.workspace.id).eq("user_id", userId).order("statement_date", { ascending: false }).limit(100),
    supabase.from("analyst_channel_checks").select("*").eq("workspace_id", core.workspace.id).eq("user_id", userId).order("interaction_date", { ascending: false }).limit(100),
    supabase.from("analyst_postmortems").select("*").eq("workspace_id", core.workspace.id).eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);
  const failed = [drivers, scenarios, journal, facts, commitments, channelChecks, postmortems].find((result) => result.error);
  if (failed?.error) throw failed.error;
  return {
    company: core.company,
    notebook: core.notebook,
    workspace: core.workspace,
    drivers: drivers.data ?? [],
    scenarios: scenarios.data ?? [],
    journal: journal.data ?? [],
    facts: facts.data ?? [],
    commitments: commitments.data ?? [],
    channelChecks: channelChecks.data ?? [],
    postmortems: postmortems.data ?? [],
  };
}

export async function GET(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const ticker = new URL(request.url).searchParams.get("ticker") ?? "";
    return Response.json(await responsePayload(supabase, profile.user_id, ticker), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as Record<string, unknown>;
    const ticker = cleanText(payload.ticker, 12).toUpperCase();
    const core = await ownedWorkspace(supabase, profile.user_id, ticker);
    const action = String(payload.action ?? "save_workspace");

    if (action === "save_workspace") {
      const update = {
        workflow_status: statuses.has(String(payload.workflowStatus)) ? payload.workflowStatus : core.workspace.workflow_status,
        recommendation: recommendations.has(String(payload.recommendation)) ? payload.recommendation : core.workspace.recommendation,
        time_horizon: horizons.has(String(payload.timeHorizon)) ? payload.timeHorizon : core.workspace.time_horizon,
        conviction: integer(payload.conviction, 1, 5, core.workspace.conviction),
        consensus_view: cleanText(payload.consensusView, 12000),
        variant_view: cleanText(payload.variantView, 12000),
        current_view: cleanText(payload.currentView, 20000),
        next_catalyst: cleanText(payload.nextCatalyst, 500),
        next_catalyst_date: /^\d{4}-\d{2}-\d{2}$/.test(String(payload.nextCatalystDate ?? "")) ? payload.nextCatalystDate : null,
      };
      const { error } = await supabase.from("analyst_workspaces").update(update).eq("id", core.workspace.id).eq("user_id", profile.user_id);
      if (error) throw error;
    } else if (action === "save_facts") {
      const dimension = String(payload.dimension);
      if (!factsDimensions.includes(dimension as typeof factsDimensions[number])) return Response.json({ error: "Choose a valid FACTS dimension." }, { status: 400 });
      const record = {
        workspace_id: core.workspace.id,
        user_id: profile.user_id,
        dimension,
        status: factsStatuses.has(String(payload.status)) ? payload.status : "in_progress",
        score: integer(payload.score, 1, 5, 1),
        summary: cleanText(payload.summary, 12000),
        key_question: cleanText(payload.keyQuestion, 4000),
        evidence_gap: cleanText(payload.evidenceGap, 4000),
      };
      const { error } = await supabase.from("analyst_facts_assessments").upsert(record, { onConflict: "workspace_id,dimension" });
      if (error) throw error;
    } else if (action === "save_action_plan") {
      const update = {
        stock_profile: stockProfiles.has(String(payload.stockProfile)) ? payload.stockProfile : "unclassified",
        target_return_pct: optionalNumber(payload.targetReturnPct),
        target_date: /^\d{4}-\d{2}-\d{2}$/.test(String(payload.targetDate ?? "")) ? payload.targetDate : null,
        entry_rule: cleanText(payload.entryRule, 8000),
        hold_rule: cleanText(payload.holdRule, 8000),
        exit_rule: cleanText(payload.exitRule, 8000),
        max_position_pct: optionalNumber(payload.maxPositionPct),
        liquidity_plan: cleanText(payload.liquidityPlan, 8000),
      };
      if (update.target_return_pct !== null && (update.target_return_pct < -100 || update.target_return_pct > 10000)) return Response.json({ error: "Target return is outside the accepted range." }, { status: 400 });
      if (update.max_position_pct !== null && (update.max_position_pct < 0 || update.max_position_pct > 100)) return Response.json({ error: "Maximum position must be between 0% and 100%." }, { status: 400 });
      const { error } = await supabase.from("analyst_workspaces").update(update).eq("id", core.workspace.id).eq("user_id", profile.user_id);
      if (error) throw error;
    } else if (action === "save_commitment") {
      const commitment = cleanText(payload.commitment, 8000);
      const statementDate = String(payload.statementDate ?? "");
      if (commitment.length < 8 || !/^\d{4}-\d{2}-\d{2}$/.test(statementDate)) return Response.json({ error: "A dated management commitment is required." }, { status: 400 });
      const url = sourceUrl(payload.sourceUrl);
      if (url === null) return Response.json({ error: "Source URL must begin with http:// or https://." }, { status: 400 });
      const { error } = await supabase.from("analyst_management_commitments").insert({
        workspace_id: core.workspace.id, user_id: profile.user_id, statement_date: statementDate,
        commitment, expected_date: /^\d{4}-\d{2}-\d{2}$/.test(String(payload.expectedDate ?? "")) ? payload.expectedDate : null,
        actual_outcome: cleanText(payload.actualOutcome, 8000), status: commitmentStatuses.has(String(payload.status)) ? payload.status : "open", source_url: url,
      });
      if (error) throw error;
    } else if (action === "delete_commitment") {
      const id = Number(payload.id);
      if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Choose a valid commitment." }, { status: 400 });
      const { error } = await supabase.from("analyst_management_commitments").delete().eq("id", id).eq("workspace_id", core.workspace.id).eq("user_id", profile.user_id);
      if (error) throw error;
    } else if (action === "save_channel_check") {
      const finding = cleanText(payload.finding, 12000);
      const interactionDate = String(payload.interactionDate ?? "");
      if (finding.length < 12 || !/^\d{4}-\d{2}-\d{2}$/.test(interactionDate)) return Response.json({ error: "A dated, complete channel-check finding is required." }, { status: 400 });
      const { error } = await supabase.from("analyst_channel_checks").insert({
        workspace_id: core.workspace.id, user_id: profile.user_id,
        counterparty_type: channelTypes.has(String(payload.counterpartyType)) ? payload.counterpartyType : "other",
        organization: cleanText(payload.organization, 500), participant_role: cleanText(payload.participantRole, 500), interaction_date: interactionDate,
        finding, thesis_impact: thesisImpacts.has(String(payload.thesisImpact)) ? payload.thesisImpact : "neutral",
        confidence: integer(payload.confidence, 1, 5, 3), source_note: cleanText(payload.sourceNote, 4000),
      });
      if (error) throw error;
    } else if (action === "delete_channel_check") {
      const id = Number(payload.id);
      if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Choose a valid channel check." }, { status: 400 });
      const { error } = await supabase.from("analyst_channel_checks").delete().eq("id", id).eq("workspace_id", core.workspace.id).eq("user_id", profile.user_id);
      if (error) throw error;
    } else if (action === "add_postmortem") {
      const lesson = cleanText(payload.lesson, 12000);
      if (lesson.length < 12) return Response.json({ error: "Record a complete lesson from the decision." }, { status: 400 });
      const { error } = await supabase.from("analyst_postmortems").insert({
        workspace_id: core.workspace.id, user_id: profile.user_id,
        outcome: postmortemOutcomes.has(String(payload.outcome)) ? payload.outcome : "open",
        process_grade: integer(payload.processGrade, 1, 5, 3), thesis_result: thesisResults.has(String(payload.thesisResult)) ? payload.thesisResult : "mixed",
        what_worked: cleanText(payload.whatWorked, 12000), what_failed: cleanText(payload.whatFailed, 12000), lesson,
      });
      if (error) throw error;
    } else if (action === "save_driver") {
      const title = cleanText(payload.title, 160);
      if (!title) return Response.json({ error: "A driver title is required." }, { status: 400 });
      const url = sourceUrl(payload.sourceUrl);
      if (url === null) return Response.json({ error: "Evidence URL must begin with http:// or https://." }, { status: 400 });
      const record = {
        workspace_id: core.workspace.id, user_id: profile.user_id,
        direction: directions.has(String(payload.direction)) ? payload.direction : "neutral",
        rank: integer(payload.rank, 1, 10, 1), title, hypothesis: cleanText(payload.hypothesis, 12000), metric: cleanText(payload.metric, 500),
        current_reading: cleanText(payload.currentReading, 500), target_reading: cleanText(payload.targetReading, 500),
        epic_effect: Boolean(payload.epicEffect), epic_predictability: Boolean(payload.epicPredictability), epic_independence: Boolean(payload.epicIndependence), epic_consensus_gap: Boolean(payload.epicConsensusGap),
        importance: integer(payload.importance, 1, 5, 3), confidence: integer(payload.confidence, 1, 5, 3),
        falsifier: cleanText(payload.falsifier, 4000), next_catalyst: cleanText(payload.nextCatalyst, 1000), source_url: url,
        evidence_date: /^\d{4}-\d{2}-\d{2}$/.test(String(payload.evidenceDate ?? "")) ? payload.evidenceDate : null,
        status: driverStatuses.has(String(payload.status)) ? payload.status : "active",
      };
      const id = Number(payload.id);
      const query = Number.isInteger(id) && id > 0
        ? supabase.from("analyst_thesis_drivers").update(record).eq("id", id).eq("workspace_id", core.workspace.id).eq("user_id", profile.user_id)
        : supabase.from("analyst_thesis_drivers").insert(record);
      const { error } = await query;
      if (error) throw error;
    } else if (action === "delete_driver") {
      const id = Number(payload.id);
      if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Choose a valid thesis driver." }, { status: 400 });
      const { error } = await supabase.from("analyst_thesis_drivers").delete().eq("id", id).eq("workspace_id", core.workspace.id).eq("user_id", profile.user_id);
      if (error) throw error;
    } else if (action === "save_scenarios") {
      const items = Array.isArray(payload.scenarios) ? payload.scenarios as Array<Record<string, unknown>> : [];
      const cases = ["bull","base","bear"];
      if (items.length !== 3 || !cases.every((name) => items.some((item) => item.scenario === name))) return Response.json({ error: "Bull, base, and bear scenarios are required." }, { status: 400 });
      const total = items.reduce((sum, item) => sum + (optionalNumber(item.probabilityPct) ?? 0), 0);
      if (Math.abs(total - 100) > 0.01) return Response.json({ error: "Scenario probabilities must total 100%." }, { status: 400 });
      const records = items.map((item) => ({
        workspace_id: core.workspace.id, user_id: profile.user_id, scenario: item.scenario,
        probability_pct: optionalNumber(item.probabilityPct) ?? 0, price_target: optionalNumber(item.priceTarget),
        revenue_growth_pct: optionalNumber(item.revenueGrowthPct), margin_pct: optionalNumber(item.marginPct), exit_multiple: optionalNumber(item.exitMultiple),
        notes: cleanText(item.notes, 12000),
      }));
      const { error } = await supabase.from("analyst_valuation_scenarios").upsert(records, { onConflict: "workspace_id,scenario" });
      if (error) throw error;
    } else if (action === "add_decision") {
      if (!decisions.has(String(payload.decision))) return Response.json({ error: "Choose a valid decision." }, { status: 400 });
      const rationale = cleanText(payload.rationale, 20000);
      if (rationale.length < 12) return Response.json({ error: "Record at least one complete sentence explaining the decision." }, { status: 400 });
      const { error } = await supabase.from("analyst_decision_journal").insert({
        workspace_id: core.workspace.id, user_id: profile.user_id, decision: payload.decision,
        observed_price: optionalNumber(payload.observedPrice), conviction: integer(payload.conviction, 1, 5, 1), rationale,
        key_risk: cleanText(payload.keyRisk, 4000), next_catalyst: cleanText(payload.nextCatalyst, 4000),
      });
      if (error) throw error;
    } else return Response.json({ error: "Unknown analyst-workspace action." }, { status: 400 });

    return Response.json(await responsePayload(supabase, profile.user_id, ticker), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
