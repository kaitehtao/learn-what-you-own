const MAX_SOURCE_CHARACTERS = 14_000;

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
