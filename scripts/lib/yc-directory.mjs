const YC_ORIGIN = "https://www.ycombinator.com";

export function decodeHtmlAttribute(value) {
  return String(value ?? "")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

export function extractAlgoliaOptions(html) {
  const encoded = String(html ?? "").match(/window\.AlgoliaOpts\s*=\s*(\{.*?\});/)?.[1];
  if (!encoded) throw new Error("YC directory search configuration was not found");
  const options = JSON.parse(encoded);
  if (!options.app || !options.key) throw new Error("YC directory search configuration is incomplete");
  return { app: String(options.app), key: String(options.key) };
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

export function companyFromDirectoryHit(hit, existing = {}) {
  const slug = text(hit?.slug);
  const name = text(hit?.name);
  if (!slug || !name) throw new Error("YC directory result is missing a company name or slug");
  return {
    name,
    slug,
    website: text(hit.website),
    ycUrl: `${YC_ORIGIN}/companies/${encodeURIComponent(slug)}`,
    oneLiner: text(hit.one_liner),
    description: text(hit.long_description),
    industry: text(hit.industry),
    subindustry: text(hit.subindustry),
    location: text(hit.all_locations),
    teamSize: Number.isFinite(hit.team_size) && hit.team_size > 0 ? hit.team_size : null,
    status: text(hit.status),
    tags: stringList(hit.tags),
    logoUrl: text(hit.small_logo_thumb_url),
    yearFounded: Number.isFinite(existing.yearFounded) ? existing.yearFounded : null,
    primaryPartner: text(existing.primaryPartner),
    companyLinkedIn: text(existing.companyLinkedIn),
    companyTwitter: text(existing.companyTwitter),
    companyGithub: text(existing.companyGithub),
    founders: Array.isArray(existing.founders) ? existing.founders : [],
    launches: Array.isArray(existing.launches) ? existing.launches : [],
    jobs: Array.isArray(existing.jobs) ? existing.jobs : [],
  };
}

export function validateDirectoryRoster(hits, { batch, previousCount = 0 } = {}) {
  if (!Array.isArray(hits)) throw new Error("YC directory response did not contain a company list");
  const minimumCount = Math.max(100, Math.floor(previousCount * 0.7));
  if (hits.length < minimumCount) {
    throw new Error(`YC directory returned only ${hits.length} companies; expected at least ${minimumCount}`);
  }
  const slugs = new Set();
  for (const hit of hits) {
    if (batch && hit.batch !== batch) throw new Error(`YC directory returned a company outside ${batch}`);
    const slug = text(hit.slug);
    if (!slug) throw new Error("YC directory returned a company without a slug");
    if (slugs.has(slug)) throw new Error(`YC directory returned duplicate slug ${slug}`);
    slugs.add(slug);
  }
  return hits;
}

export function buildDirectoryRoster(hits, existingCompanies = []) {
  const existingBySlug = new Map(existingCompanies.map((company) => [company.slug, company]));
  return hits
    .map((hit) => companyFromDirectoryHit(hit, existingBySlug.get(hit.slug)))
    .sort((left, right) => left.name.localeCompare(right.name));
}
