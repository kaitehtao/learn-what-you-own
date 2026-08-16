export type FilingChangeFact = {
  metricKey: string;
  label: string;
  value: number;
  unit: string;
  periodStart: string | null;
  periodEnd: string;
  fiscalYear: number | null;
  fiscalPeriod: string | null;
  form: string;
  filedAt: string;
  accessionNumber: string;
  sourceUrl: string;
};

export type FilingMetricComparison = {
  metricKey: string;
  label: string;
  unit: string;
  currentValue: number;
  currentPeriodEnd: string;
  currentSourceUrl: string;
  priorQuarterValue: number | null;
  priorQuarterPeriodEnd: string | null;
  priorQuarterSourceUrl: string | null;
  quarterOverQuarterPercent: number | null;
  priorYearValue: number | null;
  priorYearPeriodEnd: string | null;
  priorYearSourceUrl: string | null;
  yearOverYearPercent: number | null;
};

export type FilingChangePacket = {
  objectiveSummary: string;
  comparisons: FilingMetricComparison[];
  comparisonBasis: string;
};

const priorityMetrics = [
  "revenue", "gross_profit", "operating_income", "net_income", "eps_diluted",
  "operating_cash_flow", "capital_expenditures", "cash", "long_term_debt",
  "shares_outstanding", "diluted_shares", "stockholders_equity",
];

const instantMetrics = new Set([
  "cash", "total_assets", "current_assets", "total_liabilities", "current_liabilities",
  "stockholders_equity", "long_term_debt", "shares_outstanding",
]);

function metricRank(metricKey: string) {
  const index = priorityMetrics.indexOf(metricKey);
  return index === -1 ? priorityMetrics.length : index;
}

function percentChange(current: number, prior: number | null) {
  if (prior === null || prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

function comparableFiscalYear(left: FilingChangeFact, right: FilingChangeFact) {
  return left.fiscalYear !== null && right.fiscalYear !== null && left.fiscalYear === right.fiscalYear;
}

function daysBetween(later: string, earlier: string) {
  return (Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)) / 86_400_000;
}

function standaloneValue(fact: FilingChangeFact, facts: FilingChangeFact[]) {
  if (instantMetrics.has(fact.metricKey) || fact.fiscalPeriod === "Q1") return fact.value;
  const priorPeriod = fact.fiscalPeriod === "Q2" ? "Q1" : fact.fiscalPeriod === "Q3" ? "Q2" : fact.fiscalPeriod === "FY" ? "Q3" : null;
  if (!priorPeriod) return fact.value;
  const prior = facts
    .filter((candidate) => candidate.metricKey === fact.metricKey
      && candidate.fiscalPeriod === priorPeriod
      && comparableFiscalYear(candidate, fact)
      && candidate.periodEnd < fact.periodEnd)
    .sort((left, right) => right.periodEnd.localeCompare(left.periodEnd))[0];
  if (!prior) return fact.value;
  return fact.value - prior.value;
}

function formatValue(value: number, unit: string) {
  const absolute = Math.abs(value);
  const divisor = absolute >= 1e12 ? 1e12 : absolute >= 1e9 ? 1e9 : absolute >= 1e6 ? 1e6 : absolute >= 1e3 ? 1e3 : 1;
  const suffix = divisor === 1e12 ? "T" : divisor === 1e9 ? "B" : divisor === 1e6 ? "M" : divisor === 1e3 ? "K" : "";
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: divisor === 1 ? 2 : 1 }).format(absolute / divisor);
  const sign = value < 0 ? "−" : "";
  return unit.startsWith("USD") ? `${sign}$${formatted}${suffix}` : `${sign}${formatted}${suffix}`;
}

function changePhrase(value: number | null, period: "sequentially" | "year over year") {
  if (value === null) return "";
  const direction = value >= 0 ? "up" : "down";
  return `${direction} ${Math.abs(value).toFixed(1)}% ${period}`;
}

function sentence(comparison: FilingMetricComparison) {
  const changes = [
    changePhrase(comparison.quarterOverQuarterPercent, "sequentially"),
    changePhrase(comparison.yearOverYearPercent, "year over year"),
  ].filter(Boolean);
  return `${comparison.label} was ${formatValue(comparison.currentValue, comparison.unit)}${changes.length ? `, ${changes.join(" and ")}` : ""}.`;
}

export function buildFilingChangePacket(facts: FilingChangeFact[], accessionNumber: string): FilingChangePacket {
  const accessionFacts = facts.filter((fact) => fact.accessionNumber === accessionNumber);
  const latest = [...accessionFacts].sort((left, right) => right.periodEnd.localeCompare(left.periodEnd))[0];
  if (!latest) return { objectiveSummary: "", comparisons: [], comparisonBasis: "No normalized facts matched this accession." };

  const currentByMetric = new Map<string, FilingChangeFact>();
  for (const fact of accessionFacts
    .filter((candidate) => candidate.periodEnd === latest.periodEnd && candidate.fiscalPeriod === latest.fiscalPeriod)
    .sort((left, right) => metricRank(left.metricKey) - metricRank(right.metricKey))) {
    if (!currentByMetric.has(fact.metricKey)) currentByMetric.set(fact.metricKey, fact);
  }

  const comparisons = [...currentByMetric.values()].map((current): FilingMetricComparison => {
    const metricFacts = facts.filter((fact) => fact.metricKey === current.metricKey && fact.periodEnd < current.periodEnd);
    const currentStandalone = standaloneValue(current, facts);
    const priorQuarter = [...metricFacts]
      .sort((left, right) => right.periodEnd.localeCompare(left.periodEnd))
      .find((fact) => fact.periodEnd !== current.periodEnd) ?? null;
    const priorYear = [...metricFacts]
      .filter((fact) => fact.fiscalPeriod === current.fiscalPeriod && daysBetween(current.periodEnd, fact.periodEnd) >= 300 && daysBetween(current.periodEnd, fact.periodEnd) <= 430)
      .sort((left, right) => Math.abs(daysBetween(current.periodEnd, left.periodEnd) - 365) - Math.abs(daysBetween(current.periodEnd, right.periodEnd) - 365))[0] ?? null;
    const priorQuarterValue = priorQuarter ? standaloneValue(priorQuarter, facts) : null;
    const priorYearValue = priorYear ? standaloneValue(priorYear, facts) : null;
    return {
      metricKey: current.metricKey,
      label: current.label,
      unit: current.unit,
      currentValue: currentStandalone,
      currentPeriodEnd: current.periodEnd,
      currentSourceUrl: current.sourceUrl,
      priorQuarterValue,
      priorQuarterPeriodEnd: priorQuarter?.periodEnd ?? null,
      priorQuarterSourceUrl: priorQuarter?.sourceUrl ?? null,
      quarterOverQuarterPercent: current.fiscalPeriod === "FY" ? null : percentChange(currentStandalone, priorQuarterValue),
      priorYearValue,
      priorYearPeriodEnd: priorYear?.periodEnd ?? null,
      priorYearSourceUrl: priorYear?.sourceUrl ?? null,
      yearOverYearPercent: percentChange(currentStandalone, priorYearValue),
    };
  }).filter((comparison) => Number.isFinite(comparison.currentValue)).slice(0, 12);

  const highlighted = comparisons
    .filter((comparison) => comparison.quarterOverQuarterPercent !== null || comparison.yearOverYearPercent !== null)
    .slice(0, 5);
  return {
    objectiveSummary: highlighted.map(sentence).join(" "),
    comparisons,
    comparisonBasis: "Objective comparisons derived from normalized SEC XBRL facts. Flow metrics use standalone-quarter values when cumulative filings permit; balance-sheet metrics compare reported period-end values. Thesis interpretation remains moderated.",
  };
}
