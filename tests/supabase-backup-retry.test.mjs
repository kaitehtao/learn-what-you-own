import assert from "node:assert/strict";
import test from "node:test";
import {
  isTransientSupabaseDatabaseError,
  retryTransientSupabaseOperation,
} from "../scripts/supabase-backup-retry.mjs";

test("recognizes the Supabase pooler auth-query timeout as transient", () => {
  assert.equal(isTransientSupabaseDatabaseError(new Error("FATAL: (EAUTHQUERY) auth_query secret check timed out")), true);
  assert.equal(isTransientSupabaseDatabaseError(new Error("password authentication failed")), false);
});

test("refreshes and retries after transient Supabase connection failures", async () => {
  let calls = 0;
  const waits = [];
  const notices = [];
  const result = await retryTransientSupabaseOperation("Supabase pg_dump", () => {
    calls += 1;
    if (calls < 3) throw new Error("FATAL: (EAUTHQUERY) auth_query secret check timed out");
    return "backup-complete";
  }, {
    delaysMs: [5, 15, 30],
    sleep: async (milliseconds) => waits.push(milliseconds),
    onRetry: (message) => notices.push(message),
  });

  assert.equal(result, "backup-complete");
  assert.equal(calls, 3);
  assert.deepEqual(waits, [5, 15]);
  assert.equal(notices.length, 2);
});

test("does not retry permanent database failures", async () => {
  let calls = 0;
  await assert.rejects(
    retryTransientSupabaseOperation("Supabase pg_dump", () => {
      calls += 1;
      throw new Error("password authentication failed");
    }, { sleep: async () => {} }),
    /password authentication failed/,
  );
  assert.equal(calls, 1);
});
