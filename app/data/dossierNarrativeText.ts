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
