import assert from "node:assert/strict";
import test from "node:test";
import { classifySecFiling, relevantSecFilings } from "../app/data/dossierFreshnessClassification";

test("classifies earnings, periodic reports, proxies, and material current reports", () => {
  assert.equal(classifySecFiling("8-K", "2.02,9.01")?.eventType, "earnings_release");
  assert.equal(classifySecFiling("10-K")?.eventType, "annual_report");
  assert.equal(classifySecFiling("10-Q")?.eventType, "quarterly_report");
  assert.equal(classifySecFiling("DEF 14A")?.eventType, "proxy_statement");
  assert.equal(classifySecFiling("8-K", "1.01,9.01")?.eventType, "material_8k");
  assert.equal(classifySecFiling("8-K", "9.01"), null);
  assert.equal(classifySecFiling("4"), null);
});

test("builds exact SEC archive links and honors the incremental filing date", () => {
  const filings = relevantSecFilings("1234", { filings: { recent: {
    form: ["10-Q", "DEF 14A", "8-K"],
    accessionNumber: ["0000001234-26-000003", "0000001234-26-000002", "0000001234-26-000001"],
    primaryDocument: ["quarter.htm", "proxy.htm", "current.htm"],
    filingDate: ["2026-08-04", "2026-07-10", "2026-07-01"],
    reportDate: ["2026-06-30", "2026-07-10", "2026-07-01"],
    items: ["", "", "2.02,9.01"],
  } } }, "2026-07-10");
  assert.deepEqual(filings.map((filing) => filing.eventType), ["quarterly_report", "proxy_statement"]);
  assert.equal(filings[0].sourceUrl, "https://www.sec.gov/Archives/edgar/data/1234/000000123426000003/quarter.htm");
});
