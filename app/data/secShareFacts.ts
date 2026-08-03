export type SecFact = { val?: number; end?: string; filed?: string; form?: string; accn?: string };
export type SecCompanyFacts = { facts?: Record<string, Record<string, { units?: Record<string, SecFact[]> }>> };

export type SecSubmissions = {
  filings?: { recent?: {
    form?: string[];
    accessionNumber?: string[];
    primaryDocument?: string[];
    filingDate?: string[];
    reportDate?: string[];
  } };
};

export type ShareFact = SecFact & { taxonomy: string; concept: string; sourceUrl?: string };
export type ShareFiling = { form: string; accessionNumber: string; primaryDocument: string; filingDate: string; reportDate: string; sourceUrl: string };

export const shareFactDefinitions = [
  ["dei", "EntityCommonStockSharesOutstanding"],
  ["us-gaap", "CommonStockSharesOutstanding"],
  ["ifrs-full", "NumberOfSharesOutstanding"],
] as const;

function latestFact(payload: SecCompanyFacts, taxonomy: string, concept: string, unit: string) {
  const values = payload.facts?.[taxonomy]?.[concept]?.units?.[unit] ?? [];
  return values.filter((fact) => typeof fact.val === "number" && fact.end && fact.filed)
    .sort((left, right) => (right.filed ?? "").localeCompare(left.filed ?? "") || (right.end ?? "").localeCompare(left.end ?? ""))[0] ?? null;
}

export function latestSharesOutstanding(payload: SecCompanyFacts): ShareFact | null {
  const candidates = shareFactDefinitions.flatMap(([taxonomy, concept]) => {
    const fact = latestFact(payload, taxonomy, concept, "shares");
    return fact ? [{ ...fact, taxonomy, concept }] : [];
  });

  return candidates.sort((left, right) =>
    (right.filed ?? "").localeCompare(left.filed ?? "")
      || (right.end ?? "").localeCompare(left.end ?? "")
      || Number(right.taxonomy === "dei") - Number(left.taxonomy === "dei")
  )[0] ?? null;
}

export function latestShareFiling(cik: string, payload: SecSubmissions): ShareFiling | null {
  const recent = payload.filings?.recent;
  if (!recent?.form?.length) return null;
  const preferredForms = /^(10-Q|10-Q\/A|10-K|10-K\/A|20-F|20-F\/A|40-F|40-F\/A)$/;
  const registrationForms = /^(S-1|S-1\/A|424B3|424B4|S-4|S-4\/A)$/;
  const indexes = recent.form.map((_, index) => index);
  const index = indexes.find((candidate) => preferredForms.test(recent.form![candidate] ?? ""))
    ?? indexes.find((candidate) => registrationForms.test(recent.form![candidate] ?? ""));
  if (index === undefined) return null;
  const accessionNumber = recent.accessionNumber?.[index] ?? "";
  const primaryDocument = recent.primaryDocument?.[index] ?? "";
  if (!accessionNumber || !primaryDocument) return null;
  const sourceUrl = `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accessionNumber.replaceAll("-", "")}/${primaryDocument}`;
  return {
    form: recent.form[index] ?? "SEC filing",
    accessionNumber,
    primaryDocument,
    filingDate: recent.filingDate?.[index] ?? "",
    reportDate: recent.reportDate?.[index] ?? "",
    sourceUrl,
  };
}

function attribute(attributes: string, name: string) {
  return attributes.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1] ?? "";
}

function numericInlineValue(content: string, attributes: string) {
  const text = content.replace(/<[^>]+>/g, "").replace(/&#160;|&nbsp;/gi, " ").trim().toLowerCase();
  if (/^(no|none|zero|nil|-)$/.test(text)) return 0;
  const parsed = Number(text.replaceAll(",", "").replace(/[^0-9.+-]/g, ""));
  if (!Number.isFinite(parsed)) return null;
  const scale = Number(attribute(attributes, "scale") || 0);
  return parsed * (Number.isFinite(scale) ? 10 ** scale : 1) * (attribute(attributes, "sign") === "-" ? -1 : 1);
}

function contextInstant(html: string, contextRef: string) {
  if (!contextRef) return "";
  const escaped = contextRef.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const context = html.match(new RegExp(`<[^>]*context\\b[^>]*\\bid=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/[^>]*context>`, "i"))?.[1] ?? "";
  return context.match(/<[^>]*instant[^>]*>(\d{4}-\d{2}-\d{2})<\/[^>]*instant>/i)?.[1] ?? "";
}

// Company Facts intentionally omits some dimensional facts. Multi-class
// issuers therefore require the cover-page inline XBRL facts to be summed by
// unique context. This remains filing-grounded and never estimates a total.
export function sharesFromInlineFiling(html: string, filing: ShareFiling): ShareFact | null {
  const pattern = /<ix:nonfraction\b([^>]*\bname=["']dei:EntityCommonStockSharesOutstanding["'][^>]*)>([\s\S]*?)<\/ix:nonfraction>/gi;
  const byContext = new Map<string, { value: number; end: string }>();
  for (const match of html.matchAll(pattern)) {
    const attributes = match[1] ?? "";
    const contextRef = attribute(attributes, "contextRef");
    const value = numericInlineValue(match[2] ?? "", attributes);
    if (value === null || value < 0) continue;
    byContext.set(contextRef || `${byContext.size}`, { value, end: contextInstant(html, contextRef) });
  }
  if (!byContext.size) return null;
  const rows = [...byContext.values()];
  return {
    val: rows.reduce((total, row) => total + row.value, 0),
    end: rows.map((row) => row.end).filter(Boolean).sort().at(-1) || filing.reportDate || filing.filingDate,
    filed: filing.filingDate,
    form: filing.form,
    accn: filing.accessionNumber,
    taxonomy: "dei",
    concept: "EntityCommonStockSharesOutstanding",
    sourceUrl: filing.sourceUrl,
  };
}
