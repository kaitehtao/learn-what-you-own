import assert from "node:assert/strict";
import test from "node:test";
import { comparableArchetype, summarizeComparableMetrics, type ComparableFilingFact } from "../app/data/comparableMetrics";

function fact(metricKey: string, value: number, periodEnd = "2025-12-31", fiscalPeriod = "FY"): ComparableFilingFact {
  return { metricKey, value, periodEnd, fiscalPeriod, form: fiscalPeriod === "FY" ? "10-K" : "10-Q", filedAt: "2026-02-15", sourceUrl: "https://www.sec.gov/example" };
}

test("calculates one consistent operating-company comparison from current market value and latest annual SEC facts", () => {
  const summary = summarizeComparableMetrics([
    fact("revenue", 100),
    fact("revenue", 80, "2024-12-31"),
    fact("gross_profit", 40),
    fact("net_income", 10),
    fact("operating_cash_flow", 20),
    fact("capital_expenditures", 5),
    fact("cash", 30, "2026-03-31", "Q1"),
    fact("long_term_debt", 10, "2026-03-31", "Q1"),
  ], 200);

  assert.equal(summary.enterpriseValue, 180);
  assert.equal(summary.evToRevenue, 1.8);
  assert.equal(summary.priceToEarnings, 20);
  assert.equal(summary.freeCashFlow, 15);
  assert.equal(summary.priceToFreeCashFlow, 200 / 15);
  assert.equal(summary.revenueGrowth, 0.25);
  assert.equal(summary.grossMargin, 0.4);
  assert.equal(summary.netCash, 20);
  assert.equal(summary.coverage, "complete");
});

test("does not manufacture earnings multiples for losses or enterprise value from incomplete debt data", () => {
  const summary = summarizeComparableMetrics([
    fact("revenue", 100),
    fact("net_income", -10),
    fact("operating_cash_flow", -5),
    fact("capital_expenditures", 2),
    fact("cash", 30, "2026-03-31", "Q1"),
  ], 200);

  assert.equal(summary.priceToEarnings, null);
  assert.equal(summary.priceToFreeCashFlow, null);
  assert.equal(summary.enterpriseValue, null);
  assert.equal(summary.evToRevenue, null);
  assert.equal(summary.coverage, "partial");
});

test("adds sector-specific warnings instead of pretending one multiple is universal", () => {
  assert.equal(comparableArchetype("Regional Banks").name, "Financial-company lens");
  assert.equal(comparableArchetype("Equity REIT").name, "Real-estate lens");
  assert.equal(comparableArchetype("Semiconductors").name, "Operating-company lens");
});
