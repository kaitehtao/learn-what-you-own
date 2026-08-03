import { findCatalogCompany } from "../../../db/companyCatalog";
import { getSecCompany } from "../../data/secCompanies.generated";
import { latestShareFiling, latestSharesOutstanding, sharesFromInlineFiling, type SecCompanyFacts, type SecSubmissions } from "../../data/secShareFacts";
import { researchUniverse } from "../../data/universe";

export const dynamic = "force-dynamic";

type InstitutionalRow = { ownerName?: string; date?: string; sharesHeld?: string; sharesChange?: string; sharesChangePCT?: string; marketValue?: string; url?: string };
type NasdaqInstitutional = { data?: { ownershipSummary?: { SharesOutstandingPCT?: { value?: string }; ShareoutstandingTotal?: { value?: string } }; activePositions?: { rows?: Array<{ positions?: string; holders?: string; shares?: string }> }; holdingsTransactions?: { institutionalHolders?: string; sharesHeld?: string; table?: { rows?: InstitutionalRow[] } } } };
type InsiderRow = { insider?: string; relation?: string; lastDate?: string; transactionType?: string; ownType?: string; sharesTraded?: string; lastPrice?: string; sharesHeld?: string; url?: string };
type NasdaqInsiders = { data?: { transactionTable?: { totalRecords?: string; table?: { rows?: InsiderRow[] } } } };
type InsiderTransactionDirection = "purchase" | "sale" | "other";

function latestFact(payload: SecCompanyFacts, taxonomy: string, concept: string, unit: string) {
  const values = payload.facts?.[taxonomy]?.[concept]?.units?.[unit] ?? [];
  return values.filter((fact) => typeof fact.val === "number" && fact.end && fact.filed)
    .sort((left, right) => (right.filed ?? "").localeCompare(left.filed ?? "") || (right.end ?? "").localeCompare(left.end ?? ""))[0] ?? null;
}

async function fetchJson<T>(url: string, userAgent: string, timeoutMs = 12_000, extraHeaders: Record<string, string> = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { accept: "application/json, text/plain, */*", "user-agent": userAgent, ...extraHeaders }, signal: controller.signal });
    if (!response.ok) throw new Error(`Ownership source returned ${response.status}.`);
    return await response.json() as T;
  } finally { clearTimeout(timeout); }
}

async function fetchText(url: string, userAgent: string, timeoutMs = 12_000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { accept: "text/html,application/xhtml+xml", "user-agent": userAgent }, signal: controller.signal });
    if (!response.ok) throw new Error(`SEC filing returned ${response.status}.`);
    return await response.text();
  } finally { clearTimeout(timeout); }
}

function numberFrom(value: string | undefined) {
  if (!value) return null;
  const numeric = Number(value.replace(/[$,%\s]/g, "").replaceAll(",", ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function secFilingUrl(cik: string, accession: string | undefined) {
  if (!accession) return `https://www.sec.gov/edgar/browse/?CIK=${cik}&owner=include`;
  return `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession.replaceAll("-", "")}/`;
}

function aggregateInsiders(rows: InsiderRow[]) {
  const people = new Map<string, { name: string; relation: string; latestDate: string; latestTransaction: string; reportedShares: number; positions: Set<string>; sourceUrl: string }>();
  for (const row of rows) {
    const name = row.insider?.trim();
    if (!name) continue;
    const positionKey = `${name}|${row.ownType || "Unspecified"}`;
    let person = people.get(name);
    if (!person) {
      person = { name, relation: row.relation || "Reporting person", latestDate: row.lastDate || "", latestTransaction: row.transactionType || "SEC ownership filing", reportedShares: 0, positions: new Set(), sourceUrl: row.url ? new URL(row.url, "https://www.nasdaq.com").toString() : "" };
      people.set(name, person);
    }
    if (!person.positions.has(positionKey)) {
      person.positions.add(positionKey);
      person.reportedShares += numberFrom(row.sharesHeld) ?? 0;
    }
  }
  return [...people.values()].map((person) => ({
    name: person.name,
    relation: person.relation,
    latestDate: person.latestDate,
    latestTransaction: person.latestTransaction,
    reportedShares: person.reportedShares,
    sourceUrl: person.sourceUrl,
  }));
}

function insiderTransactionDirection(transactionType: string | undefined): InsiderTransactionDirection {
  const label = transactionType?.trim().toLowerCase() ?? "";
  if (/\b(buy|bought|purchase|purchased)\b/.test(label)) return "purchase";
  if (/\b(sell|sold|sale)\b/.test(label)) return "sale";
  return "other";
}

function insiderTransactions(rows: InsiderRow[], direction: Exclude<InsiderTransactionDirection, "other">) {
  return rows
    .filter((row) => insiderTransactionDirection(row.transactionType) === direction)
    .map((row) => {
      const shares = Math.abs(numberFrom(row.sharesTraded) ?? 0);
      const price = Math.abs(numberFrom(row.lastPrice) ?? 0);
      return {
        name: row.insider?.trim() || "Reporting insider",
        relation: row.relation || "Reporting person",
        date: row.lastDate || "",
        transactionType: row.transactionType || (direction === "purchase" ? "Purchase" : "Sale"),
        shares,
        price: price || null,
        value: shares && price ? shares * price : null,
        sharesHeld: numberFrom(row.sharesHeld),
        sourceUrl: row.url ? new URL(row.url, "https://www.nasdaq.com").toString() : "",
      };
    });
}

export async function GET(request: Request) {
  const ticker = new URL(request.url).searchParams.get("ticker")?.trim().toUpperCase() ?? "";
  if (!/^[A-Z0-9.-]{1,12}$/.test(ticker)) return Response.json({ error: "Choose a valid ticker." }, { status: 400 });
  const company = researchUniverse.find((candidate) => candidate.ticker === ticker);
  const catalog = await findCatalogCompany(ticker);
  if (!company && !catalog) return Response.json({ error: "Ticker is not in the research universe." }, { status: 404 });
  const cik = catalog?.cik || getSecCompany(ticker)?.cik || null;
  if (!cik) return Response.json({ ticker, available: false, reason: "No verified SEC filer match is available for this security." });

  const secSourceUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
  const nasdaqInstitutionalUrl = `https://api.nasdaq.com/api/company/${encodeURIComponent(ticker)}/institutional-holdings?limit=25&type=TOTAL&sortColumn=marketValue&sortOrder=DESC`;
  const nasdaqInsidersUrl = `https://api.nasdaq.com/api/company/${encodeURIComponent(ticker)}/insider-trades?limit=500`;
  const browserAgent = "Mozilla/5.0 (compatible; LearnWhatYouOwn/1.0; +https://learnwhatyouown.com)";
  const nasdaqHeaders = { "accept-language": "en-US,en;q=0.9", referer: "https://www.nasdaq.com/", origin: "https://www.nasdaq.com" };
  const [secResult, institutionalResult, insiderResult] = await Promise.allSettled([
    fetchJson<SecCompanyFacts>(secSourceUrl, "LearnWhatYouOwn/1.0 research@learnwhatyouown.com"),
    fetchJson<NasdaqInstitutional>(nasdaqInstitutionalUrl, browserAgent, 15_000, nasdaqHeaders),
    fetchJson<NasdaqInsiders>(nasdaqInsidersUrl, browserAgent, 15_000, nasdaqHeaders),
  ]);

  const sec = secResult.status === "fulfilled" ? secResult.value : null;
  let shares = sec ? latestSharesOutstanding(sec) : null;
  let directFilingChecked = false;
  if (!shares) {
    try {
      const submissions = await fetchJson<SecSubmissions>(`https://data.sec.gov/submissions/CIK${cik}.json`, "LearnWhatYouOwn/1.0 research@learnwhatyouown.com");
      const filing = latestShareFiling(cik, submissions);
      if (filing) {
        directFilingChecked = true;
        shares = sharesFromInlineFiling(await fetchText(filing.sourceUrl, "LearnWhatYouOwn/1.0 research@learnwhatyouown.com"), filing);
      }
    } catch (error) {
      console.error(`Direct SEC share-count fallback failed for ${ticker}.`, error);
    }
  }
  const publicFloat = sec ? latestFact(sec, "dei", "EntityPublicFloat", "USD") : null;
  const institutional = institutionalResult.status === "fulfilled" ? institutionalResult.value.data : null;
  const institutionalPct = numberFrom(institutional?.ownershipSummary?.SharesOutstandingPCT?.value);
  const summarizedSharesOutstanding = numberFrom(institutional?.ownershipSummary?.ShareoutstandingTotal?.value);
  const activeTotal = institutional?.activePositions?.rows?.find((row) => row.positions === "Total Institutional Shares");
  const holderRows = institutional?.holdingsTransactions?.table?.rows ?? [];
  const insiderRows = insiderResult.status === "fulfilled" ? insiderResult.value.data?.transactionTable?.table?.rows ?? [] : [];
  const insiders = aggregateInsiders(insiderRows);
  const insiderPurchases = insiderTransactions(insiderRows, "purchase");
  const insiderSales = insiderTransactions(insiderRows, "sale");
  const insiderOtherCount = insiderRows.filter((row) => insiderTransactionDirection(row.transactionType) === "other").length;
  const insiderSourceUrl = `https://www.nasdaq.com/market-activity/stocks/${ticker.toLowerCase()}/insider-activity`;
  const secInsiderSourceUrl = `https://www.sec.gov/edgar/search/#/ciks=${cik}&category=custom&forms=3%2C4%2C5`;

  return Response.json({
    ticker,
    available: true,
    sharesOutstanding: shares ? { value: shares.val, asOf: shares.end, filedAt: shares.filed, form: shares.form, sourceLabel: `SEC ${shares.form}`, sourceUrl: shares.sourceUrl || secFilingUrl(cik, shares.accn), sourceTaxonomy: shares.taxonomy, sourceConcept: shares.concept }
      : summarizedSharesOutstanding !== null ? { value: summarizedSharesOutstanding * 1_000_000, asOf: holderRows.map((row) => row.date ?? "").sort().at(-1) ?? "", filedAt: "", form: "13F-derived", sourceLabel: "Public ownership summary", sourceUrl: `https://www.nasdaq.com/market-activity/stocks/${ticker.toLowerCase()}/institutional-holdings` }
        : null,
    sharesOutstandingReason: shares || summarizedSharesOutstanding !== null ? null : directFilingChecked
      ? "The latest SEC filing does not expose a standardized point-in-time total; no weighted-average or estimated share count was substituted."
      : "A standardized point-in-time SEC share count is not currently available.",
    publicTradableFloat: publicFloat ? { value: publicFloat.val, unit: "USD", asOf: publicFloat.end, filedAt: publicFloat.filed, form: publicFloat.form, sourceUrl: secFilingUrl(cik, publicFloat.accn), methodology: "SEC-reported market value of voting and non-voting common equity held by non-affiliates." } : null,
    institutional: institutionalPct === null ? null : {
      percent: institutionalPct,
      shares: numberFrom(activeTotal?.shares) ?? numberFrom(institutional?.holdingsTransactions?.sharesHeld),
      holders: numberFrom(activeTotal?.holders) ?? numberFrom(institutional?.holdingsTransactions?.institutionalHolders),
      asOf: holderRows.map((row) => row.date ?? "").sort().at(-1) ?? "",
      sourceUrl: `https://www.nasdaq.com/market-activity/stocks/${ticker.toLowerCase()}/institutional-holdings`,
      topHolders: holderRows.slice(0, 12).map((row) => ({ name: row.ownerName ?? "Institutional manager", date: row.date ?? "", shares: numberFrom(row.sharesHeld), change: numberFrom(row.sharesChange), changePercent: row.sharesChangePCT ?? "", marketValue: row.marketValue ?? "", sourceUrl: row.url ? new URL(row.url, "https://www.nasdaq.com").toString() : "" })),
    },
    estimatedRetailOther: institutionalPct === null ? null : { percent: Math.max(0, 100 - institutionalPct), methodology: "Residual after reported institutional ownership. It includes retail holders, insiders, small institutions below Form 13F thresholds, and other unclassified holders; it is not a directly reported SEC retail figure." },
    insiderTransactions: {
      purchases: insiderPurchases,
      sales: insiderSales,
      otherCount: insiderOtherCount,
      transactionRecordsReviewed: insiderRows.length,
      availableRecords: numberFrom(insiderResult.status === "fulfilled" ? insiderResult.value.data?.transactionTable?.totalRecords : undefined),
      sourceUrl: insiderSourceUrl,
      secSourceUrl: secInsiderSourceUrl,
      methodology: "Purchases and sales are separated only when the public insider ledger explicitly labels the transaction as a buy, purchase, sell, or sale. Awards, grants, option exercises, gifts, tax withholding, conversions, and unclassified ownership filings remain outside both totals.",
    },
    insiders: {
      people: insiders,
      displayedPeople: insiders.length,
      transactionRecordsReviewed: insiderRows.length,
      availableRecords: numberFrom(insiderResult.status === "fulfilled" ? insiderResult.value.data?.transactionTable?.totalRecords : undefined),
      sourceUrl: insiderSourceUrl,
      secSourceUrl: secInsiderSourceUrl,
    },
    sourceStatus: { sec: secResult.status === "fulfilled", secDirectFiling: directFilingChecked, institutional13F: institutionalResult.status === "fulfilled", insiderFilings: insiderResult.status === "fulfilled" },
    updatedAt: new Date().toISOString(),
  }, { headers: { "cache-control": "public, max-age=300, stale-while-revalidate=3600" } });
}
