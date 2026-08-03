export type FilingHistoryFact = {
  metricKey: string;
  fiscalPeriod: string | null;
  periodEnd: string;
};

function usesAnnualRevenueHistory(ticker: string, metricKey: string) {
  return ticker.toUpperCase() === "TSLA" && metricKey === "revenue";
}

export function selectDisplayedFact<T extends FilingHistoryFact>(ticker: string, metricKey: string, facts: T[]) {
  if (usesAnnualRevenueHistory(ticker, metricKey)) {
    return facts.find((fact) => fact.fiscalPeriod === "FY") ?? facts[0];
  }
  return facts[0];
}

export function selectComparableHistory<T extends FilingHistoryFact>(ticker: string, facts: T[], latest: T) {
  const comparable = facts.filter((fact) => fact.fiscalPeriod === latest.fiscalPeriod);
  const candidates = comparable.length > 1 ? comparable : facts;
  const limit = usesAnnualRevenueHistory(ticker, latest.metricKey) && latest.fiscalPeriod === "FY" ? 4 : 5;
  return candidates.slice(0, limit);
}

export function filingHistoryLabel(ticker: string, fact: FilingHistoryFact, fallback: string) {
  return usesAnnualRevenueHistory(ticker, fact.metricKey) && fact.fiscalPeriod === "FY" ? "Annual revenue" : fallback;
}
