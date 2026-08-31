import assert from "node:assert/strict";
import test from "node:test";
import type { ComparableFilingFact } from "../app/data/comparableMetrics";
import { buildHistoricalValuationSeries, buildValuationWindows, monthEndPrices, summarizeValuationHistory } from "../app/valuation-history";

function fact(metricKey: string, value: number, filedAt: string, periodEnd = "2024-12-31", fiscalPeriod: string | null = "FY"): ComparableFilingFact {
  return { metricKey, value, filedAt, periodEnd, fiscalPeriod, form: fiscalPeriod === "FY" ? "10-K" : "10-Q", sourceUrl: `https://www.sec.gov/${metricKey}` };
}

test("uses the final market close in each calendar month", () => {
  assert.deepEqual(monthEndPrices([
    { date: "2026-01-02", close: 10, volume: null, sourceLabel: "Test", sourceUrl: "https://example.com" },
    { date: "2026-01-30", close: 12, volume: null, sourceLabel: "Test", sourceUrl: "https://example.com" },
    { date: "2026-02-27", close: 15, volume: null, sourceLabel: "Test", sourceUrl: "https://example.com" },
  ]).map((point) => [point.date, point.close]), [["2026-01-30", 12], ["2026-02-27", 15]]);
});

test("does not use a filing before investors could see it", () => {
  const facts = [
    fact("shares_outstanding", 100, "2025-02-15"),
    fact("revenue", 1_000, "2025-02-15"),
    fact("net_income", 100, "2025-02-15"),
    fact("shares_outstanding", 200, "2026-02-15", "2025-12-31"),
    fact("revenue", 2_000, "2026-02-15", "2025-12-31"),
    fact("net_income", 200, "2026-02-15", "2025-12-31"),
  ];
  const points = buildHistoricalValuationSeries(facts, [
    { date: "2026-01-30", close: 10, volume: null, sourceLabel: "Test", sourceUrl: "https://example.com" },
    { date: "2026-02-27", close: 10, volume: null, sourceLabel: "Test", sourceUrl: "https://example.com" },
  ]);
  assert.equal(points[0].sharesOutstanding, 100);
  assert.equal(points[0].marketCap, 1_000);
  assert.equal(points[1].sharesOutstanding, 200);
  assert.equal(points[1].marketCap, 2_000);
});

test("summarizes current valuation against the historical distribution", () => {
  const points = [10, 20, 30].map((priceToEarnings, index) => ({
    date: `2026-0${index + 1}-28`, price: 1, sharesOutstanding: 1, marketCap: 1,
    enterpriseValue: null, revenue: null, ebitda: null, netIncome: null, freeCashFlow: null,
    priceToEarnings, evToRevenue: null, evToEbitda: null, priceToFreeCashFlow: null,
    freeCashFlowYield: null, fundamentalsPeriodEnd: null, fundamentalsFiledAt: null,
  }));
  const pe = summarizeValuationHistory(points).find((item) => item.metric === "priceToEarnings")!;
  assert.equal(pe.current, 30);
  assert.equal(pe.median, 20);
  assert.equal(pe.mean, 20);
  assert.equal(pe.percentile, 100);
  assert.equal(pe.premiumToMedian, 0.5);
});

test("distinguishes complete three-year and five-year valuation windows", () => {
  const points = Array.from({ length: 61 }, (_, index) => {
    const value = new Date(Date.UTC(2021, 7 + index, 28)).toISOString().slice(0, 10);
    return {
      date: value, price: 1, sharesOutstanding: 1, marketCap: 1,
      enterpriseValue: null, revenue: null, ebitda: null, netIncome: null, freeCashFlow: null,
      priceToEarnings: index + 1, evToRevenue: null, evToEbitda: null, priceToFreeCashFlow: null,
      freeCashFlowYield: null, fundamentalsPeriodEnd: null, fundamentalsFiledAt: null,
    };
  });
  const windows = buildValuationWindows(points, [3, 5]);
  assert.equal(windows["3y"].complete, true);
  assert.equal(windows["5y"].complete, true);
  assert.notEqual(windows["3y"].statistics[0].mean, windows["5y"].statistics[0].mean);
});

test("labels a five-year request as partial when only 34 months exist", () => {
  const points = Array.from({ length: 34 }, (_, index) => {
    const value = new Date(Date.UTC(2023, 10 + index, 28)).toISOString().slice(0, 10);
    return {
      date: value, price: 1, sharesOutstanding: 1, marketCap: 1,
      enterpriseValue: null, revenue: null, ebitda: null, netIncome: null, freeCashFlow: null,
      priceToEarnings: index + 1, evToRevenue: null, evToEbitda: null, priceToFreeCashFlow: null,
      freeCashFlowYield: null, fundamentalsPeriodEnd: null, fundamentalsFiledAt: null,
    };
  });
  const windows = buildValuationWindows(points, [3, 5]);
  assert.equal(windows["3y"].complete, false);
  assert.equal(windows["5y"].complete, false);
  assert.equal(windows["5y"].availableMonths, 34);
});
