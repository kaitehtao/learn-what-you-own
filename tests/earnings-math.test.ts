import assert from "node:assert/strict";
import test from "node:test";
import { median, parseFinancialNumber, safeSurprisePercent, standardDeviation } from "../app/earnings-math";

test("parses provider currency fields without inventing unavailable values", () => {
  assert.equal(parseFinancialNumber("$1.88"), 1.88);
  assert.equal(parseFinancialNumber("($0.25)"), -0.25);
  assert.equal(parseFinancialNumber("—"), null);
  assert.equal(parseFinancialNumber("not available"), null);
});

test("uses a median whisper and population dispersion", () => {
  assert.equal(median([1, 100, 2]), 2);
  assert.equal(median([1, 3]), 2);
  assert.equal(standardDeviation([1, 1, 1]), 0);
  assert.equal(standardDeviation([1]), null);
});

test("avoids misleading percent surprises around zero consensus", () => {
  assert.equal(safeSurprisePercent(1.1, 1), 10.000000000000009);
  assert.equal(safeSurprisePercent(0.1, 0), null);
  assert.equal(safeSurprisePercent(-0.4, -0.5), 19.999999999999996);
});
