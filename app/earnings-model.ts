import { median, standardDeviation } from "./earnings-math";

export const earningsModelPeriods = [
  { key: "report_quarter", label: "Reporting quarter", horizon: "Quarter" },
  { key: "next_quarter", label: "Next quarter", horizon: "Quarter" },
  { key: "current_fy", label: "Current fiscal year", horizon: "Fiscal year" },
  { key: "next_fy", label: "Next fiscal year", horizon: "Fiscal year" },
] as const;

export const earningsModelInputs = [
  { key: "revenue_millions", label: "Revenue", unit: "USD millions" },
  { key: "gross_profit_millions", label: "Gross profit", unit: "USD millions" },
  { key: "operating_income_millions", label: "Operating income", unit: "USD millions" },
  { key: "adjusted_ebitda_millions", label: "Adjusted EBITDA", unit: "USD millions" },
  { key: "net_income_millions", label: "Net income", unit: "USD millions" },
  { key: "diluted_shares_millions", label: "Diluted shares", unit: "Millions" },
  { key: "adjusted_eps", label: "Adjusted EPS", unit: "USD per share" },
  { key: "operating_cash_flow_millions", label: "Operating cash flow", unit: "USD millions" },
  { key: "capex_millions", label: "Capital expenditures", unit: "USD millions" },
] as const;

export const earningsModelDerived = [
  { key: "gross_margin_percent", label: "Gross margin", unit: "%" },
  { key: "operating_margin_percent", label: "Operating margin", unit: "%" },
  { key: "adjusted_ebitda_margin_percent", label: "Adjusted EBITDA margin", unit: "%" },
  { key: "gaap_eps", label: "Implied GAAP EPS", unit: "USD per share" },
  { key: "free_cash_flow_millions", label: "Free cash flow", unit: "USD millions" },
  { key: "free_cash_flow_margin_percent", label: "Free cash flow margin", unit: "%" },
] as const;

export type EarningsModelPeriodKey = typeof earningsModelPeriods[number]["key"];
export type EarningsModelInputKey = typeof earningsModelInputs[number]["key"];
export type EarningsModelDerivedKey = typeof earningsModelDerived[number]["key"];
export type EarningsModelCellMap = Partial<Record<EarningsModelPeriodKey, Partial<Record<EarningsModelInputKey, number>>>>;

export type EarningsModelCellRow = {
  period_key: string;
  metric_key: string;
  value: number;
};

export type EarningsModelAggregateCell = {
  median: number | null;
  low: number | null;
  high: number | null;
  standardDeviation: number | null;
  contributorCount: number;
};

export type EarningsModelAggregateMap = Partial<Record<EarningsModelPeriodKey, Partial<Record<EarningsModelInputKey, EarningsModelAggregateCell>>>>;

const periodKeys = new Set<string>(earningsModelPeriods.map((period) => period.key));
const metricKeys = new Set<string>(earningsModelInputs.map((metric) => metric.key));

export function isEarningsModelPeriodKey(value: string): value is EarningsModelPeriodKey {
  return periodKeys.has(value);
}

export function isEarningsModelInputKey(value: string): value is EarningsModelInputKey {
  return metricKeys.has(value);
}

export function deriveEarningsModelPeriod(inputs: Partial<Record<EarningsModelInputKey, number>>) {
  const revenue = inputs.revenue_millions;
  const grossProfit = inputs.gross_profit_millions;
  const operatingIncome = inputs.operating_income_millions;
  const adjustedEbitda = inputs.adjusted_ebitda_millions;
  const netIncome = inputs.net_income_millions;
  const dilutedShares = inputs.diluted_shares_millions;
  const operatingCashFlow = inputs.operating_cash_flow_millions;
  const capex = inputs.capex_millions;
  const divide = (numerator: number | undefined, denominator: number | undefined, scale = 1) =>
    numerator === undefined || denominator === undefined || Math.abs(denominator) < 0.000001 ? null : (numerator / denominator) * scale;
  const freeCashFlow = operatingCashFlow === undefined || capex === undefined ? null : operatingCashFlow - Math.abs(capex);
  return {
    gross_margin_percent: divide(grossProfit, revenue, 100),
    operating_margin_percent: divide(operatingIncome, revenue, 100),
    adjusted_ebitda_margin_percent: divide(adjustedEbitda, revenue, 100),
    gaap_eps: divide(netIncome, dilutedShares),
    free_cash_flow_millions: freeCashFlow,
    free_cash_flow_margin_percent: freeCashFlow === null ? null : divide(freeCashFlow, revenue, 100),
  } satisfies Record<EarningsModelDerivedKey, number | null>;
}

export function aggregateEarningsModelCells(rows: EarningsModelCellRow[]): EarningsModelAggregateMap {
  const grouped = new Map<string, number[]>();
  for (const row of rows) {
    if (!isEarningsModelPeriodKey(row.period_key) || !isEarningsModelInputKey(row.metric_key) || !Number.isFinite(row.value)) continue;
    const key = `${row.period_key}:${row.metric_key}`;
    grouped.set(key, [...(grouped.get(key) ?? []), row.value]);
  }
  const output: EarningsModelAggregateMap = {};
  for (const period of earningsModelPeriods) {
    const metrics: Partial<Record<EarningsModelInputKey, EarningsModelAggregateCell>> = {};
    for (const metric of earningsModelInputs) {
      const values = grouped.get(`${period.key}:${metric.key}`) ?? [];
      if (!values.length) continue;
      metrics[metric.key] = {
        median: median(values),
        low: Math.min(...values),
        high: Math.max(...values),
        standardDeviation: standardDeviation(values),
        contributorCount: values.length,
      };
    }
    if (Object.keys(metrics).length) output[period.key] = metrics;
  }
  return output;
}

export function aggregateMedianInputs(aggregate: EarningsModelAggregateMap, period: EarningsModelPeriodKey) {
  const inputs: Partial<Record<EarningsModelInputKey, number>> = {};
  for (const metric of earningsModelInputs) {
    const value = aggregate[period]?.[metric.key]?.median;
    if (value !== null && value !== undefined) inputs[metric.key] = value;
  }
  return inputs;
}
