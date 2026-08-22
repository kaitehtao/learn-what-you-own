import assert from "node:assert/strict";
import test from "node:test";
import { filingHistoryLabel, filingPeriodLabel, selectComparableHistory, selectDisplayedFact } from "../app/filingHistory";
import { normalizeCompanyFacts, type SecCompanyFacts as MetricCompanyFacts } from "../app/data/secMetrics";
import { latestSharesOutstanding, sharesFromInlineFiling, type SecCompanyFacts, type ShareFiling } from "../app/data/secShareFacts";

test("uses a current US-GAAP share fact when the DEI Company Facts concept is absent", () => {
  const payload: SecCompanyFacts = { facts: { "us-gaap": { CommonStockSharesOutstanding: { units: { shares: [
    { val: 652_000_000, end: "2026-01-30", filed: "2026-03-16", form: "10-K", accn: "0001-26-000001" },
    { val: 649_000_000, end: "2026-05-01", filed: "2026-06-09", form: "10-Q", accn: "0001-26-000002" },
  ] } } } } };

  const fact = latestSharesOutstanding(payload);
  assert.equal(fact?.val, 649_000_000);
  assert.equal(fact?.concept, "CommonStockSharesOutstanding");
  assert.equal(fact?.end, "2026-05-01");
});

test("sums unique multi-class cover-page facts from a direct SEC filing", () => {
  const filing: ShareFiling = {
    form: "10-Q",
    accessionNumber: "0001-26-000003",
    primaryDocument: "example.htm",
    filingDate: "2026-05-07",
    reportDate: "2026-03-31",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/1/000126000003/example.htm",
  };
  const html = `
    <xbrli:context id="class-a"><xbrli:period><xbrli:instant>2026-04-17</xbrli:instant></xbrli:period></xbrli:context>
    <xbrli:context id="class-b"><xbrli:period><xbrli:instant>2026-04-17</xbrli:instant></xbrli:period></xbrli:context>
    <ix:nonFraction unitRef="shares" contextRef="class-a" name="dei:EntityCommonStockSharesOutstanding" scale="0">417,930,233</ix:nonFraction>
    <ix:nonFraction unitRef="shares" contextRef="class-b" name="dei:EntityCommonStockSharesOutstanding" scale="0">175,574,690</ix:nonFraction>
  `;

  const fact = sharesFromInlineFiling(html, filing);
  assert.equal(fact?.val, 593_504_923);
  assert.equal(fact?.end, "2026-04-17");
  assert.equal(fact?.sourceUrl, filing.sourceUrl);
});

test("shows Tesla annual revenue from 2022 through 2025 instead of the stale 2018 point", () => {
  const facts = [
    { metricKey: "revenue", fiscalPeriod: "Q2", periodEnd: "2026-06-30", value: 50_623_000_000 },
    { metricKey: "revenue", fiscalPeriod: "FY", periodEnd: "2025-12-31", value: 94_827_000_000 },
    { metricKey: "revenue", fiscalPeriod: "FY", periodEnd: "2024-12-31", value: 97_690_000_000 },
    { metricKey: "revenue", fiscalPeriod: "FY", periodEnd: "2023-12-31", value: 96_773_000_000 },
    { metricKey: "revenue", fiscalPeriod: "FY", periodEnd: "2022-12-31", value: 81_462_000_000 },
    { metricKey: "revenue", fiscalPeriod: "FY", periodEnd: "2018-12-31", value: 21_461_268_000 },
  ];

  const displayed = selectDisplayedFact("TSLA", "revenue", facts);
  assert.equal(displayed?.periodEnd, "2025-12-31");
  assert.equal(filingHistoryLabel("TSLA", displayed!, "Revenue"), "Annual revenue");
  assert.deepEqual(selectComparableHistory("TSLA", facts, displayed!).map((fact) => fact.periodEnd), [
    "2025-12-31",
    "2024-12-31",
    "2023-12-31",
    "2022-12-31",
  ]);
});

test("merges equivalent Tesla revenue tags so the 2022 Q2 fact is not skipped", () => {
  const payload: MetricCompanyFacts = { facts: { "us-gaap": {
    RevenueFromContractWithCustomerExcludingAssessedTax: { units: { USD: [
      { val: 7_410_982_000, start: "2018-01-01", end: "2018-06-30", fy: 2018, fp: "Q2", form: "10-Q", filed: "2018-08-06", accn: "0001-18-000001" },
      { val: 48_256_000_000, start: "2023-01-01", end: "2023-06-30", fy: 2024, fp: "Q2", form: "10-Q", filed: "2024-07-24", accn: "0001-24-000001" },
    ] } },
    Revenues: { units: { USD: [
      { val: 35_690_000_000, start: "2022-01-01", end: "2022-06-30", fy: 2023, fp: "Q2", form: "10-Q", filed: "2023-07-24", accn: "0001-23-000001" },
    ] } },
  } } };

  const revenue = normalizeCompanyFacts("1318605", payload).filter((fact) => fact.metricKey === "revenue");
  assert.deepEqual(revenue.map((fact) => fact.periodEnd), ["2023-06-30", "2022-06-30", "2018-06-30"]);
  assert.equal(revenue.find((fact) => fact.periodEnd === "2022-06-30")?.concept, "Revenues");
});

test("prefers standalone 10-Q facts and labels cumulative facts explicitly", () => {
  const payload: MetricCompanyFacts = { facts: { "us-gaap": {
    RevenueFromContractWithCustomerExcludingAssessedTax: { units: { USD: [
      { val: 2_642_100_000, start: "2026-01-01", end: "2026-06-30", fy: 2026, fp: "Q2", form: "10-Q", filed: "2026-08-05", accn: "0001-26-000001" },
      { val: 1_596_700_000, start: "2026-04-01", end: "2026-06-30", fy: 2026, fp: "Q2", form: "10-Q", filed: "2026-08-05", accn: "0001-26-000001" },
    ] } },
  } } };

  const revenue = normalizeCompanyFacts("1411579", payload).find((fact) => fact.metricKey === "revenue");
  assert.equal(revenue?.value, 1_596_700_000);
  assert.equal(filingPeriodLabel(revenue!), "Q2 · three months ended 2026-06-30");
  assert.equal(filingPeriodLabel({ metricKey: "operating_cash_flow", fiscalPeriod: "Q2", periodStart: "2026-01-01", periodEnd: "2026-06-30" }), "Q2 YTD · six months ended 2026-06-30");
  assert.equal(filingPeriodLabel({ metricKey: "cash", fiscalPeriod: "Q2", periodStart: null, periodEnd: "2026-06-30" }), "Q2 · as of 2026-06-30");
});
