import assert from "node:assert/strict";
import test from "node:test";
import { aggregateSecReportingInsiders, parseSecOwnershipXml, recentOwnershipFilings, secTransactionDirection } from "../app/data/secOwnership";
import type { SecSubmissions } from "../app/data/secShareFacts";

const submissions: SecSubmissions = { filings: { recent: {
  form: ["4", "8-K", "4/A", "3"],
  accessionNumber: ["0001534034-26-000003", "0001671933-26-000100", "0001534034-26-000002", "0001534034-25-000001"],
  primaryDocument: ["xslF345X06/wk-form4_1783975342.xml", "ttd-20260801.htm", "form4a.xml", "form3.xml"],
  filingDate: ["2026-07-13", "2026-08-01", "2026-06-15", "2025-11-01"],
  reportDate: ["2026-07-09", "2026-08-01", "2026-06-12", "2025-10-30"],
} } };

const form4 = `<?xml version="1.0"?>
<ownershipDocument>
  <documentType>4</documentType><periodOfReport>2026-07-09</periodOfReport>
  <issuer><issuerCik>0001671933</issuerCik><issuerName>The Trade Desk, Inc.</issuerName><issuerTradingSymbol>TTD</issuerTradingSymbol></issuer>
  <reportingOwner><reportingOwnerId><rptOwnerName>Price Penry W</rptOwnerName></reportingOwnerId>
    <reportingOwnerRelationship><isDirector>1</isDirector><isOfficer>0</isOfficer><isTenPercentOwner>0</isTenPercentOwner><isOther>0</isOther></reportingOwnerRelationship>
  </reportingOwner>
  <nonDerivativeTable>
    <nonDerivativeTransaction><securityTitle><value>Class A Common Stock</value></securityTitle><transactionDate><value>2026-07-09</value></transactionDate>
      <transactionCoding><transactionCode>P</transactionCode></transactionCoding><transactionAmounts><transactionShares><value>1,250</value></transactionShares><transactionPricePerShare><value>72.50</value></transactionPricePerShare><transactionAcquiredDisposedCode><value>A</value></transactionAcquiredDisposedCode></transactionAmounts>
      <postTransactionAmounts><sharesOwnedFollowingTransaction><value>10,250</value></sharesOwnedFollowingTransaction></postTransactionAmounts><ownershipNature><directOrIndirectOwnership><value>D</value></directOrIndirectOwnership></ownershipNature>
    </nonDerivativeTransaction>
    <nonDerivativeTransaction><securityTitle><value>Class A Common Stock</value></securityTitle><transactionDate><value>2026-07-10</value></transactionDate>
      <transactionCoding><transactionCode>S</transactionCode></transactionCoding><transactionAmounts><transactionShares><value>250</value></transactionShares><transactionPricePerShare><value>75</value></transactionPricePerShare><transactionAcquiredDisposedCode><value>D</value></transactionAcquiredDisposedCode></transactionAmounts>
      <postTransactionAmounts><sharesOwnedFollowingTransaction><value>10,000</value></sharesOwnedFollowingTransaction></postTransactionAmounts><ownershipNature><directOrIndirectOwnership><value>D</value></directOrIndirectOwnership></ownershipNature>
    </nonDerivativeTransaction>
  </nonDerivativeTable>
  <derivativeTable><derivativeTransaction><securityTitle><value>Stock Option</value></securityTitle><transactionDate><value>2026-07-09</value></transactionDate><transactionCoding><transactionCode>A</transactionCode></transactionCoding><transactionAmounts><transactionShares><value>25,505</value></transactionShares><transactionPricePerShare><value>0</value></transactionPricePerShare><transactionAcquiredDisposedCode><value>A</value></transactionAcquiredDisposedCode></transactionAmounts><postTransactionAmounts><sharesOwnedFollowingTransaction><value>25,505</value></sharesOwnedFollowingTransaction></postTransactionAmounts></derivativeTransaction></derivativeTable>
</ownershipDocument>`;

test("selects SEC Forms 3, 4, and 5 and converts transformed primary-document paths to raw XML URLs", () => {
  const result = recentOwnershipFilings("0001671933", submissions);
  assert.equal(result.availableRecords, 3);
  assert.equal(result.filings.length, 3);
  assert.equal(result.filings[0]?.rawXmlUrl, "https://www.sec.gov/Archives/edgar/data/1671933/000153403426000003/wk-form4_1783975342.xml");
  assert.equal(result.filings[0]?.sourceUrl, "https://www.sec.gov/Archives/edgar/data/1671933/000153403426000003/xslF345X06/wk-form4_1783975342.xml");
});

test("parses SEC ownership codes into purchases, sales, and other activity", () => {
  const filing = recentOwnershipFilings("0001671933", submissions).filings[0]!;
  const parsed = parseSecOwnershipXml(form4, filing);
  assert.equal(parsed.owners[0]?.name, "Price Penry W");
  assert.equal(parsed.owners[0]?.relation, "Director");
  assert.equal(parsed.issuerCik, "1671933");
  assert.equal(parsed.issuerName, "The Trade Desk, Inc.");
  assert.equal(parsed.issuerTradingSymbol, "TTD");
  assert.equal(parsed.transactions.length, 3);
  assert.equal(parsed.transactions[0]?.direction, "purchase");
  assert.equal(parsed.transactions[0]?.shares, 1_250);
  assert.equal(parsed.transactions[0]?.value, 90_625);
  assert.equal(parsed.transactions[1]?.direction, "sale");
  assert.equal(parsed.transactions[2]?.direction, "other");
  assert.equal(parsed.transactions[2]?.transactionType, "Grant, award, or other acquisition (A)");
  assert.equal(secTransactionDirection("M"), "other");
  assert.deepEqual(aggregateSecReportingInsiders([parsed]).map((owner) => owner.name), ["Price Penry W"]);
});
