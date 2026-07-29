import { companySlug, sp500AsOf, sp500Companies, sp500SourceUrl, tickerFromSlug } from "./sp500";
import { russell1000AsOf, russell1000Companies, russell1000SourceUrl } from "./russell1000";
import { russell2000AsOf, russell2000Companies, russell2000SourceUrl } from "./russell2000";
import { nasdaq100AsOf, nasdaq100Companies, nasdaq100SourceUrl } from "./nasdaq100";

export type IndexMembership = "S&P 500" | "Russell 2000" | "Russell 3000" | "Nasdaq-100 (QQQ)" | "Extended Coverage";

export type ResearchCompany = {
  ticker: string;
  name: string;
  sector: string;
  exchange: string;
  memberships: IndexMembership[];
  indexWeights: Partial<Record<IndexMembership, number>>;
};

const companies = new Map<string, ResearchCompany>();

function addCompany(
  company: { ticker: string; name: string; sector: string; exchange: string; weight: number },
  memberships: IndexMembership[],
) {
  const existing = companies.get(company.ticker);
  if (existing) {
    for (const membership of memberships) {
      if (!existing.memberships.includes(membership)) existing.memberships.push(membership);
      existing.indexWeights[membership] = company.weight;
    }
    if (!existing.sector && company.sector) existing.sector = company.sector;
    return;
  }

  companies.set(company.ticker, {
    ticker: company.ticker,
    name: company.name,
    sector: company.sector || "Not classified",
    exchange: company.exchange,
    memberships: [...memberships],
    indexWeights: Object.fromEntries(memberships.map((membership) => [membership, company.weight])),
  });
}

for (const company of sp500Companies) addCompany(company, ["S&P 500"]);
for (const company of russell1000Companies) addCompany(company, ["Russell 3000"]);
for (const company of russell2000Companies) addCompany(company, ["Russell 2000", "Russell 3000"]);
for (const company of nasdaq100Companies) addCompany(company, ["Nasdaq-100 (QQQ)"]);
addCompany({
  ticker: "BB",
  name: "BLACKBERRY LIMITED",
  sector: "Information Technology",
  exchange: "NYSE",
  weight: 0,
}, ["Extended Coverage"]);

export const researchUniverse = [...companies.values()];
export const researchUniverseAsOf = `${sp500AsOf}–${nasdaq100AsOf}`;
export const universeSources = [
  { label: "S&P 500", url: sp500SourceUrl },
  { label: "Russell 1000", url: russell1000SourceUrl },
  { label: "Russell 2000", url: russell2000SourceUrl },
  { label: "Nasdaq-100", url: nasdaq100SourceUrl },
];

export const indexCounts = {
  "S&P 500": sp500Companies.length,
  "Russell 2000": russell2000Companies.length,
  "Russell 3000": russell1000Companies.length + russell2000Companies.length,
  "Nasdaq-100 (QQQ)": nasdaq100Companies.length,
};

export const sourceDates = { sp500AsOf, russell1000AsOf, russell2000AsOf, nasdaq100AsOf };

export { companySlug, tickerFromSlug };
