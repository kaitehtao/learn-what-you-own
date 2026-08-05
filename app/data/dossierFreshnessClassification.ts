export type FreshnessEventType = "earnings_release" | "annual_report" | "quarterly_report" | "proxy_statement" | "material_8k";

export type SecSubmissionFeed = { filings?: { recent?: {
  form?: string[]; accessionNumber?: string[]; primaryDocument?: string[]; primaryDocDescription?: string[];
  filingDate?: string[]; reportDate?: string[]; items?: string[];
} } };

export type ClassifiedSecFiling = {
  accessionNumber: string; form: string; filingDate: string; reportDate: string; primaryDocument: string; sourceUrl: string;
  eventType: FreshnessEventType; items: string[]; materialityReason: string; reviewFocus: string[]; refreshFacts: boolean;
};

const MATERIAL_8K_ITEMS = new Set(["1.01","1.02","1.03","2.01","2.02","2.03","2.04","2.05","2.06","3.01","3.02","3.03","4.01","4.02","5.01","5.02","5.03","5.07","5.08","6.01","7.01","8.01"]);
const REVIEW_FOCUS: Record<FreshnessEventType, string[]> = {
  earnings_release: ["Reported results versus prior period and expectations", "Guidance and management-language changes", "Bull, bear, catalyst, risk, and valuation implications"],
  annual_report: ["Audited financial and segment changes", "Risk-factor and accounting-policy changes", "Capital allocation, ownership, competition, and thesis implications"],
  quarterly_report: ["Quarter-over-quarter and year-over-year financial changes", "Liquidity, share count, guidance, and risk changes", "Bull, bear, catalyst, and thesis-breaker implications"],
  proxy_statement: ["Beneficial ownership and insider-control changes", "Executive incentives and dilution", "Board oversight, proposals, and governance risks"],
  material_8k: ["Event terms and immediate financial effect", "Capital structure, leadership, customer, supplier, or legal implications", "Whether the owner summary or thesis must change"],
};

const normalizeItems = (value: string) => value.split(/[,;\s]+/).map((item) => item.trim()).filter((item) => /^\d+\.\d+$/.test(item));

export function classifySecFiling(formValue: string, itemsValue = "", description = ""): Omit<ClassifiedSecFiling, "accessionNumber" | "filingDate" | "reportDate" | "primaryDocument" | "sourceUrl"> | null {
  const form = formValue.trim().toUpperCase();
  const items = normalizeItems(itemsValue);
  let eventType: FreshnessEventType | null = null;
  let materialityReason = "";
  let refreshFacts = false;
  if (/^10-K(?:\/A)?$/.test(form)) { eventType="annual_report"; materialityReason="Annual report filed with audited financial statements and updated business risks."; refreshFacts=true; }
  else if (/^10-Q(?:\/A)?$/.test(form)) { eventType="quarterly_report"; materialityReason="Quarterly report filed with updated financial statements and management discussion."; refreshFacts=true; }
  else if (/^DEF 14[AC]$/.test(form)) { eventType="proxy_statement"; materialityReason="Definitive proxy filed with ownership, governance, compensation, and voting disclosures."; }
  else if (/^8-K(?:\/A)?$/.test(form)) {
    const earningsLanguage = /earnings|financial results|quarterly results|annual results/i.test(description);
    if (items.includes("2.02") || earningsLanguage) { eventType="earnings_release"; materialityReason=items.includes("2.02") ? "Current report includes Item 2.02, Results of Operations and Financial Condition." : "Current report description identifies an earnings or financial-results release."; refreshFacts=true; }
    else if (!items.length || items.some((item) => MATERIAL_8K_ITEMS.has(item))) { eventType="material_8k"; materialityReason=items.length ? `Current report includes potentially material SEC item${items.length===1?"":"s"} ${items.join(", ")}.` : "Current report filed; SEC item metadata was unavailable, so editorial materiality review is required."; }
  } else if (/^6-K(?:\/A)?$/.test(form) && /earnings|financial results|quarterly results|annual results/i.test(description)) { eventType="earnings_release"; materialityReason="Foreign-issuer report description identifies an earnings or financial-results release."; refreshFacts=true; }
  return eventType ? { form,eventType,items,materialityReason,reviewFocus:REVIEW_FOCUS[eventType],refreshFacts } : null;
}

export function relevantSecFilings(cik: string, feed: SecSubmissionFeed, sinceDate?: string | null) {
  const recent=feed.filings?.recent; if(!recent?.form?.length) return [];
  const rows: ClassifiedSecFiling[]=[];
  for(let index=0;index<recent.form.length;index+=1){
    const filingDate=recent.filingDate?.[index]??""; if(!filingDate||(sinceDate&&filingDate<sinceDate)) continue;
    const accessionNumber=recent.accessionNumber?.[index]??""; const primaryDocument=recent.primaryDocument?.[index]??""; if(!accessionNumber||!primaryDocument) continue;
    const classified=classifySecFiling(recent.form[index]??"",recent.items?.[index]??"",recent.primaryDocDescription?.[index]??""); if(!classified) continue;
    rows.push({...classified,accessionNumber,filingDate,reportDate:recent.reportDate?.[index]??"",primaryDocument,sourceUrl:`https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accessionNumber.replaceAll("-","")}/${primaryDocument}`});
  }
  return rows.sort((left,right)=>right.filingDate.localeCompare(left.filingDate)||right.accessionNumber.localeCompare(left.accessionNumber));
}
