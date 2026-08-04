import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dataPath = resolve(process.cwd(), "app/data/ycSummer2026.json");
const roster = JSON.parse(await readFile(dataPath, "utf8"));
const concurrency = 4;

function decodeAttribute(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function cleanText(value) {
  return String(value ?? "")
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteYcUrl(value) {
  if (!value) return "";
  return new URL(value, "https://www.ycombinator.com").toString();
}

async function fetchProfile(company, attempt = 1) {
  const response = await fetch(company.ycUrl, {
    headers: { "user-agent": "LearnWhatYouOwn research importer (contact: kai@parkonecapital.com)" },
  });
  if ((!response.ok || response.status === 429) && attempt < 4) {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 750 * attempt));
    return fetchProfile(company, attempt + 1);
  }
  if (!response.ok) throw new Error(`${company.slug}: YC returned ${response.status}`);
  const html = await response.text();
  if (/Access Denied|Just a moment|Attention Required|Checking your browser|captcha/i.test(html)) {
    throw new Error(`${company.slug}: received a block page`);
  }
  const encoded = html.match(/data-page="([^"]+)"/)?.[1];
  if (!encoded) throw new Error(`${company.slug}: structured profile data was not found`);
  const props = JSON.parse(decodeAttribute(encoded)).props;
  const profile = props.company;
  if (!profile || profile.slug !== company.slug) throw new Error(`${company.slug}: profile identity mismatch`);
  return {
    ...company,
    description: cleanText(profile.long_description) || company.description,
    yearFounded: Number.isFinite(profile.year_founded) ? profile.year_founded : null,
    teamSize: Number.isFinite(profile.team_size) && profile.team_size > 0 ? profile.team_size : null,
    location: cleanText(profile.location) || company.location,
    primaryPartner: cleanText(profile.primary_group_partner?.full_name),
    companyLinkedIn: profile.linkedin_url || "",
    companyTwitter: profile.twitter_url || "",
    companyGithub: profile.github_url || "",
    founders: (profile.founders ?? []).map((founder) => ({
      name: cleanText(founder.full_name),
      title: cleanText(founder.title) || "Founder",
      bio: cleanText(founder.founder_bio),
      active: Boolean(founder.is_active),
      linkedin: founder.linkedin_url || "",
      twitter: founder.twitter_url || "",
    })).filter((founder) => founder.name),
    launches: (props.launches ?? []).filter((launch) => launch.state === "public").map((launch) => ({
      title: cleanText(launch.title),
      tagline: cleanText(launch.tagline),
      date: launch.created_at || "",
      url: absoluteYcUrl(launch.ycdc_launch_url || launch.url),
    })).filter((launch) => launch.title),
    jobs: (props.jobPostings ?? []).map((job) => ({
      title: cleanText(job.title),
      location: cleanText(job.location),
      type: cleanText(job.type),
      role: cleanText(job.prettyRole || job.roleSpecificType),
      salaryRange: cleanText(job.salaryRange),
      equityRange: cleanText(job.equityRange),
      experience: cleanText(job.minExperience),
      visa: cleanText(job.visa),
      url: absoluteYcUrl(job.url),
    })).filter((job) => job.title),
  };
}

const output = new Array(roster.companies.length);
const errors = [];
let cursor = 0;
async function worker() {
  while (cursor < roster.companies.length) {
    const index = cursor++;
    const company = roster.companies[index];
    try {
      output[index] = await fetchProfile(company);
      console.log(`[${index + 1}/${roster.companies.length}] ${company.name}`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      output[index] = company;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 150));
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
if (errors.length) {
  console.error(errors.join("\n"));
  throw new Error(`YC import failed for ${errors.length} profile(s); existing data was not overwritten.`);
}

const founderCount = output.reduce((sum, company) => sum + company.founders.length, 0);
await writeFile(dataPath, `${JSON.stringify({ ...roster, sourceAsOf: new Date().toISOString().slice(0, 10), companies: output }, null, 2)}\n`);
console.log(`Imported ${output.length} YC companies and ${founderCount} founder records.`);
