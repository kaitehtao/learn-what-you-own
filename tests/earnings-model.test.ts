import assert from "node:assert/strict";
import test from "node:test";
import { aggregateEarningsModelCells, deriveEarningsModelPeriod } from "../app/earnings-model";

test("derives margins, per-share earnings, and free cash flow from model inputs", () => {
  const result = deriveEarningsModelPeriod({
    revenue_millions: 1_000,
    gross_profit_millions: 600,
    operating_income_millions: 200,
    adjusted_ebitda_millions: 250,
    net_income_millions: 150,
    diluted_shares_millions: 100,
    operating_cash_flow_millions: 220,
    capex_millions: 70,
  });
  assert.equal(result.gross_margin_percent, 60);
  assert.equal(result.operating_margin_percent, 20);
  assert.equal(result.adjusted_ebitda_margin_percent, 25);
  assert.equal(result.gaap_eps, 1.5);
  assert.equal(result.free_cash_flow_millions, 150);
  assert.equal(result.free_cash_flow_margin_percent, 15);
});

test("aggregates valid community model cells without leaking contributor identity", () => {
  const result = aggregateEarningsModelCells([
    { period_key: "report_quarter", metric_key: "revenue_millions", value: 100 },
    { period_key: "report_quarter", metric_key: "revenue_millions", value: 120 },
    { period_key: "report_quarter", metric_key: "revenue_millions", value: 200 },
    { period_key: "invalid", metric_key: "revenue_millions", value: 999 },
  ]);
  assert.deepEqual(result.report_quarter?.revenue_millions, {
    median: 120,
    low: 100,
    high: 200,
    standardDeviation: Math.sqrt(1866.6666666666667),
    contributorCount: 3,
  });
  assert.equal("invalid" in result, false);
});
