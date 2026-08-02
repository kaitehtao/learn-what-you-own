function decodeXml(value: string): string {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

export function stripNewsHtml(value: string): string {
  const decoded = decodeXml(value);
  return decodeXml(decoded
    .replace(/<(style|script|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    // Some Q4/PR Newswire feeds place stylesheet rules directly in a summary
    // instead of wrapping them in a <style> element. Remove those rule blocks
    // before stripping markup so readers never see selectors such as
    // `.q4default span.prnews_span { ... }` as article copy.
    .replace(/(?:^|\s)[.#][a-z][^{}\n]{0,240}\{[^{}]{0,3000}\}/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}
