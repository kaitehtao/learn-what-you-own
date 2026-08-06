import { classifySecFiling, type SecSubmissionFeed } from "./dossierFreshnessClassification";

const SOURCE_PACK_LIMIT = 6;

export type SecSourcePackItem = {
  accessionNumber: string;
  form: string;
  filingDate: string;
  primaryDocument: string;
  description: string;
  sourceUrl: string;
  category: "annual" | "quarterly" | "proxy" | "earnings" | "material_current" | "foreign_current" | "other_relevant";
};

type RecentFilings = NonNullable<NonNullable<SecSubmissionFeed["filings"]>["recent"]>;

function archiveUrl(cik: string, accessionNumber: string, primaryDocument: string) {
  return `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accessionNumber.replaceAll("-", "")}/${primaryDocument}`;
}

function sourceCategory(form: string, items: string, description: string): SecSourcePackItem["category"] | null {
  const normalized = form.trim().toUpperCase();
  if (/^(10-K|20-F|40-F)(?:\/A)?$/.test(normalized)) return "annual";
  if (/^10-Q(?:\/A)?$/.test(normalized)) return "quarterly";
  if (/^DEF 14[AC]$/.test(normalized)) return "proxy";
  const classified = classifySecFiling(normalized, items, description);
  if (classified?.eventType === "earnings_release") return "earnings";
  if (classified?.eventType === "material_8k") return "material_current";
  if (/^6-K(?:\/A)?$/.test(normalized)) return "foreign_current";
  if (/^(S-[1348]|F-[134]|424B\d+|ARS|SD|11-K)(?:\/A)?$/.test(normalized)) return "other_relevant";
  return null;
}

function sourceRows(cik: string, recent: RecentFilings) {
  const output: SecSourcePackItem[] = [];
  for (let index = 0; index < (recent.form?.length ?? 0); index += 1) {
    const form = recent.form?.[index] ?? "";
    const accessionNumber = recent.accessionNumber?.[index] ?? "";
    const primaryDocument = recent.primaryDocument?.[index] ?? "";
    const filingDate = recent.filingDate?.[index] ?? "";
    const description = recent.primaryDocDescription?.[index] ?? "";
    const category = sourceCategory(form, recent.items?.[index] ?? "", description);
    if (!category || !accessionNumber || !primaryDocument || !filingDate) continue;
    output.push({
      accessionNumber,
      form: form.trim().toUpperCase(),
      filingDate,
      primaryDocument,
      description,
      sourceUrl: archiveUrl(cik, accessionNumber, primaryDocument),
      category,
    });
  }
  return output.sort((left, right) => right.filingDate.localeCompare(left.filingDate) || right.accessionNumber.localeCompare(left.accessionNumber));
}

export function selectSecSourcePack(cik: string, feed: SecSubmissionFeed, limit = SOURCE_PACK_LIMIT) {
  const recent = feed.filings?.recent;
  if (!recent) return [];
  const candidates = sourceRows(cik, recent);
  const selected: SecSourcePackItem[] = [];
  const accessions = new Set<string>();
  const add = (item: SecSourcePackItem | undefined) => {
    if (!item || accessions.has(item.accessionNumber) || selected.length >= limit) return;
    selected.push(item);
    accessions.add(item.accessionNumber);
  };
  const category = (value: SecSourcePackItem["category"]) => candidates.filter((item) => item.category === value);

  add(category("annual")[0]);
  category("quarterly").slice(0, 2).forEach(add);
  add(category("proxy")[0]);
  add(category("earnings")[0]);
  add(category("material_current")[0]);
  add(category("foreign_current")[0]);
  for (const item of candidates) add(item);
  return selected.sort((left, right) => right.filingDate.localeCompare(left.filingDate) || right.accessionNumber.localeCompare(left.accessionNumber));
}
