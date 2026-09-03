import assert from "node:assert/strict";
import test from "node:test";
import { buildCompletionClaims, completionClaimMetrics } from "../app/data/dossierCompletionClaims";
import { citationExcerptResolves, fetchPrimarySourceDocument, filingEvidenceCatalog, filingEvidenceSnippets, filingHtmlToText, parseNarrativeModelResponse, resolveNarrativeEvidenceIds, withDeadline } from "../app/data/dossierNarrativeText";

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

test("resolves stable model evidence IDs to exact filing excerpts", () => {
  const source = { url: "https://www.sec.gov/Archives/example.htm", text: "The company provides cloud infrastructure services to enterprise customers. Revenue depends on customer demand, product usage, pricing, and disciplined capital investment. Competition may pressure margins and cash flow." };
  const catalog = filingEvidenceCatalog([source]);
  const resolved = resolveNarrativeEvidenceIds({ description: { text: "A sufficiently complete description for validation.", sourceUrl: source.url, sourceExcerpt: catalog[0].id } }, catalog);
  assert.equal((resolved.description as { sourceExcerpt: string }).sourceExcerpt, catalog[0].excerpt);
  assert.equal(citationExcerptResolves(source.text, catalog[0].excerpt), true);
});

test("server evidence IDs repair a model-copied filing URL mismatch", () => {
  const sources = [
    { url: "https://www.sec.gov/Archives/annual.htm", text: "The business provides software services to customers through recurring contracts and usage arrangements." },
    { url: "https://www.sec.gov/Archives/quarterly.htm", text: "Revenue and cash flow depend on demand, pricing, customer retention, competition, and disciplined capital allocation." },
  ];
  const catalog = filingEvidenceCatalog(sources);
  const quarterly = catalog.find((entry) => entry.url === sources[1].url);
  assert.ok(quarterly);
  const resolved = resolveNarrativeEvidenceIds({
    description: { text: "A sufficiently complete description for validation.", sourceUrl: sources[0].url, sourceExcerpt: quarterly.id },
  }, catalog) as { description: { sourceUrl: string; sourceExcerpt: string } };
  assert.equal(resolved.description.sourceUrl, sources[1].url);
  assert.equal(resolved.description.sourceExcerpt, quarterly.excerpt);
  assert.equal(citationExcerptResolves(sources[1].text, resolved.description.sourceExcerpt), true);
});

test("server evidence IDs resolve when the model wraps the ID in extra text", () => {
  const source = { url: "https://www.sec.gov/Archives/annual.htm", text: "The business provides software services to customers through recurring contracts and usage arrangements." };
  const catalog = filingEvidenceCatalog([source]);
  const resolved = resolveNarrativeEvidenceIds({
    description: { text: "A sufficiently complete description for validation.", sourceUrl: source.url, sourceExcerpt: `Evidence: ${catalog[0].id}` },
  }, catalog) as { description: { sourceUrl: string; sourceExcerpt: string } };
  assert.equal(resolved.description.sourceUrl, source.url);
  assert.equal(resolved.description.sourceExcerpt, catalog[0].excerpt);
});

test("server evidence IDs restore an omitted model source URL", () => {
  const source = { url: "https://www.sec.gov/Archives/annual.htm", text: "The business provides software services to customers through recurring contracts and usage arrangements." };
  const catalog = filingEvidenceCatalog([source]);
  const resolved = resolveNarrativeEvidenceIds({
    description: { text: "A sufficiently complete description for validation.", sourceExcerpt: catalog[0].id },
  }, catalog) as { description: { sourceUrl: string; sourceExcerpt: string } };
  assert.equal(resolved.description.sourceUrl, source.url);
  assert.equal(resolved.description.sourceExcerpt, catalog[0].excerpt);
});

test("snaps a lightly paraphrased excerpt back to an unambiguous server evidence snippet", () => {
  const source = { url: "https://www.sec.gov/Archives/annual.htm", text: "The business provides software services to enterprise customers through recurring contracts and usage based arrangements. Revenue depends on customer demand and disciplined capital allocation." };
  const catalog = filingEvidenceCatalog([source]);
  const resolved = resolveNarrativeEvidenceIds({
    description: {
      text: "A sufficiently complete description for validation.",
      sourceUrl: source.url,
      sourceExcerpt: "The business provides software services to enterprise customers through recurring contracts and usage arrangements.",
    },
  }, catalog) as { description: { sourceExcerpt: string } };
  assert.equal(resolved.description.sourceExcerpt, catalog[0].excerpt);
  assert.equal(citationExcerptResolves(source.text, resolved.description.sourceExcerpt), true);
});

test("does not snap an ambiguous or weak excerpt to filing evidence", () => {
  const source = { url: "https://www.sec.gov/Archives/annual.htm", text: "The business provides software services to customers. Revenue depends on demand and pricing. Competition may pressure margins and cash flow." };
  const catalog = filingEvidenceCatalog([source]);
  const raw = "Management believes the future could be attractive.";
  const resolved = resolveNarrativeEvidenceIds({ description: { text: "Analysis.", sourceUrl: source.url, sourceExcerpt: raw } }, catalog) as { description: { sourceExcerpt: string } };
  assert.equal(resolved.description.sourceExcerpt, raw);
});

test("retries a transient primary-source rate limit", async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;
  globalThis.fetch = (async () => {
    attempts += 1;
    if (attempts === 1) return new Response("slow down", { status: 429, headers: { "retry-after": "0" } });
    return new Response("<p>Filed business evidence</p>", { status: 200, headers: { "content-type": "text/html" } });
  }) as typeof fetch;
  try {
    const result = await fetchPrimarySourceDocument("https://www.sec.gov/Archives/test.htm", "test-agent", { maxAttempts: 2, baseDelayMs: 100 });
    assert.equal(new TextDecoder().decode(result.bytes), "<p>Filed business evidence</p>");
    assert.equal(attempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
