import assert from "node:assert/strict";
import test from "node:test";
import { parseSecFiledPressReleases } from "../app/data/secNews";

test("turns SEC-filed Exhibit 99 press releases into clean official company news records", () => {
  const submission = `<SEC-DOCUMENT>
    <DOCUMENT>
      <TYPE>8-K
      <FILENAME>dell-20260801.htm
      <TEXT><html><head><title>Current report</title></head><body>Form 8-K filing body</body></html></TEXT>
    </DOCUMENT>
    <DOCUMENT>
      <TYPE>EX-99.1
      <FILENAME>dell-ex991.htm
      <TEXT><html><head><style>.q4default { font-size: 8pt; }</style><title>Document</title></head><body><font style="font-weight:700">EXHIBIT 99.1</font><font style="font-weight:700">PRESS RELEASE</font><font style="font-weight:700">For Immediate Release</font><font style="font-weight:700">Dell Technologies Announces Second Quarter Fiscal 2027 Financial Results</font><p>ROUND ROCK, Texas — Dell Technologies reports financial results and announces new AI infrastructure demand.</p></body></html></TEXT>
    </DOCUMENT>
    <DOCUMENT>
      <TYPE>EX-99.2
      <FILENAME>dell-presentation.htm
      <TEXT><html><body><h1>Investor Presentation</h1><p>This investor presentation accompanies the earnings call.</p></body></html></TEXT>
    </DOCUMENT>
  </SEC-DOCUMENT>`;
  const releases = parseSecFiledPressReleases(
    submission,
    "https://www.sec.gov/Archives/edgar/data/1571996/000157199626000030",
    "Dell Technologies",
    "2026-08-01",
  );
  assert.equal(releases.length, 1);
  assert.equal(releases[0]?.title, "Dell Technologies Announces Second Quarter Fiscal 2027 Financial Results");
  assert.equal(releases[0]?.publishedAt, "2026-08-01");
  assert.equal(releases[0]?.url, "https://www.sec.gov/Archives/edgar/data/1571996/000157199626000030/dell-ex991.htm");
  assert.equal(releases[0]?.provider, "SEC EDGAR Exhibit 99");
  assert.doesNotMatch(releases[0]?.summary ?? "", /q4default|font-size/i);
});
