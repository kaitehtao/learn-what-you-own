import { env } from "cloudflare:workers";
import { ensureInsiderActivitySchema } from "../../db/runtimeSchema";
import { getSecCompany } from "./secCompanies.generated";
import { parseSecOwnershipXml, type SecOwnershipFiling } from "./secOwnership";
import { researchUniverse, type ResearchCompany } from "./universe";

const SEC_ORIGIN = "https://www.sec.gov";
const SEC_USER_AGENT = "LearnWhatYouOwn research@learnwhatyouown.com";
const FILING_BATCH_SIZE = 8;
// Eight requests per 1.05 seconds stays below the SEC's published fair-access
// ceiling. Four scheduled runs can therefore process up to 960 ownership
// documents per day while retaining a resumable offset for unusually busy days.
const FILINGS_PER_REFRESH = 240;

export type InsiderActivityPeriod = "month" | "quarter" | "year";

export type SecInsiderActivityRow = {
  id: string;
  ticker: string;
  companyName: string;
  form: string;
  filingDate: string;
  transactionDate: string;
  insiderName: string;
  insiderRelation: string;
  transactionType: string;
  securityTitle: string;
  shares: number;
  price: number | null;
  reportedValue: number | null;
  sharesHeld: number | null;
  directOrIndirect: string;
  sourceUrl: string;
};

export type SecDailyOwnershipIndexEntry = {
  cik: string;
  reportingName: string;
  form: string;
  filingDate: string;
  fileName: string;
};

type ImportState = {
  index_date: string;
  status: string;
  next_offset: number;
  total_filings: number;
  failed_filings: number;
};

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function quarterForMonth(month: number) {
  return Math.floor(month / 3) + 1;
}

function dailyIndexUrl(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00Z`);
  const year = date.getUTCFullYear();
  return `${SEC_ORIGIN}/Archives/edgar/daily-index/${year}/QTR${quarterForMonth(date.getUTCMonth())}/master.${dateValue.replaceAll("-", "")}.idx`;
}

function normalizedTicker(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizedCik(value: string) {
  return value.replace(/^0+/, "");
}

function universeLookups() {
  const byTicker = new Map<string, ResearchCompany>();
  const byCik = new Map<string, ResearchCompany>();
  for (const company of researchUniverse) {
    byTicker.set(normalizedTicker(company.ticker), company);
    const secCompany = getSecCompany(company.ticker);
    if (secCompany?.cik) byCik.set(normalizedCik(secCompany.cik), company);
  }
  return { byTicker, byCik };
}

export function parseSecDailyOwnershipIndex(payload: string) {
  const separator = payload.indexOf("--------------------------------------------------------------------------------");
  const body = separator >= 0 ? payload.slice(separator + 80) : payload;
  const results: SecDailyOwnershipIndexEntry[] = [];
  for (const line of body.split(/\r?\n/)) {
    const [cik, reportingName, form, filingDate, fileName] = line.split("|").map((value) => value?.trim() ?? "");
    if (!/^(3|3\/A|4|4\/A|5|5\/A)$/.test(form) || !cik || !filingDate || !fileName) continue;
    results.push({ cik, reportingName, form, filingDate, fileName });
  }
  return results;
}

async function fetchSecText(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "text/plain, application/xml, text/xml;q=0.9, */*;q=0.5",
      "user-agent": SEC_USER_AGENT,
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`SEC request returned ${response.status} for ${url}`);
  return response.text();
}

async function chooseIndexDate() {
  const history = await env.DB.prepare("SELECT index_date, status, next_offset, total_filings, failed_filings FROM sec_ownership_index_imports WHERE index_date >= date('now','-370 days')").all<ImportState>();
  const imported = new Map((history.results ?? []).map((row) => [row.index_date, row]));
  const cursor = new Date();
  cursor.setUTCDate(cursor.getUTCDate() - 1);
  cursor.setUTCHours(12, 0, 0, 0);
  for (let days = 0; days < 365; days += 1) {
    const weekday = cursor.getUTCDay();
    const candidate = isoDate(cursor);
    const state = imported.get(candidate);
    if (weekday !== 0 && weekday !== 6 && (!state || !["complete", "no_index"].includes(state.status))) {
      return { date: candidate, state };
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return null;
}

function accessionFromFileName(fileName: string) {
  return fileName.split("/").at(-1)?.replace(/\.txt$/i, "") ?? fileName;
}

async function persistTransactions(entry: SecDailyOwnershipIndexEntry, payload: string) {
  const { byTicker, byCik } = universeLookups();
  const accession = accessionFromFileName(entry.fileName);
  const sourceUrl = `${SEC_ORIGIN}/Archives/${entry.fileName}`;
  const filing: SecOwnershipFiling = {
    form: entry.form,
    accessionNumber: accession,
    primaryDocument: entry.fileName.split("/").at(-1) ?? "",
    filingDate: entry.filingDate,
    reportDate: entry.filingDate,
    sourceUrl,
    rawXmlUrl: sourceUrl,
  };
  const parsed = parseSecOwnershipXml(payload, filing);
  const company = byTicker.get(normalizedTicker(parsed.issuerTradingSymbol)) ?? byCik.get(normalizedCik(parsed.issuerCik));
  if (!company) return { matched: false, imported: 0 };
  const rankedTransactions = parsed.transactions.filter((transaction) => transaction.direction === "purchase" || transaction.direction === "sale");
  if (!rankedTransactions.length) return { matched: true, imported: 0 };

  const statements = rankedTransactions.map((transaction, index) => env.DB.prepare(`INSERT INTO sec_insider_transactions (
      id,ticker,company_name,cik,accession_number,form,filing_date,transaction_date,insider_name,insider_relation,
      transaction_code,direction,transaction_type,security_title,shares,price,reported_value,shares_held,direct_or_indirect,source_url,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      filing_date=excluded.filing_date,transaction_date=excluded.transaction_date,insider_name=excluded.insider_name,
      insider_relation=excluded.insider_relation,transaction_type=excluded.transaction_type,security_title=excluded.security_title,
      shares=excluded.shares,price=excluded.price,reported_value=excluded.reported_value,shares_held=excluded.shares_held,
      direct_or_indirect=excluded.direct_or_indirect,source_url=excluded.source_url,updated_at=CURRENT_TIMESTAMP`).bind(
        `${company.ticker}:${accession}:${index}`,
        company.ticker,
        company.name,
        parsed.issuerCik || getSecCompany(company.ticker)?.cik || "",
        accession,
        entry.form,
        entry.filingDate,
        transaction.date,
        transaction.name,
        transaction.relation,
        transaction.transactionCode,
        transaction.direction,
        transaction.transactionType,
        transaction.securityTitle,
        transaction.shares,
        transaction.price,
        transaction.value,
        transaction.sharesHeld,
        transaction.directOrIndirect,
        transaction.sourceUrl,
      ));
  await env.DB.batch(statements);
  return { matched: true, imported: statements.length };
}

export async function refreshSecInsiderActivityBatch() {
  await ensureInsiderActivitySchema();
  const candidate = await chooseIndexDate();
  if (!candidate) return { status: "current", processedFilings: 0, importedTransactions: 0 };
  const indexUrl = dailyIndexUrl(candidate.date);
  const indexPayload = await fetchSecText(indexUrl);
  if (indexPayload === null) {
    await env.DB.prepare(`INSERT INTO sec_ownership_index_imports (index_date,status,last_attempted_at,last_success_at,index_url)
      VALUES (?,'no_index',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?)
      ON CONFLICT(index_date) DO UPDATE SET status='no_index',last_attempted_at=CURRENT_TIMESTAMP,last_success_at=CURRENT_TIMESTAMP,index_url=excluded.index_url`).bind(candidate.date, indexUrl).run();
    return { status: "no_index", indexDate: candidate.date, processedFilings: 0, importedTransactions: 0 };
  }

  const entries = parseSecDailyOwnershipIndex(indexPayload);
  const offset = candidate.state?.next_offset ?? 0;
  const batch = entries.slice(offset, offset + FILINGS_PER_REFRESH);
  await env.DB.prepare(`INSERT INTO sec_ownership_index_imports (index_date,status,next_offset,total_filings,last_attempted_at,index_url)
    VALUES (?,'processing',?,?,CURRENT_TIMESTAMP,?)
    ON CONFLICT(index_date) DO UPDATE SET status='processing',total_filings=excluded.total_filings,last_attempted_at=CURRENT_TIMESTAMP,index_url=excluded.index_url`).bind(candidate.date, offset, entries.length, indexUrl).run();

  let importedTransactions = 0;
  let matchedCompanies = 0;
  let failedFilings = 0;
  for (let start = 0; start < batch.length; start += FILING_BATCH_SIZE) {
    const group = batch.slice(start, start + FILING_BATCH_SIZE);
    const results = await Promise.allSettled(group.map(async (entry) => {
      const url = `${SEC_ORIGIN}/Archives/${entry.fileName}`;
      const payload = await fetchSecText(url);
      if (!payload) throw new Error(`SEC filing not found: ${url}`);
      return persistTransactions(entry, payload);
    }));
    for (const result of results) {
      if (result.status === "rejected") failedFilings += 1;
      else {
        if (result.value.matched) matchedCompanies += 1;
        importedTransactions += result.value.imported;
      }
    }
    if (start + FILING_BATCH_SIZE < batch.length) await sleep(1_050);
  }

  const nextOffset = offset + batch.length;
  const complete = nextOffset >= entries.length;
  await env.DB.prepare(`UPDATE sec_ownership_index_imports SET status=?,next_offset=?,total_filings=?,imported_transactions=imported_transactions+?,failed_filings=failed_filings+?,last_attempted_at=CURRENT_TIMESTAMP,last_success_at=CURRENT_TIMESTAMP,last_error=? WHERE index_date=?`)
    .bind(complete ? "complete" : "processing", nextOffset, entries.length, importedTransactions, failedFilings, failedFilings ? `${failedFilings} filing(s) could not be parsed in the latest batch.` : "", candidate.date).run();
  return {
    status: complete ? "complete" : "processing",
    indexDate: candidate.date,
    indexUrl,
    processedFilings: batch.length,
    matchedCompanies,
    importedTransactions,
    failedFilings,
    nextOffset,
    totalFilings: entries.length,
  };
}

const PERIOD_DAYS: Record<InsiderActivityPeriod, number> = { month: 30, quarter: 90, year: 365 };

export async function getSecInsiderActivity(period: InsiderActivityPeriod) {
  await ensureInsiderActivitySchema();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - PERIOD_DAYS[period]);
  const startDate = isoDate(start);
  const query = `SELECT id,ticker,company_name AS companyName,form,filing_date AS filingDate,transaction_date AS transactionDate,
    insider_name AS insiderName,insider_relation AS insiderRelation,transaction_type AS transactionType,security_title AS securityTitle,
    shares,price,reported_value AS reportedValue,shares_held AS sharesHeld,direct_or_indirect AS directOrIndirect,source_url AS sourceUrl
    FROM sec_insider_transactions WHERE direction=? AND transaction_date>=?
    ORDER BY COALESCE(reported_value,0) DESC,transaction_date DESC LIMIT 100`;
  const [purchases, sales, summary, coverage] = await Promise.all([
    env.DB.prepare(query).bind("purchase", startDate).all<SecInsiderActivityRow>(),
    env.DB.prepare(query).bind("sale", startDate).all<SecInsiderActivityRow>(),
    env.DB.prepare(`SELECT COUNT(*) AS transactionCount,COUNT(DISTINCT ticker) AS companyCount,
      SUM(CASE WHEN direction='purchase' THEN COALESCE(reported_value,0) ELSE 0 END) AS purchaseValue,
      SUM(CASE WHEN direction='sale' THEN COALESCE(reported_value,0) ELSE 0 END) AS saleValue,
      MAX(updated_at) AS lastUpdated FROM sec_insider_transactions WHERE transaction_date>=?`).bind(startDate).first<Record<string, number | string | null>>(),
    env.DB.prepare(`SELECT MIN(CASE WHEN status IN ('complete','processing') THEN index_date END) AS coverageStart,
      MAX(CASE WHEN status IN ('complete','processing') THEN index_date END) AS coverageEnd,
      SUM(CASE WHEN status='complete' THEN 1 ELSE 0 END) AS completedDays,
      SUM(CASE WHEN status='processing' THEN 1 ELSE 0 END) AS processingDays,
      MAX(last_success_at) AS lastRefresh FROM sec_ownership_index_imports`).first<Record<string, number | string | null>>(),
  ]);
  return {
    period,
    periodStart: startDate,
    purchases: purchases.results ?? [],
    sales: sales.results ?? [],
    summary: summary ?? {},
    coverage: coverage ?? {},
    methodology: "SEC Forms 3, 4, and 5; rankings include transaction codes P and S only.",
  };
}
