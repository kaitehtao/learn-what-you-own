import assert from "node:assert/strict";
import test from "node:test";
import { externalResearchLinks } from "../app/data/externalResearchLinks";

test("builds direct ticker-aware links for the core external research services", () => {
  const links = externalResearchLinks("AAPL", "NASDAQ");
  const byKey = Object.fromEntries(links.map((link) => [link.key, link]));

  assert.equal(links.length, 8);
  assert.equal(byKey["yahoo-finance"].href, "https://finance.yahoo.com/quote/AAPL/");
  assert.equal(byKey["google-finance"].href, "https://www.google.com/finance/quote/AAPL:NASDAQ");
  assert.equal(byKey.tradingview.href, "https://www.tradingview.com/symbols/NASDAQ-AAPL/");
  assert.equal(byKey.stocktwits.href, "https://stocktwits.com/symbol/AAPL");
});

test("uses provider-specific share-class and exchange formats", () => {
  const links = externalResearchLinks("BRK.B", "NYSE");
  const byKey = Object.fromEntries(links.map((link) => [link.key, link]));

  assert.equal(byKey["yahoo-finance"].href, "https://finance.yahoo.com/quote/BRK-B/");
  assert.equal(byKey["google-finance"].href, "https://www.google.com/finance/quote/BRK.B:NYSE");
  assert.equal(byKey.tradingview.href, "https://www.tradingview.com/symbols/NYSE-BRK.B/");
});
