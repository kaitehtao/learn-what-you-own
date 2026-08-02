import assert from "node:assert/strict";
import test from "node:test";
import { stripNewsHtml } from "../app/news-text";

test("removes unwrapped Q4 and PR Newswire stylesheet rules from release summaries", () => {
  const summary = `
    .q4default span.prnews_span { font-size: 8pt; font-family: "Arial"; color: rgb(0, 0, 0) }
    .q4default a.prnews_a { color: rgb(0, 0, 255) }
    .q4default li.prnews_li { font-size: 8pt; font-family: "Arial" }
    .q4default p.prnews_p { font-size: 0.62em; margin: 0 }
    .q4default .prntac { text-align: center }
    Meta and BlackRock announce a venture to finance the development of a data center in El Paso.
  `;
  const cleaned = stripNewsHtml(summary);
  assert.equal(cleaned, "Meta and BlackRock announce a venture to finance the development of a data center in El Paso.");
  assert.doesNotMatch(cleaned, /q4default|prnews_|font-size|text-align/);
});
