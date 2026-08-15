import { env } from "cloudflare:workers";
import { ensureCompanyProfileSchema } from "../../db/runtimeSchema";
import { fetchSecJson } from "./secRequest";
import { filingHtmlToText, citationExcerptResolves, withDeadline } from "./dossierNarrativeText";
import { relevantSecFilings, type SecSubmissionFeed } from "./dossierFreshnessClassification";

const SEC_AGENT = "LearnWhatYouOwn/1.0 research@learnwhatyouown.com";
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

type AiBinding = { run(model: string, input: Record<string, unknown>): Promise<unknown> };
type Target = { ticker: string; cik: string; name: string; market_cap: number | null; needs_contact: number; needs_management: number };
type SecAddress = { street1?: string; street2?: string; city?: string; stateOrCountry?: string; stateOrCountryDescription?: string; zipCode?: string };
type SubmissionProfile = SecSubmissionFeed & {
  name?: string; phone?: string; website?: string; investorWebsite?: string;
  addresses?: { business?: SecAddress; mailing?: SecAddress };
};
type ManagementPerson = { name: string; title: string; biography: string; sourceExcerpt: string };
type ManagementFiling = { sourceUrl: string; filingDate: string };

function validWebUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  try { const url = new URL(value.trim()); return url.protocol === "https:" ? url.toString() : ""; } catch { return ""; }
}

function normalizedIrHome(value: unknown) {
  const valid = validWebUrl(value);
  if (!valid) return "";
  const url = new URL(valid);
  return /^(?:ir|investor|investors)\./i.test(url.hostname) ? `${url.origin}/` : url.toString();
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

function irContactLinks(html: string, baseUrl: string) {
  const base = new URL(baseUrl);
  const links = [...html.matchAll(/href=["']([^"'#]+)["']/gi)].flatMap((match) => {
    try {
      const url = new URL(decodeAttribute(match[1]),base);
      return url.protocol === "https:" && url.hostname === base.hostname && /(?:contact|investor-contacts)/i.test(url.pathname)
        ? [url.toString()]
        : [];
    } catch { return []; }
  });
  return [...new Set(links)].slice(0,3);
}

function managementText(text: string) {
  const normalized = text.toLowerCase();
  const candidates: Array<{ score: number; slice: string }> = [];
  for (const heading of ["executive officers", "information about our executive officers", "directors and executive officers", "management team"]) {
    let start = normalized.indexOf(heading);
    let occurrences = 0;
    while (start >= 0 && occurrences < 80) {
      const slice = text.slice(Math.max(0,start - 500),start + 6_500);
      const context = slice.toLowerCase();
      const score = ["named executive officers", "chief executive officer", "chief financial officer", "chief operating officer",
        "senior vice president", "general counsel", "joined the executive team", "current executive"]
        .reduce((total,term) => total + (context.includes(term) ? 3 : 0),0)
        - (/table of contents/.test(context.slice(0,800)) ? 5 : 0);
      candidates.push({ score,slice });
      occurrences += 1;
      start = normalized.indexOf(heading, start + heading.length);
    }
  }
  const slices = candidates.sort((left,right) => right.score - left.score).slice(0,5).map((candidate) => candidate.slice);
  return (slices.length ? slices.join("\n\n---\n\n") : text.slice(0,8_000)).slice(0,9_000);
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
    const proposedBiography = typeof row.biography === "string" ? row.biography.trim() : "";
    const proposedExcerpt = typeof row.sourceExcerpt === "string" ? row.sourceExcerpt.trim() : "";
    const lastName = name.replace(/\b(jr\.?|sr\.?|ii|iii|iv)\b/gi, "").trim().split(/\s+/).at(-1) ?? "";
    const sourceExcerpt = citationExcerptResolves(sourceText,proposedExcerpt)
      ? proposedExcerpt
      : filedExcerptForName(sourceText,name) || (lastName.length >= 4 ? filedExcerptForName(sourceText,lastName) : "");
    const normalizedTitle = title.toLowerCase();
    const formerOfficer = /\bformer\b/.test(normalizedTitle);
    const directorOnly = /\b(director|board chair|co-?founder)\b/.test(normalizedTitle)
      && !/\b(current|chief|president|executive vice president|senior vice president|general counsel|secretary)\b/.test(normalizedTitle);
    const careerSignal = /\b(served|joined|appointed|experience|previously|prior to|responsible for|has been)\b/i;
    const nearbyCareer = new RegExp(`(?:${lastName}.{0,220}${careerSignal.source}|${careerSignal.source}.{0,220}${lastName})`,"i");
    const biography = proposedBiography.length >= 30 && careerSignal.test(proposedBiography)
      ? proposedBiography
      : nearbyCareer.test(sourceExcerpt)
        ? sourceExcerpt
        : `The filing identifies ${name} as ${title}. Additional career history was not disclosed in the cited passage.`;
    if (name.length < 3 || title.length < 2 || formerOfficer || directorOnly || !citationExcerptResolves(sourceText, sourceExcerpt)) continue;
    valid.push({ name, title, biography, sourceExcerpt });
  }
  if (!valid.length) throw new Error("No management biography passed exact filing-excerpt validation.");
  return valid;
}

function registrationManagementFiling(cik: string, submissions: SubmissionProfile): ManagementFiling | null {
  const recent = submissions.filings?.recent;
  if (!recent?.form?.length) return null;
  for (let index=0;index<recent.form.length;index+=1) {
    if (!/^(?:S-1|F-1|S-4|F-4|10-12B)(?:\/A)?$/i.test(recent.form[index] ?? "")) continue;
    const accession = recent.accessionNumber?.[index] ?? "";
    const primaryDocument = recent.primaryDocument?.[index] ?? "";
    if (!accession || !primaryDocument) continue;
    return {
      filingDate: recent.filingDate?.[index] ?? "",
      sourceUrl: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession.replaceAll("-","")}/${primaryDocument}`,
    };
  }
  return null;
}

async function selectTarget() {
  return env.DB.prepare(`SELECT d.ticker,c.cik,c.name,c.market_cap,
      CASE WHEN p.ticker IS NULL OR p.verified_at<datetime('now','-90 days') THEN 1 ELSE 0 END AS needs_contact,
      CASE WHEN NOT EXISTS (SELECT 1 FROM company_management_people current_management
        WHERE current_management.ticker=d.ticker AND current_management.is_current=1) THEN 1 ELSE 0 END AS needs_management
    FROM company_dossiers d JOIN companies c ON c.ticker=d.ticker
    LEFT JOIN company_contact_profiles p ON p.ticker=d.ticker
    WHERE d.status='published' AND c.cik IS NOT NULL AND c.cik<>''
      AND (p.ticker IS NULL OR p.verified_at<datetime('now','-90 days')
        OR NOT EXISTS (SELECT 1 FROM company_management_people m WHERE m.ticker=d.ticker AND m.is_current=1))
      AND (SELECT COUNT(*) FROM company_profile_refresh_jobs j WHERE j.ticker=d.ticker
        AND j.status='error' AND j.started_at>=datetime('now','-30 days')
        AND j.error_message NOT LIKE 'Unterminated string in JSON%'
        AND j.error_message NOT LIKE 'Unexpected end of JSON%')<3
      AND NOT EXISTS (SELECT 1 FROM company_profile_refresh_jobs j WHERE j.ticker=d.ticker
        AND j.status='running' AND j.started_at>=datetime('now','-20 minutes'))
    ORDER BY c.market_cap IS NULL,c.market_cap DESC,c.ticker LIMIT 1`).first<Target>();
}

async function officialIrUrl(ticker: string, submissions: SubmissionProfile) {
  const disclosed = normalizedIrHome(submissions.investorWebsite);
  if (disclosed) return disclosed;
  const source = await env.DB.prepare(`SELECT url FROM dossier_sources WHERE ticker=?
    AND (source_type LIKE '%investor%' OR lower(title) LIKE '%investor relation%'
      OR lower(url) LIKE 'https://ir.%' OR lower(url) LIKE 'https://investor.%' OR lower(url) LIKE 'https://investors.%')
    AND url LIKE 'https://%' ORDER BY evidence_date DESC,url LIMIT 1`).bind(ticker).first<{ url: string }>();
  return normalizedIrHome(source?.url);
}

async function fetchIrContact(irUrl: string) {
  if (!irUrl) return { email: "",sourceUrl: "" };
  const headers = { accept: "text/html", "user-agent": SEC_AGENT };
  const response = await fetch(irUrl,{ headers,redirect: "follow",signal: AbortSignal.timeout(5_000) });
  if (!response.ok) return { email: "",sourceUrl: irUrl };
  const html = await response.text();
  const directEmail = irEmailFromHtml(html);
  if (directEmail) return { email: directEmail,sourceUrl: response.url || irUrl };
  for (const contactUrl of irContactLinks(html,response.url || irUrl).slice(0,1)) {
    try {
      const contactResponse = await fetch(contactUrl,{ headers,redirect: "follow",signal: AbortSignal.timeout(5_000) });
      if (!contactResponse.ok) continue;
      const email = irEmailFromHtml(await contactResponse.text());
      if (email) return { email,sourceUrl: contactResponse.url || contactUrl };
    } catch { /* Try another official contact link. */ }
  }
  return { email: "",sourceUrl: response.url || irUrl };
}

async function saveContact(target: Target, submissions: SubmissionProfile, submissionsUrl: string, irUrl: string, irEmail: string, irSourceUrl: string) {
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
      submissionsUrl, irSourceUrl || irUrl,
    ).run();
}

async function extractManagement(target: Target, submissions: SubmissionProfile) {
  const filing = relevantSecFilings(target.cik, submissions).find((item) => item.eventType === "proxy_statement")
    ?? relevantSecFilings(target.cik, submissions).find((item) => item.eventType === "annual_report")
    ?? registrationManagementFiling(target.cik,submissions);
  if (!filing) return { sourceUrl: "", people: [] as ManagementPerson[] };
  const response = await fetch(filing.sourceUrl, { headers: { accept: "text/html", "user-agent": SEC_AGENT }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`Management filing returned HTTP ${response.status}.`);
  const text = managementText(filingHtmlToText(await response.text()));
  const ai = (env as unknown as { AI?: AiBinding }).AI;
  if (!ai) throw new Error("Workers AI binding is unavailable for management biography extraction.");
  const request = (retry: boolean) => withDeadline(ai.run(MODEL, { messages: [
    { role: "system", content: "Extract current executive-management facts from SEC filing text. Return one complete valid JSON object only." },
    { role: "user", content: `Identify up to ${retry ? "four" : "six"} current executive officers of ${target.name} (${target.ticker}). Use only the filing text. Do not include a director unless the person is also an executive officer. Keep each biography under ${retry ? "25" : "35"} words. Every sourceExcerpt must copy 8-30 consecutive words exactly. Return {"people":[{"name":"...","title":"...","biography":"...","sourceExcerpt":"..."}]}. ${retry ? "The prior answer was incomplete; shorten every field and close all JSON arrays and objects." : ""}\n\nFILING TEXT:\n${text}` },
  ], response_format: { type: "json_object" }, max_tokens: retry ? 1_100 : 1_500, temperature: 0 }), 15_000,
  retry ? "Management biography retry" : "Management biography extraction");
  let people: ManagementPerson[];
  try { people = validatePeople(await request(false), text); }
  catch { people = validatePeople(await request(true), text); }
  return { sourceUrl: filing.sourceUrl, filingDate: filing.filingDate, people };
}

export async function refreshNextCompanyProfile() {
  await ensureCompanyProfileSchema();
  await env.DB.prepare(`UPDATE company_profile_refresh_jobs SET status='error',error_message='Worker invocation timed out.',
    completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE status='running' AND started_at<datetime('now','-2 minutes')`).run();
  const active = await env.DB.prepare("SELECT ticker FROM company_profile_refresh_jobs WHERE status='running' AND started_at>=datetime('now','-2 minutes') LIMIT 1")
    .first<{ ticker: string }>();
  if (active) return { refreshed: false as const, reason: "company_profile_refresh_already_running", ticker: active.ticker };
  const target = await selectTarget();
  if (!target) return { refreshed: false as const, reason: "no_company_profile_due" };
  const jobId = `profile-${target.ticker.toLowerCase()}-${crypto.randomUUID()}`;
  await env.DB.prepare("INSERT INTO company_profile_refresh_jobs(id,ticker,status) VALUES (?,?,'running')").bind(jobId,target.ticker).run();
  const submissionsUrl = `https://data.sec.gov/submissions/CIK${target.cik.padStart(10,"0")}.json`;
  try {
    const submissions = await fetchSecJson<SubmissionProfile>(submissionsUrl, SEC_AGENT, { timeoutMs: 6_000,maxAttempts: 1 });
    if (target.needs_contact) {
      const irUrl = await officialIrUrl(target.ticker, submissions);
      let irContact = { email: "",sourceUrl: irUrl };
      if (irUrl) {
        try { irContact = await fetchIrContact(irUrl); }
        catch { /* The SEC contact remains publishable when an IR site blocks automation. */ }
      }
      await saveContact(target, submissions, submissionsUrl, irUrl, irContact.email, irContact.sourceUrl);
      const status = target.needs_management ? "contact_only" : "completed";
      await env.DB.prepare(`UPDATE company_profile_refresh_jobs SET status=?,contact_source_url=?,management_count=0,
        completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status,submissionsUrl,jobId).run();
      return { refreshed: true as const,ticker: target.ticker,status,managementCount: 0,irEmailFound: Boolean(irContact.email) };
    }
    let management: Awaited<ReturnType<typeof extractManagement>> = { sourceUrl: "", people: [] };
    let managementError = "";
    try { management = await extractManagement(target, submissions); } catch (error) { managementError = error instanceof Error ? error.message : "Management extraction failed."; }
    if (!management.people.length && !managementError) managementError = "No current management biography passed filing validation.";
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
    const status = management.people.length ? "completed" : "error";
    await env.DB.prepare(`UPDATE company_profile_refresh_jobs SET status=?,contact_source_url=?,management_source_url=?,
      management_count=?,error_message=?,completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(
        status,submissionsUrl,management.sourceUrl,management.people.length,managementError.slice(0,500),jobId,
      ).run();
    return management.people.length
      ? { refreshed: true as const, ticker: target.ticker, status, managementCount: management.people.length, irEmailFound: false }
      : { refreshed: false as const, ticker: target.ticker, reason: "management_profile_not_verified", error: managementError };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Company profile refresh failed.";
    await env.DB.prepare("UPDATE company_profile_refresh_jobs SET status='error',error_message=?,completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(message.slice(0,500),jobId).run();
    return { refreshed: false as const, ticker: target.ticker, reason: "profile_refresh_failed", error: message };
  }
}
