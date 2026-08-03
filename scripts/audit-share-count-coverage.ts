import { featuredDossiers } from "../app/data/featuredDossiers";
import { getSecCompany } from "../app/data/secCompanies.generated";
import { latestShareFiling, latestSharesOutstanding, shareFactDefinitions, sharesFromInlineFiling, type SecCompanyFacts, type SecSubmissions } from "../app/data/secShareFacts";

const tickers = Object.keys(featuredDossiers).sort();
const results: Array<{ ticker: string; status: "covered" | "missing" | "error"; concept?: string; error?: string }> = [];

async function inspectTicker(ticker: string) {
  const company = getSecCompany(ticker);
  if (!company) return { ticker, status: "error" as const, error: "No verified CIK" };

  const response = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${company.cik}.json`, {
    headers: { accept: "application/json", "user-agent": "LearnWhatYouOwn/1.0 research@learnwhatyouown.com" },
  });
  if (!response.ok) return { ticker, status: "error" as const, error: `SEC ${response.status}` };
  const payload = await response.json() as SecCompanyFacts;
  const standardized = latestSharesOutstanding(payload);
  if (standardized) return { ticker, status: "covered" as const, concept: `${standardized.taxonomy}:${standardized.concept}` };

  const submissionsResponse = await fetch(`https://data.sec.gov/submissions/CIK${company.cik}.json`, {
    headers: { accept: "application/json", "user-agent": "LearnWhatYouOwn/1.0 research@learnwhatyouown.com" },
  });
  if (!submissionsResponse.ok) return { ticker, status: "error" as const, error: `SEC submissions ${submissionsResponse.status}` };
  const filing = latestShareFiling(company.cik, await submissionsResponse.json() as SecSubmissions);
  if (filing) {
    const filingResponse = await fetch(filing.sourceUrl, { headers: { accept: "text/html", "user-agent": "LearnWhatYouOwn/1.0 research@learnwhatyouown.com" } });
    if (!filingResponse.ok) return { ticker, status: "error" as const, error: `SEC filing ${filingResponse.status}` };
    const direct = sharesFromInlineFiling(await filingResponse.text(), filing);
    if (direct) return { ticker, status: "covered" as const, concept: "direct-filing:dei:EntityCommonStockSharesOutstanding" };
  }
  return { ticker, status: "missing" as const };
}

for (let index = 0; index < tickers.length; index += 6) {
  const batch = tickers.slice(index, index + 6);
  results.push(...await Promise.all(batch.map(async (ticker) => {
    try {
      return await inspectTicker(ticker);
    } catch (error) {
      return { ticker, status: "error" as const, error: error instanceof Error ? error.message : "Unknown error" };
    }
  })));
  process.stdout.write(`\rAudited ${Math.min(index + batch.length, tickers.length)}/${tickers.length}`);
}

const covered = results.filter((result) => result.status === "covered");
const missing = results.filter((result) => result.status === "missing").map((result) => result.ticker);
const errors = results.filter((result) => result.status === "error");
const coverageByConcept = Object.fromEntries([...shareFactDefinitions.map(([taxonomy, concept]) => `${taxonomy}:${concept}`), "direct-filing:dei:EntityCommonStockSharesOutstanding"].map((key) => {
  return [key, covered.filter((result) => result.concept === key).length];
}));

process.stdout.write("\n");
console.log(JSON.stringify({
  dossiersAudited: tickers.length,
  covered: covered.length,
  missingStandardizedShareFact: missing,
  requestErrors: errors,
  coverageByConcept,
}, null, 2));

if (errors.length) process.exitCode = 1;
