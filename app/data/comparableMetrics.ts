export type ComparableFilingFact = {
  metricKey: string;
  value: number;
  periodEnd: string;
  fiscalPeriod: string | null;
  form: string;
  filedAt: string;
  sourceUrl: string;
};

export type ComparableMetricSummary = {
  marketCap: number | null;
  enterpriseValue: number | null;
  revenue: number | null;
  operatingIncome: number | null;
  depreciationAmortization: number | null;
  ebitda: number | null;
  netIncome: number | null;
  freeCashFlow: number | null;
  cash: number | null;
  reportedDebt: number | null;
  netCash: number | null;
  evToRevenue: number | null;
  evToEbitda: number | null;
  priceToEarnings: number | null;
  priceToFreeCashFlow: number | null;
  cashToMarketCap: number | null;
  debtToMarketCap: number | null;
  revenueGrowth: number | null;
  grossMargin: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  stockholdersEquity: number | null;
  currentRatio: number | null;
  cashToDebt: number | null;
  debtToEquity: number | null;
  liabilitiesToAssets: number | null;
  netDebtToEbitda: number | null;
  fundamentalsAsOf: string | null;
  sourceUrl: string | null;
  coverage: "complete" | "partial" | "awaiting-filing-data";
};

function latestAnnualFacts(facts: ComparableFilingFact[], metricKey: string) {
  return facts
    .filter((fact) => fact.metricKey === metricKey && (
      fact.fiscalPeriod === "FY"
      || /^10-K/.test(fact.form)
      || /^(20-F|40-F)/.test(fact.form)
    ))
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd) || b.filedAt.localeCompare(a.filedAt));
}

function latestBalanceFact(facts: ComparableFilingFact[], metricKey: string) {
  return facts
    .filter((fact) => fact.metricKey === metricKey)
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd) || b.filedAt.localeCompare(a.filedAt))[0] ?? null;
}

function safeRatio(numerator: number | null, denominator: number | null, positiveDenominator = true) {
  if (numerator == null || denominator == null || !Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (positiveDenominator ? denominator <= 0 : denominator === 0) return null;
  return numerator / denominator;
}

/**
 * Uses current equity value with the latest reported fiscal-year flows and
 * latest balance-sheet facts. It deliberately returns null instead of turning
 * losses, missing facts, or incomplete capital structures into false precision.
 */
export function summarizeComparableMetrics(
  facts: ComparableFilingFact[],
  marketCap: number | null,
): ComparableMetricSummary {
  const annualRevenue = latestAnnualFacts(facts, "revenue");
  const revenue = annualRevenue[0] ?? null;
  const priorRevenue = annualRevenue.find((fact) => fact.periodEnd < (revenue?.periodEnd ?? "")) ?? null;
  const netIncome = latestAnnualFacts(facts, "net_income").find((fact) => !revenue || fact.periodEnd === revenue.periodEnd)
    ?? latestAnnualFacts(facts, "net_income")[0]
    ?? null;
  const operatingIncome = latestAnnualFacts(facts, "operating_income").find((fact) => !revenue || fact.periodEnd === revenue.periodEnd)
    ?? latestAnnualFacts(facts, "operating_income")[0]
    ?? null;
  const depreciationAmortization = latestAnnualFacts(facts, "depreciation_amortization").find((fact) => !revenue || fact.periodEnd === revenue.periodEnd)
    ?? latestAnnualFacts(facts, "depreciation_amortization")[0]
    ?? null;
  const operatingCashFlow = latestAnnualFacts(facts, "operating_cash_flow").find((fact) => !revenue || fact.periodEnd === revenue.periodEnd)
    ?? latestAnnualFacts(facts, "operating_cash_flow")[0]
    ?? null;
  const capitalExpenditures = latestAnnualFacts(facts, "capital_expenditures").find((fact) => !revenue || fact.periodEnd === revenue.periodEnd)
    ?? latestAnnualFacts(facts, "capital_expenditures")[0]
    ?? null;
  const grossProfit = latestAnnualFacts(facts, "gross_profit").find((fact) => !revenue || fact.periodEnd === revenue.periodEnd)
    ?? null;
  const cash = latestBalanceFact(facts, "cash");
  const debt = latestBalanceFact(facts, "long_term_debt");
  const totalAssets = latestBalanceFact(facts, "total_assets");
  const currentAssets = latestBalanceFact(facts, "current_assets");
  const totalLiabilities = latestBalanceFact(facts, "total_liabilities");
  const currentLiabilities = latestBalanceFact(facts, "current_liabilities");
  const stockholdersEquity = latestBalanceFact(facts, "stockholders_equity");
  const freeCashFlow = operatingCashFlow && capitalExpenditures
    ? operatingCashFlow.value - Math.abs(capitalExpenditures.value)
    : null;
  const netCash = cash && debt ? cash.value - debt.value : null;
  const netDebt = netCash == null ? null : -netCash;
  const ebitda = operatingIncome && depreciationAmortization
    ? operatingIncome.value + Math.abs(depreciationAmortization.value)
    : null;
  const enterpriseValue = marketCap != null && cash && debt
    ? marketCap + debt.value - cash.value
    : null;
  const availableCoreFacts = [revenue, cash, debt].filter(Boolean).length;

  return {
    marketCap,
    enterpriseValue,
    revenue: revenue?.value ?? null,
    operatingIncome: operatingIncome?.value ?? null,
    depreciationAmortization: depreciationAmortization?.value ?? null,
    ebitda,
    netIncome: netIncome?.value ?? null,
    freeCashFlow,
    cash: cash?.value ?? null,
    reportedDebt: debt?.value ?? null,
    netCash,
    evToRevenue: safeRatio(enterpriseValue, revenue?.value ?? null),
    evToEbitda: safeRatio(enterpriseValue, ebitda),
    priceToEarnings: safeRatio(marketCap, netIncome?.value ?? null),
    priceToFreeCashFlow: safeRatio(marketCap, freeCashFlow),
    cashToMarketCap: safeRatio(cash?.value ?? null, marketCap),
    debtToMarketCap: safeRatio(debt?.value ?? null, marketCap),
    revenueGrowth: safeRatio(revenue?.value ?? null, priorRevenue?.value ?? null) == null
      ? null
      : (revenue!.value / priorRevenue!.value) - 1,
    grossMargin: safeRatio(grossProfit?.value ?? null, revenue?.value ?? null),
    totalAssets: totalAssets?.value ?? null,
    totalLiabilities: totalLiabilities?.value ?? null,
    stockholdersEquity: stockholdersEquity?.value ?? null,
    currentRatio: safeRatio(currentAssets?.value ?? null, currentLiabilities?.value ?? null),
    cashToDebt: safeRatio(cash?.value ?? null, debt?.value ?? null),
    debtToEquity: safeRatio(debt?.value ?? null, stockholdersEquity?.value ?? null),
    liabilitiesToAssets: safeRatio(totalLiabilities?.value ?? null, totalAssets?.value ?? null),
    netDebtToEbitda: netDebt != null && netDebt > 0 ? safeRatio(netDebt, ebitda) : null,
    fundamentalsAsOf: revenue?.periodEnd ?? cash?.periodEnd ?? debt?.periodEnd ?? null,
    sourceUrl: revenue?.sourceUrl ?? cash?.sourceUrl ?? debt?.sourceUrl ?? null,
    coverage: availableCoreFacts === 3 ? "complete" : availableCoreFacts ? "partial" : "awaiting-filing-data",
  };
}

export function comparableArchetype(sector: string) {
  const value = sector.toLowerCase();
  if (/bank|insurance|financial|capital market/.test(value)) {
    return {
      name: "Financial-company lens",
      caveat: "Debt and enterprise-value ratios are not directly comparable for banks and insurers. Treat the common metrics as context and prioritize book value, capital ratios, credit quality, and return on equity in the filing.",
    };
  }
  if (/reit|real estate/.test(value)) {
    return {
      name: "Real-estate lens",
      caveat: "GAAP earnings may understate economic performance for property companies. Use these common metrics with FFO, NAV, occupancy, lease duration, and net debt measures from the filing.",
    };
  }
  return {
    name: "Operating-company lens",
    caveat: "Multiples combine current market value with the latest reported fiscal-year fundamentals. They are screening tools, not a substitute for normalized earnings, segment mix, leases, dilution, and cycle analysis.",
  };
}
