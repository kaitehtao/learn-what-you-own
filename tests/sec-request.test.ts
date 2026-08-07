import assert from "node:assert/strict";
import test from "node:test";
import { fetchSecJson } from "../app/data/secRequest";

test("retries a transient SEC response and returns parsed JSON", async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;
  globalThis.fetch = (async () => {
    attempts += 1;
    return attempts === 1
      ? new Response("busy", { status: 503 })
      : Response.json({ ok: true });
  }) as typeof fetch;
  try {
    const result = await fetchSecJson<{ ok: boolean }>("https://data.sec.gov/test", "test-agent", { maxAttempts: 2, baseDelayMs: 100 });
    assert.deepEqual(result, { ok: true });
    assert.equal(attempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not retry a non-transient SEC response", async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;
  globalThis.fetch = (async () => {
    attempts += 1;
    return new Response("missing", { status: 404 });
  }) as typeof fetch;
  try {
    await assert.rejects(
      fetchSecJson("https://data.sec.gov/test", "test-agent", { maxAttempts: 3, baseDelayMs: 100 }),
      /SEC request failed after 1 attempt: SEC request returned 404/,
    );
    assert.equal(attempts, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
