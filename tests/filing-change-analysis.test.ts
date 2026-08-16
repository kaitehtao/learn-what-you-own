import assert from "node:assert/strict";
import test from "node:test";
import { buildFilingChangePacket, type FilingChangeFact } from "../app/data/filingChangeAnalysis";

function fact(overrides: Partial<FilingChangeFact>): FilingChangeFact {
  return {
    metricKey: "revenue", label: "Revenue", value: 0, unit: "USD", periodStart: "2026-01-01", periodEnd: "2026-06-30",
    fiscalYear: 2026, fiscalPeriod: "Q2", form: "10-Q", filedAt: "2026-08-01", accessionNumber: "current", sourceUrl: "https://sec.example/current",
    ...overrides,
  };
}

test("creates cited sequential and year-over-year comparisons from cumulative SEC facts", () => {
  const packet = buildFilingChangePacket([
    fact({ value: 220, accessionNumber: "current" }),
    fact({ value: 100, periodEnd: "2026-03-31", fiscalPeriod: "Q1", accessionNumber: "q1", sourceUrl: "https://sec.example/q1" }),
    fact({ value: 90, periodEnd: "2025-03-31", fiscalYear: 2025, fiscalPeriod: "Q1", accessionNumber: "old-q1" }),
    fact({ value: 195, periodEnd: "2025-06-30", fiscalYear: 2025, fiscalPeriod: "Q2", accessionNumber: "old-q2", sourceUrl: "https://sec.example/old-q2" }),
  ], "current");
  assert.equal(packet.comparisons.length, 1);
  assert.equal(packet.comparisons[0].currentValue, 120);
  assert.equal(packet.comparisons[0].priorQuarterValue, 100);
  assert.equal(packet.comparisons[0].priorYearValue, 105);
  assert.equal(packet.comparisons[0].quarterOverQuarterPercent?.toFixed(1), "20.0");
  assert.equal(packet.comparisons[0].yearOverYearPercent?.toFixed(1), "14.3");
  assert.equal(packet.comparisons[0].priorYearSourceUrl, "https://sec.example/old-q2");
  assert.match(packet.objectiveSummary, /Revenue was \$120/);
});

test("compares instant balance-sheet facts without subtracting cumulative periods", () => {
  const packet = buildFilingChangePacket([
    fact({ metricKey: "cash", label: "Cash", value: 500, periodStart: null, accessionNumber: "current" }),
    fact({ metricKey: "cash", label: "Cash", value: 400, periodStart: null, periodEnd: "2026-03-31", fiscalPeriod: "Q1", accessionNumber: "q1" }),
    fact({ metricKey: "cash", label: "Cash", value: 250, periodStart: null, periodEnd: "2025-06-30", fiscalYear: 2025, accessionNumber: "old" }),
  ], "current");
  assert.equal(packet.comparisons[0].currentValue, 500);
  assert.equal(packet.comparisons[0].quarterOverQuarterPercent, 25);
  assert.equal(packet.comparisons[0].yearOverYearPercent, 100);
});

test("does not invent comparisons when an accession has no normalized facts", () => {
  const packet = buildFilingChangePacket([], "missing");
  assert.deepEqual(packet.comparisons, []);
  assert.equal(packet.objectiveSummary, "");
});
