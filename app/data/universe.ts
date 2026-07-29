import { companySlug, sp500AsOf, sp500Companies, sp500SourceUrl, tickerFromSlug } from "./sp500";
import { russell2000AsOf, russell2000Companies, russell2000SourceUrl } from "./russell2000";

export type IndexMembership = "S&P 500" | "Russell 2000";

export type ResearchCompany = {
  ticker: string;
  name: string;
  sector: string;
  exchange: string;
  memberships: IndexMembership[];
  indexWeights: Partial<Record<IndexMembership, number>>;
};

const companies = new Map<string, ResearchCompany>();

for (const company of sp500Companies) {
  companies.set(company.ticker, {
    ticker: company.ticker,
    name: company.name,
    sector: company.sector,
    exchange: company.exchange,
    memberships: ["S&P 500"],
    indexWeights: { "S&P 500": company.weight },
  });
}

for (const company of russell2000Companies) {
  const existing = companies.get(company.ticker);
  if (existing) {
    existing.memberships.push("Russell 2000");
    existing.indexWeights["Russell 2000"] = company.weight;
  } else {
    companies.set(company.ticker, {
      ticker: company.ticker,
      name: company.name,
      sector: company.sector,
      exchange: company.exchange,
      memberships: ["Russell 2000"],
      indexWeights: { "Russell 2000": company.weight },
    });
  }
}

export const researchUniverse = [...companies.values()];
export const researchUniverseAsOf = sp500AsOf === russell2000AsOf ? sp500AsOf : `${sp500AsOf} / ${russell2000AsOf}`;
export const universeSources = [
  { label: "S&P 500 source", url: sp500SourceUrl },
  { label: "Russell 2000 source", url: russell2000SourceUrl },
];

export { companySlug, tickerFromSlug };
