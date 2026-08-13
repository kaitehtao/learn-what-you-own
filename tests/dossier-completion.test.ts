import assert from "node:assert/strict";
import test from "node:test";
import { buildCompletionClaims, completionClaimMetrics } from "../app/data/dossierCompletionClaims";
import { citationExcerptResolves, filingEvidenceSnippets, filingHtmlToText, parseNarrativeModelResponse, withDeadline } from "../app/data/dossierNarrativeText";

test("completion packets satisfy the active evidence dimensions before automatic validation", () => {
  const claims = buildCompletionClaims({
    lede: "The owner lens depends on durable demand and disciplined capital allocation.",
    sells: "The company sells a documented portfolio of products and services.",
    revenueModel: "Revenue is earned through product sales and recurring services.",
    opportunity: "The company can expand as its served market grows.",
    mustGoRight: "Execution, margins, and capital allocation must remain disciplined.",
    thesisBreaker: "The thesis breaks if customer value and returns deteriorate structurally.",
    bull: ["Scale and product depth can support durable growth."],
    bear: ["Competition and investment requirements can pressure returns."],
    financialDrivers: [{ label: "REVENUE", value: "Growth", detail: "Volume, price, and mix" }],
    risks: [{ title: "Execution", text: "Delivery and cost control remain material.", signal: "Margins and cash conversion" }],
  }, [
    { title: "2025 Form 10-K", url: "https://www.sec.gov/example-10k", evidenceDate: "2026-02-01", excerpt: "Annual filing evidence", sourceType: "sec_filing" },
    { title: "Investor relations", url: "https://example.com/investors", evidenceDate: "2026-02-01", excerpt: "Company materials", sourceType: "investor_relations" },
  ]);
  const metrics = completionClaimMetrics(claims);
  assert.equal(metrics.claims, 10);
  assert.equal(metrics.sections, 10);
  assert.equal(metrics.claimTypes, 2);
  assert.ok(claims.every((claim) => claim.sourceUrl.startsWith("https://")));
  assert.ok(claims.every((claim) => !("status" in claim)), "previews must not carry a publish status");
});

test("completion packets reject structurally incomplete narrative", () => {
  assert.throws(() => buildCompletionClaims({
    lede: "Owner lens", sells: "Products", revenueModel: "Sales", opportunity: "Growth", mustGoRight: "Execution", thesisBreaker: "Failure",
    bull: [], bear: ["Risk"], financialDrivers: [{ label: "Revenue", value: "Growth", detail: "Volume" }], risks: [{ title: "Risk", text: "Risk text", signal: "Signal" }],
  }, [
    { title: "10-K", url: "https://www.sec.gov/a", evidenceDate: "2026-01-01", excerpt: "A", sourceType: "sec_filing" },
    { title: "IR", url: "https://example.com/ir", evidenceDate: "2026-01-01", excerpt: "B", sourceType: "investor_relations" },
  ]), /Bull, bear/);
});

test("filing HTML extraction removes executable and presentation markup", () => {
  const result = filingHtmlToText(`<style>.x{display:none}</style><script>alert(1)</script><h1>Business &amp; operations</h1><p>Recurring revenue</p>`);
  assert.equal(result, "Business & operations\nRecurring revenue");
  assert.doesNotMatch(result, /display|alert|<p>/);
});

test("accepts Workers AI JSON-mode and chat-compatible narrative responses", () => {
  assert.deepEqual(parseNarrativeModelResponse({ response: { ticker: "SHOP" } }), { ticker: "SHOP" });
  assert.deepEqual(parseNarrativeModelResponse({ choices: [{ message: { content: "```json\n{\"ticker\":\"SCCO\"}\n```" } }] }), { ticker: "SCCO" });
  assert.deepEqual(parseNarrativeModelResponse({ choices: [{ message: { content: [{ type: "output_text", text: "{\"description\":{},\"lede\":{},\"sells\":{}}" }] } }] }), { description: {}, lede: {}, sells: {} });
});

test("resolves filing excerpts across harmless punctuation and whitespace changes", () => {
  assert.equal(citationExcerptResolves("The company’s revenue depends on customer demand — and disciplined execution over time.", "company's revenue depends on customer demand - and disciplined execution"), true);
  assert.equal(citationExcerptResolves("The company has material risks.", "This unsupported claim does not occur in the filing at all"), false);
});

test("builds compact verbatim filing evidence snippets", () => {
  const text = "The company provides cloud infrastructure services to enterprise customers. Revenue depends on customer demand, product usage, pricing, and disciplined capital investment. Competition may pressure margins and cash flow.";
  const snippets = filingEvidenceSnippets(text, 4);
  assert.ok(snippets.length >= 1);
  assert.ok(snippets.every((snippet) => text.includes(snippet)));
  assert.ok(snippets.every((snippet) => snippet.split(/\s+/).length >= 12));
});

test("bounds stalled model work with an explicit deadline", async () => {
  await assert.rejects(withDeadline(new Promise(() => undefined), 5, "Test model"), /Test model exceeded/);
});
