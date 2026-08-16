import assert from "node:assert/strict";
import test from "node:test";
import { parseSecCurrentFeed } from "../app/data/secCurrentFeedParser";

test("parses SEC current-filings Atom entries for tracked-accession discovery", () => {
  const rows = parseSecCurrentFeed(`<?xml version="1.0"?><feed><entry>
    <title>10-Q - Example Holdings (0000123456) (Filer)</title>
    <id>urn:tag:sec.gov,2008:accession-number=0000123456-26-000007</id>
    <category scheme="https://www.sec.gov/" term="10-Q" />
    <summary type="html">&lt;b&gt;Filed:&lt;/b&gt; 2026-08-14 &lt;b&gt;AccNo:&lt;/b&gt; 0000123456-26-000007</summary>
  </entry></feed>`);
  assert.deepEqual(rows, [{ cik: "123456", accessionNumber: "0000123456-26-000007", form: "10-Q", filingDate: "2026-08-14" }]);
});

test("ignores malformed Atom entries instead of creating false filings", () => {
  assert.deepEqual(parseSecCurrentFeed("<feed><entry><title>Incomplete</title></entry></feed>"), []);
});
