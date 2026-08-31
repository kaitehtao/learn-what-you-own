import type { ComparableFilingFact } from "./data/comparableMetrics";
import type { HistoricalMarketPrice } from "./market-quotes";

export type HistoricalValuationPoint = {
  date: string;
  price: number;
  sharesOutstanding: number;
  marketCap: number;
  enterpriseValue: number | null;
  revenue: number | null;
  ebitda: number | null;
  netIncome: number | null;
  freeCashFlow: number | null;
  priceToEarnings: number | null;
  evToRevenue: number | null;
  evToEbitda: number | null;
  priceToFreeCashFlow: number | null;
  freeCashFlowYield: number | null;
  fundamentalsPeriodEnd: string | null;
  fundamentalsFiledAt: string | null;
};

export type ValuationStatistic = {
  metric: keyof Pick<HistoricalValuationPoint, "priceToEarnings" | "evToRevenue" | "evToEbitda" | "priceToFreeCashFlow" | "freeCashFlowYield">;
  current: number | null;
  mean: number | null;
  median: number | null;
  minimum: number | null;
  maximum: number | null;
  percentile: number | null;
  premiumToMedian: number | null;
  observationCount: number;
};

export type ValuationWindow = {
  requestedYears: number;
  requestedMonths: number;
  observationCount: number;
  firstObservation: string | null;
  lastObservation: string | null;
  availableMonths: number;
  complete: boolean;
  statistics: ValuationStatistic[];
};

const valuationMetrics: ValuationStatistic["metric"][] = [
  "priceToEarnings", "evToRevenue", "evToEbitda", "priceToFreeCashFlow", "freeCashFlowYield",
];

function safeRatio(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || !Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  const value = numerator / denominator;
  return Number.isFinite(value) && value >= 0 && value <= 1000 ? value : null;
}

function latestAvailableFact(facts: ComparableFilingFact[], metricKey: string, asOf: string, annualOnly = false) {
  return facts.filter((fact) => fact.metricKey === metricKey && fact.filedAt <= asOf && (!annualOnly || fact.fiscalPeriod === "FY" || /^(10-K|20-F|40-F)/.test(fact.form)))
    .sort((left, right) => right.filedAt.localeCompare(left.filedAt) || right.periodEnd.localeCompare(left.periodEnd))[0] ?? null;
}

export function monthEndPrices(prices: HistoricalMarketPrice[]) {
  const byMonth = new Map<string, HistoricalMarketPrice>();
  for (const price of prices) {
    const month = price.date.slice(0, 7);
    const current = byMonth.get(month);
    if (!current || current.date < price.date) byMonth.set(month, price);
  }
  return [...byMonth.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function buildHistoricalValuationSeries(facts: ComparableFilingFact[], prices: HistoricalMarketPrice[]) {
  return monthEndPrices(prices).flatMap((price): HistoricalValuationPoint[] => {
    const shares = latestAvailableFact(facts, "shares_outstanding", price.date) ?? latestAvailableFact(facts, "diluted_shares", price.date, true);
    if (!shares || shares.value <= 0) return [];
    const revenue = latestAvailableFact(facts, "revenue", price.date, true);
    const operatingIncome = latestAvailableFact(facts, "operating_income", price.date, true);
    const depreciation = latestAvailableFact(facts, "depreciation_amortization", price.date, true);
    const netIncome = latestAvailableFact(facts, "net_income", price.date, true);
    const operatingCashFlow = latestAvailableFact(facts, "operating_cash_flow", price.date, true);
    const capitalExpenditures = latestAvailableFact(facts, "capital_expenditures", price.date, true);
    const cash = latestAvailableFact(facts, "cash", price.date);
    const debt = latestAvailableFact(facts, "long_term_debt", price.date);
    const marketCap = price.close * shares.value;
    const ebitda = operatingIncome && depreciation ? operatingIncome.value + Math.abs(depreciation.value) : null;
    const freeCashFlow = operatingCashFlow && capitalExpenditures ? operatingCashFlow.value - Math.abs(capitalExpenditures.value) : null;
    const enterpriseValue = cash && debt ? marketCap + debt.value - cash.value : null;
    const used = [shares, revenue, operatingIncome, depreciation, netIncome, operatingCashFlow, capitalExpenditures, cash, debt].filter(Boolean) as ComparableFilingFact[];
    return [{
      date: price.date,
      price: price.close,
      sharesOutstanding: shares.value,
      marketCap,
      enterpriseValue,
      revenue: revenue?.value ?? null,
      ebitda,
      netIncome: netIncome?.value ?? null,
      freeCashFlow,
      priceToEarnings: safeRatio(marketCap, netIncome?.value ?? null),
      evToRevenue: safeRatio(enterpriseValue, revenue?.value ?? null),
      evToEbitda: safeRatio(enterpriseValue, ebitda),
      priceToFreeCashFlow: safeRatio(marketCap, freeCashFlow),
      freeCashFlowYield: safeRatio(freeCashFlow, marketCap),
      fundamentalsPeriodEnd: used.sort((left, right) => right.periodEnd.localeCompare(left.periodEnd))[0]?.periodEnd ?? null,
      fundamentalsFiledAt: used.sort((left, right) => right.filedAt.localeCompare(left.filedAt))[0]?.filedAt ?? null,
    }];
  });
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarizeValuationHistory(points: HistoricalValuationPoint[]) {
  const latest = points.at(-1) ?? null;
  return valuationMetrics.map((metric): ValuationStatistic => {
    const values = points.flatMap((point) => point[metric] === null ? [] : [point[metric] as number]);
    const current = latest?.[metric] ?? null;
    const middle = median(values);
    return {
      metric,
      current,
      mean: values.length ? values.reduce((total, value) => total + value, 0) / values.length : null,
      median: middle,
      minimum: values.length ? Math.min(...values) : null,
      maximum: values.length ? Math.max(...values) : null,
      percentile: current === null || !values.length ? null : (values.filter((value) => value <= current).length / values.length) * 100,
      premiumToMedian: current === null || middle === null || middle === 0 ? null : (current / middle) - 1,
      observationCount: values.length,
    };
  });
}

function subtractYears(value: string, years: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.toISOString().slice(0, 10);
}

function inclusiveMonthCount(first: string, last: string) {
  const [firstYear, firstMonth] = first.slice(0, 7).split("-").map(Number);
  const [lastYear, lastMonth] = last.slice(0, 7).split("-").map(Number);
  return Math.max(0, ((lastYear - firstYear) * 12) + lastMonth - firstMonth + 1);
}

export function buildValuationWindows(points: HistoricalValuationPoint[], windows: readonly number[] = [1, 3, 5]) {
  const lastObservation = points.at(-1)?.date ?? null;
  return Object.fromEntries(windows.map((requestedYears): [string, ValuationWindow] => {
    const cutoff = lastObservation ? subtractYears(lastObservation, requestedYears) : null;
    const selected = cutoff ? points.filter((point) => point.date >= cutoff) : [];
    const firstObservation = selected[0]?.date ?? null;
    const availableMonths = firstObservation && lastObservation ? inclusiveMonthCount(firstObservation, lastObservation) : 0;
    const requestedMonths = requestedYears * 12;
    // Month-end observations can begin up to one month after the exact cutoff.
    const complete = availableMonths >= requestedMonths;
    return [`${requestedYears}y`, {
      requestedYears,
      requestedMonths,
      observationCount: selected.length,
      firstObservation,
      lastObservation,
      availableMonths,
      complete,
      statistics: summarizeValuationHistory(selected),
    }];
  }));
}
