import { env } from "cloudflare:workers";
import { ensureCompanyProfileSchema } from "../../db/runtimeSchema";
import { fetchSecJson } from "./secRequest";
import { filingHtmlToText, citationExcerptResolves } from "./dossierNarrativeText";
import { relevantSecFilings, type SecSubmissionFeed } from "./dossierFreshnessClassification";

const SEC_AGENT = "LearnWhatYouOwn/1.0 research@learnwhatyouown.com";
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

type AiBinding = { run(model: string, input: Record<string, unknown>): Promise<unknown> };
type Target = { ticker: string; cik: string; name: string; market_cap: number | null };
type SecAddress = { street1?: string; street2?: string; city?: string; stateOrCountry?: string; stateOrCountryDescription?: string; zipCode?: string };
type SubmissionProfile = SecSubmissionFeed & {
  name?: string; phone?: string; website?: string; investorWebsite?: string;
  addresses?: { business?: SecAddress; mailing?: SecAddress };
};
type ManagementPerson = { name: string; title: string; biography: string; sourceExcerpt: string };

function validWebUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  try { const url = new URL(value.trim()); return url.protocol === "https:" ? url.toString() : ""; } catch { return ""; }
}

function decodeAttribute(value: string) {
  return value.replace(/&amp;/gi, "&").replace(/&#64;|&#x40;/gi, "@").replace(/&quot;/gi, '"');
}

function irEmailFromHtml(html: string) {
  const matches = [...html.matchAll(/href=["']mailto:([^"'?\s>]+)(?:\?[^"']*)?["']/gi)]
    .map((match) => decodeAttribute(match[1]).trim().toLowerCase())
    .filter((email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && !/no-?reply|privacy|abuse/.test(email));
  return matches.find((email) => /invest|ir@|shareholder/.test(email)) ?? matches[0] ?? "";
}

function managementText(text: string) {
  const normalized = text.toLowerCase();
  const slices: string[] = [];
  for (const heading of ["executive officers", "information about our executive officers", "directors and executive officers", "management team"]) {
    let start = normalized.indexOf(heading);
    while (start >= 0 && slices.length < 5) {
      slices.push(text.slice(Math.max(0, start - 500), start + 6_500));
      start = normalized.indexOf(heading, start + heading.length);
    }
  }
  return (slices.length ? slices.join("\n\n---\n\n") : text.slice(0, 28_000)).slice(0, 30_000);
}

function parseAiResponse(response: unknown): Record<string, unknown> {
  if (typeof response === "string") return JSON.parse(response.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) as Record<string, unknown>;
  if (!response || typeof response !== "object") throw new Error("Workers AI returned no management profile.");
  const record = response as Record<string, unknown>;
  if (Array.isArray(record.people)) return record;
  if (typeof record.response === "string") return parseAiResponse(record.response);
  if (record.response && typeof record.response === "object") return record.response as Record<string, unknown>;
  if (typeof record.result === "string") return parseAiResponse(record.result);
  throw new Error("Workers AI returned an unsupported management response.");
}

function filedExcerptForName(sourceText: string, name: string) {
  const lowerText = sourceText.toLowerCase();
  const lowerName = name.toLowerCase();
  const candidates: Array<{ score: number; excerpt: string }> = [];
  let index = lowerText.indexOf(lowerName);
  while (index >= 0 && candidates.length < 30) {
    const start = Math.max(0,index - 160);
    const excerpt = sourceText.slice(start,Math.min(sourceText.length,index + 1_200)).replace(/\s+/g," ").trim().slice(0,1_000);
    const context = excerpt.toLowerCase();
    const score = ["joined", "served", "experience", "previously", "since", "executive officer", "senior vice president"]
      .reduce((total,term) => total + (context.includes(term) ? 2 : 0),0) + Math.min(5,Math.floor(excerpt.split(/\s+/).length / 40));
    candidates.push({ score,excerpt });
    index = lowerText.indexOf(lowerName,index + lowerName.length);
  }
  return candidates.sort((left,right) => right.score - left.score)[0]?.excerpt ?? "";
}

function validatePeople(response: unknown, sourceText: string) {
  const people = parseAiResponse(response).people;
  if (!Array.isArray(people)) throw new Error("Management response has no people array.");
  const valid: ManagementPerson[] = [];
  for (const item of people.slice(0, 10)) {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const title = typeof row.title === "string" ? row.title.trim() : "";
    const biography = typeof row.biography === "string" ? row.biography.trim() : "";
    const proposedExcerpt = typeof row.sourceExcerpt === "string" ? row.sourceExcerpt.trim() : "";
    const sourceExcerpt = citationExcerptResolves(sourceText,proposedExcerpt) ? proposedExcerpt : filedExcerptForName(sourceText,name);
    if (name.length < 3 || title.length < 2 || biography.length < 30 || !citationExcerptResolves(sourceText, sourceExcerpt)) continue;
    valid.push({ name, title, biography, sourceExcerpt });
  }
  if (!valid.length) throw new Error("No management biography passed exact filing-excerpt validation.");
  return valid;
}

async function selectTarget() {
  return env.DB.prepare(`SELECT d.ticker,c.cik,c.name,c.market_cap
    FROM company_dossiers d JOIN companies c ON c.ticker=d.ticker
    LEFT JOIN company_contact_profiles p ON p.ticker=d.ticker
    WHERE d.status='published' AND c.cik IS NOT NULL AND c.cik<>''
      AND (p.ticker IS NULL OR p.verified_at<datetime('now','-90 days')
        OR NOT EXISTS (SELECT 1 FROM company_management_people m WHERE m.ticker=d.ticker AND m.is_current=1))
      AND (SELECT COUNT(*) FROM company_profile_refresh_jobs j WHERE j.ticker=d.ticker
        AND j.status IN ('error','contact_only') AND j.started_at>=datetime('now','-30 days'))<3
      AND NOT EXISTS (SELECT 1 FROM company_profile_refresh_jobs j WHERE j.ticker=d.ticker
        AND j.status='running' AND j.started_at>=datetime('now','-20 minutes'))
    ORDER BY c.market_cap IS NULL,c.market_cap DESC,c.ticker LIMIT 1`).first<Target>();
}

async function officialIrUrl(ticker: string, submissions: SubmissionProfile) {
  const disclosed = validWebUrl(submissions.investorWebsite);
  if (disclosed) return disclosed;
  const source = await env.DB.prepare(`SELECT url FROM dossier_sources WHERE ticker=?
    AND (source_type LIKE '%investor%' OR lower(title) LIKE '%investor relation%')
    AND url LIKE 'https://%' ORDER BY evidence_date DESC,url LIMIT 1`).bind(ticker).first<{ url: string }>();
  return validWebUrl(source?.url);
}

async function saveContact(target: Target, submissions: SubmissionProfile, submissionsUrl: string, irUrl: string, irEmail: string) {
  const address = submissions.addresses?.business ?? submissions.addresses?.mailing ?? {};
  await env.DB.prepare(`INSERT INTO company_contact_profiles
    (ticker,legal_name,street_1,street_2,city,state_or_country,postal_code,telephone,company_website_url,
      investor_relations_url,investor_relations_email,sec_source_url,ir_source_url,verified_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(ticker) DO UPDATE SET legal_name=excluded.legal_name,street_1=excluded.street_1,street_2=excluded.street_2,
      city=excluded.city,state_or_country=excluded.state_or_country,postal_code=excluded.postal_code,telephone=excluded.telephone,
      company_website_url=excluded.company_website_url,investor_relations_url=excluded.investor_relations_url,
      investor_relations_email=excluded.investor_relations_email,sec_source_url=excluded.sec_source_url,
      ir_source_url=excluded.ir_source_url,verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).bind(
      target.ticker, submissions.name?.trim() || target.name, address.street1?.trim() || "", address.street2?.trim() || "",
      address.city?.trim() || "", address.stateOrCountryDescription?.trim() || address.stateOrCountry?.trim() || "",
      address.zipCode?.trim() || "", submissions.phone?.trim() || "", validWebUrl(submissions.website), irUrl, irEmail,
      submissionsUrl, irUrl,
    ).run();
}

async function extractManagement(target: Target, submissions: SubmissionProfile) {
  const filing = relevantSecFilings(target.cik, submissions).find((item) => item.eventType === "proxy_statement")
    ?? relevantSecFilings(target.cik, submissions).find((item) => item.eventType === "annual_report");
  if (!filing) return { sourceUrl: "", people: [] as ManagementPerson[] };
  const response = await fetch(filing.sourceUrl, { headers: { accept: "text/html", "user-agent": SEC_AGENT }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Management filing returned HTTP ${response.status}.`);
  const text = managementText(filingHtmlToText(await response.text()));
  const ai = (env as unknown as { AI?: AiBinding }).AI;
  if (!ai) throw new Error("Workers AI binding is unavailable for management biography extraction.");
  const output = await ai.run(MODEL, { messages: [
    { role: "system", content: "Extract current executive-management facts from SEC filing text. Return valid JSON only." },
    { role: "user", content: `Identify up to eight current executive officers of ${target.name} (${target.ticker}). Use only the filing text. Do not include a director unless the person is also an executive officer. Biography must be a concise factual summary of role, tenure, and prior experience that appears in the filing. Every sourceExcerpt must copy at least eight consecutive words exactly. Return {"people":[{"name":"...","title":"...","biography":"...","sourceExcerpt":"..."}]}.\n\nFILING TEXT:\n${text}` },
  ], response_format: { type: "json_object" }, max_tokens: 2_000, temperature: 0 });
  return { sourceUrl: filing.sourceUrl, filingDate: filing.filingDate, people: validatePeople(output, text) };
}

export async function refreshNextCompanyProfile() {
  await ensureCompanyProfileSchema();
  await env.DB.prepare(`UPDATE company_profile_refresh_jobs SET status='error',error_message='Worker invocation timed out.',
    completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE status='running' AND started_at<datetime('now','-20 minutes')`).run();
  const target = await selectTarget();
  if (!target) return { refreshed: false as const, reason: "no_company_profile_due" };
  const jobId = `profile-${target.ticker.toLowerCase()}-${crypto.randomUUID()}`;
  await env.DB.prepare("INSERT INTO company_profile_refresh_jobs(id,ticker,status) VALUES (?,?,'running')").bind(jobId,target.ticker).run();
  const submissionsUrl = `https://data.sec.gov/submissions/CIK${target.cik.padStart(10,"0")}.json`;
  try {
    const submissions = await fetchSecJson<SubmissionProfile>(submissionsUrl, SEC_AGENT);
    const irUrl = await officialIrUrl(target.ticker, submissions);
    let irEmail = "";
    if (irUrl) {
      try {
        const irResponse = await fetch(irUrl, { headers: { accept: "text/html", "user-agent": SEC_AGENT }, redirect: "follow", signal: AbortSignal.timeout(10_000) });
        if (irResponse.ok) irEmail = irEmailFromHtml(await irResponse.text());
      } catch { /* The SEC contact remains publishable when an IR site blocks automation. */ }
    }
    await saveContact(target, submissions, submissionsUrl, irUrl, irEmail);
    let management: Awaited<ReturnType<typeof extractManagement>> = { sourceUrl: "", people: [] };
    let managementError = "";
    try { management = await extractManagement(target, submissions); } catch (error) { managementError = error instanceof Error ? error.message : "Management extraction failed."; }
    if (management.people.length) {
      await env.DB.prepare("UPDATE company_management_people SET is_current=0,updated_at=CURRENT_TIMESTAMP WHERE ticker=?").bind(target.ticker).run();
      for (const person of management.people) await env.DB.prepare(`INSERT INTO company_management_people
        (ticker,name,title,biography,source_url,source_excerpt,source_filing_date,is_current,verified_at)
        VALUES (?,?,?,?,?,?,?,1,CURRENT_TIMESTAMP)
        ON CONFLICT(ticker,name,title) DO UPDATE SET biography=excluded.biography,source_url=excluded.source_url,
          source_excerpt=excluded.source_excerpt,source_filing_date=excluded.source_filing_date,is_current=1,
          verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).bind(
            target.ticker,person.name,person.title,person.biography,management.sourceUrl,person.sourceExcerpt,management.filingDate ?? null,
          ).run();
    }
    const status = management.people.length ? "completed" : "contact_only";
    await env.DB.prepare(`UPDATE company_profile_refresh_jobs SET status=?,contact_source_url=?,management_source_url=?,
      management_count=?,error_message=?,completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(
        status,submissionsUrl,management.sourceUrl,management.people.length,managementError.slice(0,500),jobId,
      ).run();
    return { refreshed: true as const, ticker: target.ticker, status, managementCount: management.people.length, irEmailFound: Boolean(irEmail) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Company profile refresh failed.";
    await env.DB.prepare("UPDATE company_profile_refresh_jobs SET status='error',error_message=?,completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(message.slice(0,500),jobId).run();
    return { refreshed: false as const, ticker: target.ticker, reason: "profile_refresh_failed", error: message };
  }
}
