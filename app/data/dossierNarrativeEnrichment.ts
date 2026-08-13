import { env } from "cloudflare:workers";
import { ensureDossierNarrativeEnrichmentSchema } from "../../db/runtimeSchema";
import type { CompletionClaim } from "./dossierCompletionClaims";
import { citationExcerptResolves, filingEvidenceCatalog, filingHtmlToText, parseNarrativeModelResponse, resolveNarrativeEvidenceIds, strategicFilingExcerpt, withDeadline } from "./dossierNarrativeText";

const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const PIPELINE_MODEL = `${MODEL}#evidence-ids-v7`;
const SEC_USER_AGENT = "LearnWhatYouOwn research automation kai@parkonecapital.com";

type AiBinding = { run(model: string, input: Record<string, unknown>): Promise<unknown> };
type SourceRow = { title: string; url: string; evidence_date: string | null; source_type: string };
type TargetRow = { ticker: string; name: string; market_cap: number | null };
type CitedText = { text: string; sourceUrl: string; sourceExcerpt: string };
type CitedDriver = { label: string; value: string; detail: string; sourceUrl: string; sourceExcerpt: string };
type CitedRisk = { title: string; text: string; signal: string; sourceUrl: string; sourceExcerpt: string };
type CitedMonitor = { title: string; text: string; impact: string; sourceUrl: string; sourceExcerpt: string };

export type EnrichedNarrative = {
  description: CitedText; lede: CitedText; sells: CitedText; revenueModel: CitedText;
  opportunity: CitedText; mustGoRight: CitedText; thesisBreaker: CitedText; editorNote: CitedText;
  bullTitle: string; bull: CitedText[]; bearTitle: string; bear: CitedText[];
  financialDrivers: CitedDriver[]; risks: CitedRisk[]; monitor: CitedMonitor[];
  questions: string[]; competitors: CitedText;
};

export async function reconcileStaleNarrativeJobs() {
  await ensureDossierNarrativeEnrichmentSchema();
  const result = await env.DB.prepare(`UPDATE dossier_narrative_enrichment_jobs
    SET status='timed_out',error_message=CASE WHEN error_message=''
      THEN 'The Worker invocation ended before a validated result was recorded.' ELSE error_message END,
      completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP
    WHERE status='running' AND started_at<=datetime('now','-20 minutes')`).run();
  return Number(result.meta.changes ?? 0);
}

function exactText(value: unknown, field: string): CitedText {
  if (!value || typeof value !== "object") throw new Error(`${field} must be a cited object.`);
  const record = value as Record<string, unknown>;
  if (typeof record.text !== "string" || record.text.trim().length < 20) throw new Error(`${field} is incomplete.`);
  if (typeof record.sourceUrl !== "string") throw new Error(`${field} has no source URL.`);
  if (typeof record.sourceExcerpt !== "string" || record.sourceExcerpt.trim().length < 20) throw new Error(`${field} has no filing excerpt.`);
  return { text: record.text.trim(), sourceUrl: record.sourceUrl, sourceExcerpt: record.sourceExcerpt.trim() };
}

function validateNarrative(value: Record<string, unknown>, sourceText: Map<string, string>): EnrichedNarrative {
  const cited = (field: string) => exactText(value[field], field);
  const list = (field: string, minimum: number) => {
    if (!Array.isArray(value[field]) || value[field].length < minimum) throw new Error(`${field} requires at least ${minimum} items.`);
    return value[field] as unknown[];
  };
  const result: EnrichedNarrative = {
    description: cited("description"), lede: cited("lede"), sells: cited("sells"), revenueModel: cited("revenueModel"),
    opportunity: cited("opportunity"), mustGoRight: cited("mustGoRight"), thesisBreaker: cited("thesisBreaker"), editorNote: cited("editorNote"),
    bullTitle: typeof value.bullTitle === "string" ? value.bullTitle.trim() : "Evidence supporting the bull case",
    bull: list("bull", 2).map((item, index) => exactText(item, `bull[${index}]`)),
    bearTitle: typeof value.bearTitle === "string" ? value.bearTitle.trim() : "Evidence supporting the bear case",
    bear: list("bear", 2).map((item, index) => exactText(item, `bear[${index}]`)),
    financialDrivers: list("financialDrivers", 2).map((item, index) => {
      const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
      if (![row.label, row.value, row.detail, row.sourceUrl, row.sourceExcerpt].every((entry) => typeof entry === "string" && entry.trim())) throw new Error(`financialDrivers[${index}] is incomplete.`);
      return { label: String(row.label).trim(), value: String(row.value).trim(), detail: String(row.detail).trim(), sourceUrl: String(row.sourceUrl), sourceExcerpt: String(row.sourceExcerpt).trim() };
    }),
    risks: list("risks", 2).map((item, index) => {
      const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
      if (![row.title, row.text, row.signal, row.sourceUrl, row.sourceExcerpt].every((entry) => typeof entry === "string" && entry.trim())) throw new Error(`risks[${index}] is incomplete.`);
      return { title: String(row.title).trim(), text: String(row.text).trim(), signal: String(row.signal).trim(), sourceUrl: String(row.sourceUrl), sourceExcerpt: String(row.sourceExcerpt).trim() };
    }),
    monitor: list("monitor", 2).map((item, index) => {
      const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
      if (![row.title, row.text, row.impact, row.sourceUrl, row.sourceExcerpt].every((entry) => typeof entry === "string" && entry.trim())) throw new Error(`monitor[${index}] is incomplete.`);
      return { title: String(row.title).trim(), text: String(row.text).trim(), impact: String(row.impact).trim(), sourceUrl: String(row.sourceUrl), sourceExcerpt: String(row.sourceExcerpt).trim() };
    }),
    questions: list("questions", 3).map((item) => String(item).trim()).filter(Boolean),
    competitors: value.competitors ? cited("competitors") : {
      text: "The approved filing pack does not establish a complete named competitor set; peer selection requires separate verified market evidence.",
      sourceUrl: cited("description").sourceUrl,
      sourceExcerpt: cited("description").sourceExcerpt,
    },
  };
  const urls = [result.description, result.lede, result.sells, result.revenueModel, result.opportunity, result.mustGoRight,
    result.thesisBreaker, result.editorNote, ...result.bull, ...result.bear, result.competitors,
    ...result.financialDrivers, ...result.risks, ...result.monitor].map((item) => item.sourceUrl);
  const unknown = urls.filter((url) => !sourceText.has(url));
  if (unknown.length) throw new Error(`Narrative cited ${new Set(unknown).size} source URL(s) outside the approved filing pack.`);
  for (const item of [result.description, result.lede, result.sells, result.revenueModel, result.opportunity, result.mustGoRight,
    result.thesisBreaker, result.editorNote, ...result.bull, ...result.bear, result.competitors,
    ...result.financialDrivers, ...result.risks, ...result.monitor]) {
    const document = sourceText.get(item.sourceUrl) ?? "";
    if (!citationExcerptResolves(document, item.sourceExcerpt)) {
      throw new Error("A cited filing excerpt could not be resolved to eight consecutive words in the approved source document.");
    }
  }
  return result;
}

function completionClaims(narrative: EnrichedNarrative, sources: SourceRow[]): CompletionClaim[] {
  const source = (url: string) => sources.find((item) => item.url === url) ?? sources[0];
  const claim = (section: string, claimType: CompletionClaim["claimType"], item: CitedText, whyItMatters: string): CompletionClaim => {
    const citedSource = source(item.sourceUrl);
    return { section, claimType, claim: item.text, whyItMatters, sourceTitle: citedSource.title, sourceUrl: citedSource.url,
      sourceExcerpt: item.sourceExcerpt,
      evidenceDate: citedSource.evidence_date || new Date().toISOString().slice(0, 10) };
  };
  const driver = narrative.financialDrivers[0]; const risk = narrative.risks[0];
  return [
    claim("owner_summary", "editorial_analysis", narrative.lede, "Defines the central owner lens and the variables that determine long-term value."),
    claim("business_model", "verified_fact", narrative.sells, "Identifies the products, services, and customers that produce revenue."),
    claim("revenue_model", "editorial_analysis", narrative.revenueModel, "Explains how operating activity converts into reported revenue and owner economics."),
    claim("opportunity", "editorial_analysis", narrative.opportunity, "States the evidence-grounded route by which the business could expand value."),
    claim("owner_requirements", "editorial_analysis", narrative.mustGoRight, "Makes the operating and capital-allocation requirements of the thesis falsifiable."),
    claim("thesis_breaker", "editorial_analysis", narrative.thesisBreaker, "Defines the evidence that would invalidate the ownership case."),
    claim("bull_case", "editorial_analysis", narrative.bull[0], "Supports the constructive side of the balanced investment debate."),
    claim("bear_case", "editorial_analysis", narrative.bear[0], "Supports the skeptical side of the balanced investment debate."),
    claim("financial_drivers", "editorial_analysis", { text: `${driver.label}: ${driver.value} — ${driver.detail}`, sourceUrl: driver.sourceUrl, sourceExcerpt: driver.sourceExcerpt }, "Identifies a measurable driver owners should update from each filing."),
    claim("risks", "editorial_analysis", { text: `${risk.title}: ${risk.text}`, sourceUrl: risk.sourceUrl, sourceExcerpt: risk.sourceExcerpt }, `Leading indicator: ${risk.signal}`),
  ];
}

async function selectTarget() {
  return env.DB.prepare(`SELECT d.ticker,c.name,c.market_cap FROM company_dossiers d JOIN companies c ON c.ticker=d.ticker
    WHERE d.quality_tier='machine_enriched' AND (d.validated_at IS NULL OR NULLIF(TRIM(d.lede),'') IS NULL)
      AND NOT EXISTS (SELECT 1 FROM dossier_narrative_enrichment_jobs job WHERE job.ticker=d.ticker
        AND (job.status='completed' OR (job.status='running' AND job.started_at>datetime('now','-30 minutes'))))
      AND (SELECT COUNT(*) FROM dossier_narrative_enrichment_jobs failed
        WHERE failed.ticker=d.ticker AND failed.status IN ('error','timed_out') AND failed.model=?)<3
    ORDER BY c.market_cap IS NULL,c.market_cap DESC,c.ticker LIMIT 1`).bind(PIPELINE_MODEL).first<TargetRow>();
}

async function sourcePack(ticker: string) {
  const rows = await env.DB.prepare(`SELECT title,url,evidence_date,source_type FROM dossier_sources
    WHERE ticker=? AND url LIKE 'https://www.sec.gov/Archives/%'
    ORDER BY CASE WHEN title LIKE '10-K %' OR title LIKE '10-K/A %' OR title LIKE '20-F %' THEN 0
      WHEN title LIKE '10-Q %' THEN 1 WHEN title LIKE '6-K %' THEN 2 WHEN title LIKE 'DEF 14A %' THEN 3 ELSE 4 END,
      evidence_date DESC LIMIT 2`).bind(ticker).all<SourceRow>();
  if (rows.results.length < 2) throw new Error("At least two exact SEC filings are required for narrative enrichment.");
  return rows.results;
}

async function fetchSource(source: SourceRow) {
  const response = await fetch(source.url, { headers: { accept: "text/html", "user-agent": SEC_USER_AGENT }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${source.title} returned HTTP ${response.status}.`);
  return strategicFilingExcerpt(filingHtmlToText(await response.text()));
}

function prompt(target: TargetRow, sources: Array<SourceRow & { text: string }>) {
  const allowed = sources.map((source) => source.url);
  const catalog = filingEvidenceCatalog(sources);
  return `Create a balanced, source-grounded owner dossier for ${target.name} (${target.ticker}).\n\nRules:\n- Use only the evidence snippets below.\n- Every cited sourceUrl must exactly match one of: ${JSON.stringify(allowed)}.\n- Every sourceExcerpt must contain only the matching EVIDENCE ID, such as S1-3. The server will resolve it to exact filing text.\n- The EVIDENCE ID must belong to the same sourceUrl.\n- If the snippets do not name competitors, use an explicit insufficient-evidence statement instead of inventing a peer.\n- Separate filed facts from analysis. Never invent a number, customer, supplier, quote, competitor, or forecast.\n- Keep every text, detail, and signal under 35 words and every title under 10 words.\n- Bull and bear points must be falsifiable and balanced.\n- Return JSON only, with no markdown.\n\nRequired shape:\n{"description":{"text":"...","sourceUrl":"...","sourceExcerpt":"S1-1"},"lede":{"text":"...","sourceUrl":"...","sourceExcerpt":"S1-2"},"sells":{"text":"...","sourceUrl":"...","sourceExcerpt":"S1-3"},"revenueModel":{"text":"...","sourceUrl":"...","sourceExcerpt":"S1-4"},"opportunity":{"text":"...","sourceUrl":"...","sourceExcerpt":"S1-5"},"mustGoRight":{"text":"...","sourceUrl":"...","sourceExcerpt":"S1-6"},"thesisBreaker":{"text":"...","sourceUrl":"...","sourceExcerpt":"S1-7"},"editorNote":{"text":"...","sourceUrl":"...","sourceExcerpt":"S1-8"},"bullTitle":"...","bull":[{"text":"...","sourceUrl":"...","sourceExcerpt":"S1-9"}],"bearTitle":"...","bear":[{"text":"...","sourceUrl":"...","sourceExcerpt":"S1-10"}],"financialDrivers":[{"label":"...","value":"...","detail":"...","sourceUrl":"...","sourceExcerpt":"S1-11"}],"risks":[{"title":"...","text":"...","signal":"...","sourceUrl":"...","sourceExcerpt":"S1-12"}],"monitor":[{"title":"...","text":"...","impact":"BULL CASE|NEUTRAL|BEAR CASE","sourceUrl":"...","sourceExcerpt":"S1-13"}],"questions":["..."],"competitors":{"text":"...","sourceUrl":"...","sourceExcerpt":"S1-14"}}\n\nProvide at least 2 bull points, 2 bear points, 2 financial drivers, 2 risks, 2 monitor items, and 3 questions.\n\n${sources.map((source) => `SOURCE: ${source.title}\nURL: ${source.url}\nEVIDENCE SNIPPETS:\n${catalog.filter((entry) => entry.url === source.url).map((entry) => `${entry.id}: ${entry.excerpt}`).join("\n")}`).join("\n\n---\n\n")}`;
}

async function saveNarrative(target: TargetRow, narrative: EnrichedNarrative, sources: SourceRow[], jobId: string) {
  const claims = completionClaims(narrative, sources);
  await env.DB.prepare(`UPDATE company_dossiers SET description=?,lede=?,sells=?,revenue_model=?,opportunity=?,must_go_right=?,
    editor_note=?,bull_title=?,bull_json=?,bear_title=?,bear_json=?,thesis_breaker=?,financial_drivers_json=?,risks_json=?,
    monitor_json=?,questions_json=?,competitors=?,evidence_date=?,validated_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    WHERE ticker=? AND quality_tier='machine_enriched'`).bind(
      narrative.description.text, narrative.lede.text, narrative.sells.text, narrative.revenueModel.text, narrative.opportunity.text,
      narrative.mustGoRight.text, `AI-assisted source-grounded draft · ${narrative.editorNote.text}`,
      narrative.bullTitle, JSON.stringify(narrative.bull.map((item) => item.text)), narrative.bearTitle,
      JSON.stringify(narrative.bear.map((item) => item.text)), narrative.thesisBreaker.text,
      JSON.stringify(narrative.financialDrivers.map((item) => ({ label: item.label, value: item.value, detail: item.detail }))),
      JSON.stringify(narrative.risks.map((item) => ({ title: item.title, text: item.text, signal: item.signal, level: "Monitor" }))),
      JSON.stringify(narrative.monitor.map((item) => ({ title: item.title, text: item.text, impact: item.impact }))), JSON.stringify(narrative.questions),
      narrative.competitors.text, sources[0].evidence_date || new Date().toISOString().slice(0, 10), target.ticker).run();
  await env.DB.prepare(`UPDATE dossier_narrative_enrichment_jobs SET status='completed',output_json=?,validation_json=?,
    completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(
      JSON.stringify({ narrative, claims }), JSON.stringify({ exactSourceResolution: true, sourceCount: sources.length, claimCount: claims.length, mode: "ai_assisted_source_grounded" }), jobId).run();
  return claims;
}

export async function enrichNextDossierNarrative() {
  await ensureDossierNarrativeEnrichmentSchema();
  await reconcileStaleNarrativeJobs();
  const bindings = env as unknown as { AI?: AiBinding };
  if (!bindings.AI) return { enriched: false as const, reason: "workers_ai_binding_unavailable" };
  const target = await selectTarget();
  if (!target) return { enriched: false as const, reason: "no_machine_enriched_dossier_pending_narrative" };
  const sources = await sourcePack(target.ticker);
  const jobId = `narrative-${target.ticker.toLowerCase()}-${crypto.randomUUID()}`;
  await env.DB.prepare(`INSERT INTO dossier_narrative_enrichment_jobs
    (id,ticker,priority_market_cap,status,model,source_urls_json,attempt_count)
    VALUES (?,?,?,'running',?,?,(SELECT 1+COUNT(*) FROM dossier_narrative_enrichment_jobs WHERE ticker=?))`).bind(
      jobId, target.ticker, target.market_cap, PIPELINE_MODEL, JSON.stringify(sources.map((source) => source.url)), target.ticker).run();
  try {
    const documents: Array<SourceRow & { text: string }> = [];
    for (const source of sources) documents.push({ ...source, text: await fetchSource(source) });
    const response = await withDeadline(bindings.AI.run(MODEL, { messages: [
      { role: "system", content: "You are an evidence-disciplined public-equity research analyst. Return valid JSON only." },
      { role: "user", content: prompt(target, documents) },
    ], response_format: { type: "json_object" }, max_tokens: 2_200, temperature: 0.1 }), 45_000, "Dossier narrative generation");
    const catalog = filingEvidenceCatalog(documents);
    const narrative = validateNarrative(resolveNarrativeEvidenceIds(parseNarrativeModelResponse(response), catalog), new Map(documents.map((source) => [source.url, source.text])));
    const claims = await saveNarrative(target, narrative, sources, jobId);
    return { enriched: true as const, ticker: target.ticker, marketCap: target.market_cap, jobId, claims };
  } catch (error) {
    await env.DB.prepare(`UPDATE dossier_narrative_enrichment_jobs SET status='error',error_message=?,completed_at=CURRENT_TIMESTAMP,
      updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(error instanceof Error ? error.message.slice(0, 1_000) : "Unknown enrichment error", jobId).run();
    return { enriched: false as const, ticker: target.ticker, jobId, reason: "narrative_enrichment_failed", error: error instanceof Error ? error.message : "Unknown enrichment error" };
  }
}

export async function latestEnrichmentClaims(ticker: string) {
  await ensureDossierNarrativeEnrichmentSchema();
  const row = await env.DB.prepare(`SELECT output_json FROM dossier_narrative_enrichment_jobs
    WHERE ticker=? AND status='completed' ORDER BY completed_at DESC LIMIT 1`).bind(ticker).first<{ output_json: string }>();
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.output_json) as { claims?: CompletionClaim[] };
    return Array.isArray(parsed.claims) ? parsed.claims : null;
  } catch { return null; }
}
