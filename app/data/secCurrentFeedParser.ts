export type SecCurrentFeedEntry = {
  cik: string;
  accessionNumber: string;
  form: string;
  filingDate: string;
};

function decodeXml(value: string) {
  return value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
}

function element(entry: string, name: string) {
  return decodeXml(entry.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"))?.[1]?.trim() ?? "");
}

export function parseSecCurrentFeed(xml: string): SecCurrentFeedEntry[] {
  const parsed: SecCurrentFeedEntry[] = [];
  for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)) {
    const entry = match[1];
    const title = element(entry, "title");
    const id = element(entry, "id");
    const summary = element(entry, "summary").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const categoryForm = entry.match(/<category[^>]+term="([^"]+)"/i)?.[1] ?? "";
    const cik = title.match(/\((\d{6,10})\)\s*\(Filer\)/i)?.[1] ?? "";
    const accessionNumber = id.match(/accession-number=([0-9-]+)/i)?.[1] ?? summary.match(/AccNo:\s*([0-9-]+)/i)?.[1] ?? "";
    const filingDate = summary.match(/Filed:\s*(\d{4}-\d{2}-\d{2})/i)?.[1] ?? "";
    const form = categoryForm || title.split(" - ")[0]?.trim() || "";
    if (cik && accessionNumber && form && filingDate) parsed.push({ cik: cik.replace(/^0+/, "") || "0", accessionNumber, form, filingDate });
  }
  return parsed;
}
