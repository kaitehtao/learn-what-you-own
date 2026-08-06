import assert from "node:assert/strict";
import test from "node:test";
import { classifySecFiling, relevantSecFilings } from "../app/data/dossierFreshnessClassification";
import { selectSecSourcePack } from "../app/data/secSourcePack";

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

test("builds a balanced initial SEC source pack without insider-form noise", () => {
  const pack = selectSecSourcePack("1234", { filings: { recent: {
    form: ["4", "8-K", "10-Q", "DEF 14A", "10-Q", "10-K", "8-K"],
    accessionNumber: ["0000001234-26-000007", "0000001234-26-000006", "0000001234-26-000005", "0000001234-26-000004", "0000001234-26-000003", "0000001234-26-000002", "0000001234-26-000001"],
    primaryDocument: ["form4.xml", "earnings.htm", "q2.htm", "proxy.htm", "q1.htm", "annual.htm", "material.htm"],
    primaryDocDescription: ["FORM 4", "Quarterly financial results", "", "", "", "", "Material agreement"],
    filingDate: ["2026-08-05", "2026-08-04", "2026-08-03", "2026-08-02", "2026-08-01", "2026-07-31", "2026-07-30"],
    reportDate: ["", "2026-06-30", "2026-06-30", "", "2026-03-31", "2025-12-31", ""],
    items: ["", "2.02,9.01", "", "", "", "", "1.01,9.01"],
  } } });
  assert.equal(pack.length, 6);
  assert.deepEqual(new Set(pack.map((item) => item.category)), new Set(["annual", "quarterly", "proxy", "earnings", "material_current"]));
  assert.equal(pack.filter((item) => item.category === "quarterly").length, 2);
  assert.ok(pack.every((item) => item.form !== "4"));
  assert.match(pack[0].sourceUrl, /^https:\/\/www\.sec\.gov\/Archives\/edgar\/data\/1234\//);
});

test("supports foreign-issuer annual reports and recent 6-K evidence", () => {
  const pack = selectSecSourcePack("4321", { filings: { recent: {
    form: ["6-K", "20-F"],
    accessionNumber: ["0000004321-26-000002", "0000004321-26-000001"],
    primaryDocument: ["current.htm", "annual.htm"],
    primaryDocDescription: ["Operational update", "Annual report"],
    filingDate: ["2026-08-04", "2026-03-20"],
    reportDate: ["2026-08-04", "2025-12-31"],
    items: ["", ""],
  } } });
  assert.deepEqual(pack.map((item) => item.form), ["6-K", "20-F"]);
  assert.deepEqual(new Set(pack.map((item) => item.category)), new Set(["foreign_current", "annual"]));
});
