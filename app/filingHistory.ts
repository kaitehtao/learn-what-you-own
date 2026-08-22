export type FilingHistoryFact = {
  metricKey: string;
  fiscalPeriod: string | null;
  periodStart?: string | null;
  periodEnd: string;
};

function durationDays(fact: FilingHistoryFact) {
  if (!fact.periodStart) return null;
  return (Date.parse(`${fact.periodEnd}T00:00:00Z`) - Date.parse(`${fact.periodStart}T00:00:00Z`)) / 86_400_000;
}

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

export function filingPeriodLabel(fact: FilingHistoryFact) {
  const period = fact.fiscalPeriod ?? "Filed period";
  const days = durationDays(fact);
  if (days === null) return `${period} · as of ${fact.periodEnd}`;
  if (period === "FY" || days > 310) return `${period} · year ended ${fact.periodEnd}`;
  if (days <= 120) return `${period} · three months ended ${fact.periodEnd}`;
  if (days <= 220) return `${period} YTD · six months ended ${fact.periodEnd}`;
  return `${period} YTD · nine months ended ${fact.periodEnd}`;
}
