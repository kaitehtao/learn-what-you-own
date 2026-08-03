import { findCatalogCompany } from "../../../db/companyCatalog";
import { getSecCompany } from "../../data/secCompanies.generated";
import { aggregateSecReportingInsiders, parseSecOwnershipXml, recentOwnershipFilings, type ParsedSecOwnershipFiling, type SecInsiderTransaction } from "../../data/secOwnership";
import { latestProxyFiling, parseSecProxyOwnershipHtml } from "../../data/secProxyOwnership";
import { latestShareFiling, latestSharesOutstanding, sharesFromInlineFiling, type SecCompanyFacts, type SecSubmissions } from "../../data/secShareFacts";
import { researchUniverse } from "../../data/universe";

export const dynamic = "force-dynamic";

type InstitutionalRow = { ownerName?: string; date?: string; sharesHeld?: string; sharesChange?: string; sharesChangePCT?: string; marketValue?: string; url?: string };
type NasdaqInstitutional = { data?: { ownershipSummary?: { SharesOutstandingPCT?: { value?: string }; ShareoutstandingTotal?: { value?: string } }; activePositions?: { rows?: Array<{ positions?: string; holders?: string; shares?: string }> }; holdingsTransactions?: { institutionalHolders?: string; sharesHeld?: string; table?: { rows?: InstitutionalRow[] } } } };

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

async function fetchText(url: string, userAgent: string, timeoutMs = 12_000, accept = "text/html,application/xhtml+xml"): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { accept, "user-agent": userAgent }, signal: controller.signal });
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

function publicInsiderTransaction(transaction: SecInsiderTransaction) {
  return {
    name: transaction.name,
    relation: transaction.relation,
    date: transaction.date,
    transactionCode: transaction.transactionCode,
    transactionType: transaction.transactionType,
    securityTitle: transaction.securityTitle,
    shares: transaction.shares,
    price: transaction.price,
    value: transaction.value,
    sharesHeld: transaction.sharesHeld,
    directOrIndirect: transaction.directOrIndirect,
    sourceUrl: transaction.sourceUrl,
  };
}

async function secOwnershipDocuments(cik: string, submissions: SecSubmissions, userAgent: string) {
  const { filings, availableRecords } = recentOwnershipFilings(cik, submissions, 32);
  const parsed: ParsedSecOwnershipFiling[] = [];
  let failedFilings = 0;
  // Stay below the SEC's published 10-requests-per-second ceiling while
  // avoiding a long serial wait on first uncached dossier access.
  const batchSize = 8;
  for (let index = 0; index < filings.length; index += batchSize) {
    const batch = filings.slice(index, index + batchSize);
    const results = await Promise.allSettled(batch.map(async (filing) => {
      const xml = await fetchText(filing.rawXmlUrl, userAgent, 10_000, "application/xml,text/xml,text/plain,*/*");
      if (!/<ownershipDocument\b/i.test(xml)) throw new Error("SEC ownership XML was not returned.");
      return parseSecOwnershipXml(xml, filing);
    }));
    for (const result of results) {
      if (result.status === "fulfilled") parsed.push(result.value);
      else failedFilings += 1;
    }
    if (index + batchSize < filings.length) await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  return { parsed, availableRecords, selectedFilings: filings.length, failedFilings };
}

async function secProxyOwnershipDocument(cik: string, submissions: SecSubmissions, userAgent: string) {
  const filing = latestProxyFiling(cik, submissions);
  if (!filing) return { filing: null, parsed: null };
  const html = await fetchText(filing.sourceUrl, userAgent, 15_000);
  return { filing, parsed: parseSecProxyOwnershipHtml(html, filing) };
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
  const secSubmissionsUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;
  const nasdaqInstitutionalUrl = `https://api.nasdaq.com/api/company/${encodeURIComponent(ticker)}/institutional-holdings?limit=25&type=TOTAL&sortColumn=marketValue&sortOrder=DESC`;
  const secAgent = "LearnWhatYouOwn/1.0 research@learnwhatyouown.com";
  const browserAgent = "Mozilla/5.0 (compatible; LearnWhatYouOwn/1.0; +https://learnwhatyouown.com)";
  const nasdaqHeaders = { "accept-language": "en-US,en;q=0.9", referer: "https://www.nasdaq.com/", origin: "https://www.nasdaq.com" };
  const [secResult, submissionsResult, institutionalResult] = await Promise.allSettled([
    fetchJson<SecCompanyFacts>(secSourceUrl, secAgent),
    fetchJson<SecSubmissions>(secSubmissionsUrl, secAgent),
    fetchJson<NasdaqInstitutional>(nasdaqInstitutionalUrl, browserAgent, 15_000, nasdaqHeaders),
  ]);

  const sec = secResult.status === "fulfilled" ? secResult.value : null;
  const submissions = submissionsResult.status === "fulfilled" ? submissionsResult.value : null;
  let shares = sec ? latestSharesOutstanding(sec) : null;
  let directFilingChecked = false;
  if (!shares && submissions) {
    try {
      const filing = latestShareFiling(cik, submissions);
      if (filing) {
        directFilingChecked = true;
        shares = sharesFromInlineFiling(await fetchText(filing.sourceUrl, secAgent), filing);
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
  const secInsiderSourceUrl = `https://www.sec.gov/edgar/search/#/ciks=${cik}&category=custom&forms=3%2C4%2C5`;
  let ownership: Awaited<ReturnType<typeof secOwnershipDocuments>> | null = null;
  let proxyOwnership: Awaited<ReturnType<typeof secProxyOwnershipDocument>> | null = null;
  let ownershipError = "";
  let proxyOwnershipError = "";
  if (submissions) {
    const [ownershipResult, proxyResult] = await Promise.allSettled([
      secOwnershipDocuments(cik, submissions, secAgent),
      secProxyOwnershipDocument(cik, submissions, secAgent),
    ]);
    if (ownershipResult.status === "fulfilled") ownership = ownershipResult.value;
    else {
      ownershipError = ownershipResult.reason instanceof Error ? ownershipResult.reason.message : "SEC ownership filings could not be retrieved.";
      console.error(`Direct SEC ownership import failed for ${ticker}.`, ownershipResult.reason);
    }
    if (proxyResult.status === "fulfilled") proxyOwnership = proxyResult.value;
    else {
      proxyOwnershipError = proxyResult.reason instanceof Error ? proxyResult.reason.message : "The latest SEC proxy could not be retrieved.";
      console.error(`Direct SEC proxy ownership import failed for ${ticker}.`, proxyResult.reason);
    }
  } else {
    ownershipError = "SEC submissions are temporarily unavailable.";
    proxyOwnershipError = "SEC submissions are temporarily unavailable.";
  }
  const parsedOwnership = ownership?.parsed ?? [];
  const insiderTransactions = parsedOwnership.flatMap((filing) => filing.transactions)
    .sort((left, right) => right.date.localeCompare(left.date));
  const insiderPurchases = insiderTransactions.filter((transaction) => transaction.direction === "purchase").map(publicInsiderTransaction);
  const insiderSales = insiderTransactions.filter((transaction) => transaction.direction === "sale").map(publicInsiderTransaction);
  const insiderOtherCount = insiderTransactions.filter((transaction) => transaction.direction === "other").length;
  const insiders = aggregateSecReportingInsiders(parsedOwnership);
  const availableOwnershipRecords = ownership?.availableRecords ?? 0;
  const ownershipStatus = ownershipError || (availableOwnershipRecords > 0 && !parsedOwnership.length)
    ? "unavailable"
    : availableOwnershipRecords === 0 ? "no_filings" : "available";
  const ownershipMessage = ownershipStatus === "unavailable"
    ? "SEC ownership filings are temporarily unavailable. This does not mean the company has no insider activity."
    : ownershipStatus === "no_filings"
      ? "The SEC submissions index returned no recent Forms 3, 4, or 5 for this issuer."
      : `Parsed ${parsedOwnership.length} recent SEC ownership filings directly from EDGAR.`;
  const proxyFiling = proxyOwnership?.filing ?? null;
  const parsedProxy = proxyOwnership?.parsed ?? null;
  const proxyStatus = proxyOwnershipError
    ? "unavailable"
    : !proxyFiling ? "no_proxy"
      : parsedProxy?.people.length ? "available" : "awaiting_extraction";

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
      transactionRecordsReviewed: insiderTransactions.length,
      filingsReviewed: parsedOwnership.length,
      availableRecords: availableOwnershipRecords,
      failedFilings: ownership?.failedFilings ?? 0,
      latestFilingDate: parsedOwnership.map((filing) => filing.filingDate).filter(Boolean).sort().at(-1) ?? "",
      sourceUrl: secInsiderSourceUrl,
      secSourceUrl: secInsiderSourceUrl,
      methodology: "SEC Forms 3, 4, and 5 are parsed directly from EDGAR. Transaction code P is classified as a purchase and S as a sale. Awards, grants, option exercises, gifts, tax withholding, conversions, and other SEC codes remain outside both totals but are counted as other activity.",
    },
    insiders: {
      people: insiders,
      displayedPeople: insiders.length,
      transactionRecordsReviewed: insiderTransactions.length,
      filingsReviewed: parsedOwnership.length,
      availableRecords: availableOwnershipRecords,
      sourceUrl: secInsiderSourceUrl,
      secSourceUrl: secInsiderSourceUrl,
    },
    beneficialOwnership: {
      status: proxyStatus,
      form: proxyFiling?.form ?? "",
      filingDate: proxyFiling?.filingDate ?? "",
      asOfDate: parsedProxy?.asOfDate ?? proxyFiling?.reportDate ?? "",
      sourceUrl: proxyFiling?.sourceUrl ?? `https://www.sec.gov/edgar/search/#/ciks=${cik}&category=custom&forms=DEF%2014A%2CDEF%2014C`,
      securityClasses: parsedProxy?.securityClasses ?? [],
      people: parsedProxy?.people ?? [],
      methodology: "The latest definitive SEC proxy statement is parsed as a dated beneficial-ownership snapshot. It is separate from Forms 3, 4, and 5 transaction activity and should not be treated as a live position after the proxy's stated ownership date.",
      error: proxyOwnershipError || null,
    },
    insiderSource: { status: ownershipStatus, provider: "SEC EDGAR", message: ownershipMessage, error: ownershipError || null },
    sourceStatus: { sec: secResult.status === "fulfilled", secDirectFiling: directFilingChecked, institutional13F: institutionalResult.status === "fulfilled", insiderFilings: ownershipStatus !== "unavailable", proxyOwnership: proxyStatus !== "unavailable" },
    updatedAt: new Date().toISOString(),
  }, { headers: { "cache-control": "public, max-age=1800, stale-while-revalidate=21600" } });
}
