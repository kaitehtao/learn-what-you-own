import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const companies = [
  ["A", "0001090872"],
  ["AA", "0001675149"],
  ["AAL", "0000006201"],
  ["AAMI", "0001748824"],
  ["AAOI", "0001158114"],
  ["AAON", "0000824142"],
  ["AAP", "0001158449"],
  ["AAPL", "0000320193"],
  ["AAT", "0001500217"],
  ["ABAT", "0001576873"],
];

const outputDirectory = process.argv[2];
if (!outputDirectory) throw new Error("Pass an output directory.");
await mkdir(outputDirectory, { recursive: true });

const headers = {
  accept: "application/json,text/html",
  "user-agent": "LearnWhatYouOwn/1.0 research@learnwhatyouown.com",
};

function filingText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const manifest = [];
for (const [ticker, cik] of companies) {
  const submissionsUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;
  const submissionsResponse = await fetch(submissionsUrl, { headers });
  if (!submissionsResponse.ok) throw new Error(`${ticker}: submissions returned ${submissionsResponse.status}`);
  const submissions = await submissionsResponse.json();
  const recent = submissions.filings?.recent;
  const index = recent?.form?.findIndex((form) => form === "10-K") ?? -1;
  if (index < 0) throw new Error(`${ticker}: no recent 10-K found`);

  const accessionNumber = recent.accessionNumber[index];
  const primaryDocument = recent.primaryDocument[index];
  const accessionCompact = accessionNumber.replaceAll("-", "");
  const cikCompact = String(Number(cik));
  const filingUrl = `https://www.sec.gov/Archives/edgar/data/${cikCompact}/${accessionCompact}/${primaryDocument}`;
  const filingResponse = await fetch(filingUrl, { headers: { ...headers, accept: "text/html" } });
  if (!filingResponse.ok) throw new Error(`${ticker}: filing returned ${filingResponse.status}`);
  const text = filingText(await filingResponse.text());
  await writeFile(path.join(outputDirectory, `${ticker}.txt`), text, "utf8");
  manifest.push({
    ticker,
    cik,
    companyName: submissions.name,
    form: recent.form[index],
    filedAt: recent.filingDate[index],
    reportDate: recent.reportDate[index],
    accessionNumber,
    primaryDocument,
    filingUrl,
    submissionsUrl,
    textCharacters: text.length,
  });
}

await writeFile(path.join(outputDirectory, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(JSON.stringify(manifest, null, 2));
