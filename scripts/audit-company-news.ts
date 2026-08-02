import { featuredDossiers } from "../app/data/featuredDossiers";

type NewsItem = {
  category?: string;
  publishedAt: string;
  source: string;
  title: string;
  url: string;
};

type NewsResponse = {
  companyReleases: NewsItem[];
  officialSources: { source: "company" | "sec"; status: string; records: number; url: string | null }[];
  providers: string[];
  public: NewsItem[];
  secFilings: NewsItem[];
  unavailableProviders: string[];
};

type AuditRow = {
  ticker: string;
  passed: boolean;
  officialCount: number;
  officialStatus: string;
  newestOfficial: string;
  externalCount: number;
  externalProviders: string[];
  unavailableProviders: string[];
  issues: string[];
};

const baseUrl = process.env.AUDIT_BASE_URL || "http://localhost:3001";
const tickers = Object.keys(featuredDossiers).sort();
const releasePollution = /(?:SEC filing|Form 10-[KQ]|annual report|filing library)/i;
const externalPollution = /(?:business\s*wire|pr\s*newswire|globe\s*newswire|access\s*newswire|accesswire|newsfile|ein\s*presswire|palantir investor relations)/i;

async function auditTicker(ticker: string): Promise<AuditRow> {
  const issues: string[] = [];
  try {
    const response = await fetch(`${baseUrl}/api/company-news?ticker=${encodeURIComponent(ticker)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json() as NewsResponse;
    const companyHealth = payload.officialSources.find((source) => source.source === "company");
    const dated = payload.companyReleases
      .map((item) => ({ value: item.publishedAt, time: new Date(item.publishedAt).valueOf() }))
      .filter((item) => Number.isFinite(item.time))
      .sort((left, right) => right.time - left.time);
    const newestOfficial = dated[0]?.value ?? "";

    if (!companyHealth || companyHealth.status !== "working") issues.push(`official source ${companyHealth?.status ?? "missing"}`);
    if ((companyHealth?.records ?? 0) < 2) issues.push(`official archive returned ${companyHealth?.records ?? 0} records`);
    if (!newestOfficial) issues.push("official releases have no usable dates");
    if (payload.companyReleases.some((item) => releasePollution.test(`${item.title} ${item.category ?? ""}`))) issues.push("official release section contains filings or archive links");
    if (payload.public.some((item) => externalPollution.test(`${item.source} ${item.title}`))) issues.push("external section contains corporate PR distribution");
    if (payload.providers.length === 0 && payload.unavailableProviders.length === 0) issues.push("external provider status missing");
    if (payload.providers.length < 2) issues.push(`external coverage returned only ${payload.providers.length} independent index`);

    return {
      ticker,
      passed: issues.length === 0,
      officialCount: payload.companyReleases.length,
      officialStatus: companyHealth?.status ?? "missing",
      newestOfficial,
      externalCount: payload.public.length,
      externalProviders: payload.providers,
      unavailableProviders: payload.unavailableProviders,
      issues,
    };
  } catch (error) {
    return {
      ticker,
      passed: false,
      officialCount: 0,
      officialStatus: "request-failed",
      newestOfficial: "",
      externalCount: 0,
      externalProviders: [],
      unavailableProviders: [],
      issues: [error instanceof Error ? error.message : "request failed"],
    };
  }
}

const rows: AuditRow[] = [];
const concurrency = 6;
for (let index = 0; index < tickers.length; index += concurrency) {
  rows.push(...await Promise.all(tickers.slice(index, index + concurrency).map(auditTicker)));
}

const failures = rows.filter((row) => !row.passed);
console.log(JSON.stringify({
  audited: rows.length,
  passed: rows.length - failures.length,
  failed: failures.length,
  failures: failures.map((row) => ({ ticker: row.ticker, officialCount: row.officialCount, externalCount: row.externalCount, providers: row.externalProviders, issues: row.issues })),
}, null, 2));

if (failures.length) process.exitCode = 1;
