import type { SecSubmissions } from "./secShareFacts";

export type SecOwnershipFiling = {
  form: string;
  accessionNumber: string;
  primaryDocument: string;
  filingDate: string;
  reportDate: string;
  sourceUrl: string;
  rawXmlUrl: string;
};

export type SecInsiderTransactionDirection = "purchase" | "sale" | "other";

export type SecInsiderTransaction = {
  name: string;
  relation: string;
  date: string;
  transactionCode: string;
  transactionType: string;
  direction: SecInsiderTransactionDirection;
  securityTitle: string;
  shares: number;
  price: number | null;
  value: number | null;
  sharesHeld: number | null;
  directOrIndirect: string;
  sourceUrl: string;
};

export type SecReportingInsider = {
  name: string;
  relation: string;
  latestDate: string;
  latestTransaction: string;
  reportedShares: number;
  sourceUrl: string;
};

export type ParsedSecOwnershipFiling = {
  form: string;
  filingDate: string;
  reportDate: string;
  sourceUrl: string;
  issuerCik: string;
  issuerName: string;
  issuerTradingSymbol: string;
  owners: SecReportingInsider[];
  transactions: SecInsiderTransaction[];
};

const OWNERSHIP_FORMS = /^(3|3\/A|4|4\/A|5|5\/A)$/;
const TRANSACTION_LABELS: Record<string, string> = {
  A: "Grant, award, or other acquisition",
  C: "Conversion",
  D: "Disposition to issuer",
  F: "Tax or exercise-price withholding",
  G: "Gift",
  J: "Other acquisition or disposition",
  K: "Equity swap or similar instrument",
  M: "Option exercise or conversion",
  P: "Open-market or private purchase",
  S: "Open-market or private sale",
  U: "Disposition under tender",
  W: "Acquisition or disposition by will or law",
  X: "In-the-money derivative exercise",
  Z: "Deposit into or withdrawal from voting trust",
};

function entity(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function blocks(xml: string, tag: string) {
  const escaped = escapePattern(tag);
  return [...xml.matchAll(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "gi"))].map((match) => match[1] ?? "");
}

function textValue(xml: string, tag: string) {
  const escaped = escapePattern(tag);
  const content = xml.match(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i"))?.[1] ?? "";
  const value = content.match(/<value\b[^>]*>([\s\S]*?)<\/value>/i)?.[1] ?? content;
  return entity(value.replace(/<[^>]+>/g, " "));
}

function numericValue(xml: string, tag: string) {
  const value = Number(textValue(xml, tag).replaceAll(",", "").replace(/[$%\s]/g, ""));
  return Number.isFinite(value) ? value : null;
}

function truthy(xml: string, tag: string) {
  return /^(1|true|yes|x)$/i.test(textValue(xml, tag));
}

function relation(ownerXml: string) {
  const values = [
    truthy(ownerXml, "isDirector") ? "Director" : "",
    truthy(ownerXml, "isOfficer") ? textValue(ownerXml, "officerTitle") || "Officer" : "",
    truthy(ownerXml, "isTenPercentOwner") ? "10% owner" : "",
    truthy(ownerXml, "isOther") ? textValue(ownerXml, "otherText") || "Other reporting person" : "",
  ].filter(Boolean);
  return values.join(" · ") || "Reporting person";
}

export function secTransactionDirection(code: string): SecInsiderTransactionDirection {
  if (code.toUpperCase() === "P") return "purchase";
  if (code.toUpperCase() === "S") return "sale";
  return "other";
}

export function secTransactionLabel(code: string, acquiredDisposed: string) {
  const normalized = code.trim().toUpperCase();
  return TRANSACTION_LABELS[normalized]
    ?? (acquiredDisposed.toUpperCase() === "A" ? "Other acquisition" : acquiredDisposed.toUpperCase() === "D" ? "Other disposition" : "Ownership transaction");
}

export function recentOwnershipFilings(cik: string, submissions: SecSubmissions, limit = 36) {
  const recent = submissions.filings?.recent;
  if (!recent?.form?.length) return { filings: [] as SecOwnershipFiling[], availableRecords: 0 };
  const filings: SecOwnershipFiling[] = [];
  let availableRecords = 0;
  for (let index = 0; index < recent.form.length; index += 1) {
    const form = recent.form[index] ?? "";
    if (!OWNERSHIP_FORMS.test(form)) continue;
    availableRecords += 1;
    if (filings.length >= limit) continue;
    const accessionNumber = recent.accessionNumber?.[index] ?? "";
    const primaryDocument = recent.primaryDocument?.[index] ?? "";
    if (!accessionNumber || !primaryDocument) continue;
    const archiveRoot = `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accessionNumber.replaceAll("-", "")}`;
    const rawDocument = primaryDocument.split("/").at(-1) || primaryDocument;
    filings.push({
      form,
      accessionNumber,
      primaryDocument,
      filingDate: recent.filingDate?.[index] ?? "",
      reportDate: recent.reportDate?.[index] ?? "",
      sourceUrl: `${archiveRoot}/${primaryDocument}`,
      rawXmlUrl: `${archiveRoot}/${rawDocument}`,
    });
  }
  return { filings, availableRecords };
}

export function parseSecOwnershipXml(xml: string, filing: SecOwnershipFiling): ParsedSecOwnershipFiling {
  const ownerBlocks = blocks(xml, "reportingOwner");
  const ownerNames = ownerBlocks.map((owner) => textValue(owner, "rptOwnerName")).filter(Boolean);
  const ownerRelations = ownerBlocks.map(relation);
  const primaryName = ownerNames.join("; ") || "Reporting insider";
  const primaryRelation = [...new Set(ownerRelations)].join("; ") || "Reporting person";
  const reportDate = textValue(xml, "periodOfReport") || filing.reportDate || filing.filingDate;
  const transactionBlocks = [
    ...blocks(xml, "nonDerivativeTransaction"),
    ...blocks(xml, "derivativeTransaction"),
  ];
  const transactions = transactionBlocks.map((transaction): SecInsiderTransaction => {
    const code = textValue(transaction, "transactionCode").toUpperCase();
    const acquiredDisposed = textValue(transaction, "transactionAcquiredDisposedCode").toUpperCase();
    const shares = Math.abs(numericValue(transaction, "transactionShares") ?? 0);
    const price = numericValue(transaction, "transactionPricePerShare");
    const sharesHeld = numericValue(transaction, "sharesOwnedFollowingTransaction");
    return {
      name: primaryName,
      relation: primaryRelation,
      date: textValue(transaction, "transactionDate") || reportDate,
      transactionCode: code,
      transactionType: `${secTransactionLabel(code, acquiredDisposed)}${code ? ` (${code})` : ""}`,
      direction: secTransactionDirection(code),
      securityTitle: textValue(transaction, "securityTitle") || textValue(transaction, "underlyingSecurityTitle") || "Issuer security",
      shares,
      price,
      value: shares && price !== null ? shares * Math.abs(price) : null,
      sharesHeld,
      directOrIndirect: textValue(transaction, "directOrIndirectOwnership"),
      sourceUrl: filing.sourceUrl,
    };
  });
  const latestTransaction = transactions[0]?.transactionType || `SEC Form ${filing.form}`;
  const reportedShares = transactions.reduce((largest, transaction) => Math.max(largest, Math.abs(transaction.sharesHeld ?? 0)), 0);
  const owners = ownerBlocks.map((owner, index): SecReportingInsider => ({
    name: textValue(owner, "rptOwnerName") || "Reporting insider",
    relation: ownerRelations[index] || "Reporting person",
    latestDate: reportDate,
    latestTransaction,
    reportedShares,
    sourceUrl: filing.sourceUrl,
  }));
  return {
    form: filing.form,
    filingDate: filing.filingDate,
    reportDate,
    sourceUrl: filing.sourceUrl,
    issuerCik: textValue(xml, "issuerCik").replace(/^0+/, ""),
    issuerName: textValue(xml, "issuerName"),
    issuerTradingSymbol: textValue(xml, "issuerTradingSymbol").toUpperCase(),
    owners,
    transactions,
  };
}

export function aggregateSecReportingInsiders(filings: ParsedSecOwnershipFiling[]) {
  const people = new Map<string, SecReportingInsider>();
  for (const filing of filings) {
    for (const owner of filing.owners) {
      const key = owner.name.trim().toLowerCase();
      if (!key || people.has(key)) continue;
      people.set(key, owner);
    }
  }
  return [...people.values()];
}
