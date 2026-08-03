import assert from "node:assert/strict";
import test from "node:test";
import {
  contributionAssetDescriptor,
  normalizeGoogleSheetUrl,
} from "../app/contribution-research-assets";

test("normalizes only Google Sheets document URLs into safe view and embed URLs", () => {
  const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz_123456";
  assert.deepEqual(normalizeGoogleSheetUrl(`https://docs.google.com/spreadsheets/d/${id}/edit#gid=0`), {
    viewUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
    embedUrl: `https://docs.google.com/spreadsheets/d/${id}/preview`,
  });
  assert.equal(normalizeGoogleSheetUrl(`https://evil.example/spreadsheets/d/${id}/edit`), null);
  assert.equal(normalizeGoogleSheetUrl("javascript:alert(1)"), null);
});

test("accepts signed PDF reports and XLSX or CSV earnings models", () => {
  const pdf = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])], "report.pdf", { type: "application/pdf" });
  const xlsx = new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00])], "model.xlsx");
  const csv = new File(["quarter,revenue\nQ1,100"], "model.csv", { type: "text/csv" });
  assert.equal(contributionAssetDescriptor(pdf, "research_report", new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))?.mimeType, "application/pdf");
  assert.equal(contributionAssetDescriptor(xlsx, "earnings_model", new Uint8Array([0x50, 0x4b, 0x03, 0x04]))?.extension, "xlsx");
  assert.equal(contributionAssetDescriptor(csv, "earnings_model", new TextEncoder().encode("quarter,revenue\nQ1,100"))?.extension, "csv");
  assert.equal(contributionAssetDescriptor(pdf, "earnings_model", new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])), null);
});
