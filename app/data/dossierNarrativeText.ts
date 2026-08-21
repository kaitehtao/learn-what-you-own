const MAX_SOURCE_CHARACTERS = 9_000;

function decodeHtml(value: string) {
  const entities: Record<string, string> = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"', ndash: "–", mdash: "—" };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const radix = entity[1]?.toLowerCase() === "x" ? 16 : 10;
      const code = Number.parseInt(radix === 16 ? entity.slice(2) : entity.slice(1), radix);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return entities[entity.toLowerCase()] ?? match;
  });
}

export function filingHtmlToText(html: string) {
  return decodeHtml(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|li|tr|h[1-6]|table|section)>/gi, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]+>/g, " "))
    .replace(/\r/g, "").replace(/[\t ]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function strategicFilingExcerpt(text: string) {
  if (text.length <= MAX_SOURCE_CHARACTERS) return text;
  const slices = [text.slice(0, 3_000)];
  for (const heading of ["business", "risk factors", "management's discussion", "management’s discussion", "competition"]) {
    const index = text.toLowerCase().indexOf(heading);
    if (index >= 0) slices.push(text.slice(index, index + 3_000));
  }
  return slices.join("\n\n").slice(0, MAX_SOURCE_CHARACTERS);
}

const evidenceTerms = ["business", "revenue", "customer", "product", "service", "competition", "market", "demand", "margin", "cash", "debt", "risk", "supplier", "capital"];

export function filingEvidenceSnippets(text: string, limit = 18) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length) return [];
  const candidates: Array<{ score: number; index: number; text: string }> = [];
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index].toLowerCase().replace(/[^a-z]/g, "");
    if (!evidenceTerms.includes(word)) continue;
    const start = Math.max(0, index - 7);
    const excerpt = words.slice(start, Math.min(words.length, start + 24)).join(" ");
    const normalized = excerpt.toLowerCase();
    const score = evidenceTerms.reduce((total, term) => total + (normalized.includes(term) ? 1 : 0), 0);
    candidates.push({ score, index: start, text: excerpt });
  }
  for (let index = 0; index < words.length; index += Math.max(24, Math.floor(words.length / 8))) {
    candidates.push({ score: 0, index, text: words.slice(index, Math.min(words.length, index + 24)).join(" ") });
  }
  const selected: string[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates.sort((left, right) => right.score - left.score || left.index - right.index)) {
    const key = candidate.text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (key.split(" ").length < 12 || seen.has(key)) continue;
    seen.add(key);
    selected.push(candidate.text);
    if (selected.length >= Math.max(1, limit)) break;
  }
  return selected;
}

export type FilingEvidenceEntry = { id: string; url: string; excerpt: string };

export function filingEvidenceCatalog(sources: Array<{ url: string; text: string }>) {
  return sources.flatMap((source, sourceIndex) => filingEvidenceSnippets(source.text).map((excerpt, excerptIndex) => ({
    id: `S${sourceIndex + 1}-${excerptIndex + 1}`,
    url: source.url,
    excerpt,
  })));
}

export function resolveNarrativeEvidenceIds(value: Record<string, unknown>, catalog: FilingEvidenceEntry[]) {
  const byId = new Map(catalog.map((entry) => [entry.id, entry]));
  const visit = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(visit);
    if (!input || typeof input !== "object") return input;
    const record = Object.fromEntries(Object.entries(input as Record<string, unknown>).map(([key, nested]) => [key, visit(nested)]));
    if (typeof record.sourceUrl === "string" && typeof record.sourceExcerpt === "string") {
      const evidenceId = record.sourceExcerpt.trim().match(/\bS\d+-\d+\b/i)?.[0]?.toUpperCase();
      const entry = evidenceId ? byId.get(evidenceId) : undefined;
      // The evidence ID is server-generated and therefore authoritative. The
      // model occasionally selects a valid ID but repeats the other approved
      // filing URL beside it. Resolve both fields from the catalog so a valid
      // citation cannot fail merely because of that redundant URL mismatch.
      if (entry) {
        record.sourceUrl = entry.url;
        record.sourceExcerpt = entry.excerpt;
      }
    }
    return record;
  };
  return visit(value) as Record<string, unknown>;
}

export async function withDeadline<T>(promise: Promise<T>, milliseconds: number, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => { timeout = setTimeout(() => reject(new Error(`${label} exceeded ${Math.round(milliseconds / 1_000)} seconds.`)), milliseconds); }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function parseJsonText(value: string) {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  if (!cleaned) throw new Error("Workers AI returned no narrative JSON.");
  return JSON.parse(cleaned) as Record<string, unknown>;
}

export function parseNarrativeModelResponse(response: unknown): Record<string, unknown> {
  if (typeof response === "string") return parseJsonText(response);
  if (!response || typeof response !== "object") throw new Error("Workers AI returned no narrative JSON.");
  const record = response as Record<string, unknown>;
  if (record.response && typeof record.response === "object" && !Array.isArray(record.response)) {
    return record.response as Record<string, unknown>;
  }
  if (typeof record.response === "string") return parseJsonText(record.response);
  if (typeof record.result === "string") return parseJsonText(record.result);
  const visited = new Set<unknown>();
  const search = (value: unknown): Record<string, unknown> | null => {
    if (typeof value === "string" && /^(?:```(?:json)?\s*)?\s*\{/i.test(value)) {
      try { return parseJsonText(value); } catch { return null; }
    }
    if (!value || typeof value !== "object" || visited.has(value)) return null;
    visited.add(value);
    const candidate = value as Record<string, unknown>;
    if (candidate.description && candidate.lede && candidate.sells) return candidate;
    for (const key of ["content", "text", "output_text", "message", "response", "result", "choices", "output"]) {
      const found = search(candidate[key]);
      if (found) return found;
    }
    if (Array.isArray(value)) for (const item of value) { const found = search(item); if (found) return found; }
    return null;
  };
  const nested = search(record);
  if (nested) return nested;
  throw new Error(`Workers AI returned an unsupported narrative response (${Object.keys(record).sort().join(",") || "no keys"}).`);
}

function evidenceWords(value: string) {
  return value.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")
    .replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
}

export function citationExcerptResolves(document: string, excerpt: string) {
  const documentWords = evidenceWords(document);
  const excerptWords = evidenceWords(excerpt);
  if (excerptWords.length < 8) return false;
  const documentText = ` ${documentWords.join(" ")} `;
  for (let index = 0; index <= excerptWords.length - 8; index += 1) {
    if (documentText.includes(` ${excerptWords.slice(index, index + 8).join(" ")} `)) return true;
  }
  return false;
}
