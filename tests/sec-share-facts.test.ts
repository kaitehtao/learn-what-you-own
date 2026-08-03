import assert from "node:assert/strict";
import test from "node:test";
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
