const MAX_SOURCE_CHARACTERS = 42_000;

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
  const slices = [text.slice(0, 8_000)];
  for (const heading of ["business", "risk factors", "management's discussion", "management’s discussion", "competition"]) {
    const index = text.toLowerCase().indexOf(heading);
    if (index >= 0) slices.push(text.slice(index, index + 7_000));
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
  const choice = Array.isArray(record.choices) ? record.choices[0] as Record<string, unknown> | undefined : undefined;
  const message = choice?.message && typeof choice.message === "object" ? choice.message as Record<string, unknown> : undefined;
  if (typeof message?.content === "string") return parseJsonText(message.content);
  const output = Array.isArray(record.output) ? record.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as Record<string, unknown>).content) ? (item as Record<string, unknown>).content as unknown[] : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string") return parseJsonText(text);
    }
  }
  throw new Error(`Workers AI returned an unsupported narrative response (${Object.keys(record).sort().join(",") || "no keys"}).`);
}
