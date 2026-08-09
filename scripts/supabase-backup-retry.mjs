const TRANSIENT_DATABASE_PATTERNS = [
  /EAUTHQUERY/i,
  /auth_query secret check timed out/i,
  /connection .*timed out/i,
  /timeout expired/i,
  /connection reset/i,
  /server closed the connection unexpectedly/i,
  /could not connect to server/i,
  /the database system is starting up/i,
  /too many clients/i,
];

export function isTransientSupabaseDatabaseError(error) {
  const detail = error instanceof Error ? error.message : String(error ?? "");
  return TRANSIENT_DATABASE_PATTERNS.some((pattern) => pattern.test(detail));
}

export async function retryTransientSupabaseOperation(label, operation, options = {}) {
  const attempts = Math.max(1, Number(options.attempts ?? 4));
  const delaysMs = options.delaysMs ?? [5_000, 15_000, 30_000];
  const sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const onRetry = options.onRetry ?? ((message) => console.warn(message));

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (!isTransientSupabaseDatabaseError(error) || attempt >= attempts) throw error;
      const delayMs = Number(delaysMs[Math.min(attempt - 1, delaysMs.length - 1)] ?? 0);
      onRetry(`${label} encountered a transient Supabase connection error on attempt ${attempt}/${attempts}; retrying in ${Math.round(delayMs / 1_000)} seconds.`);
      await sleep(delayMs);
    }
  }
  throw lastError;
}
