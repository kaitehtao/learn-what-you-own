const RETRYABLE_SEC_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

export type SecRequestOptions = {
  timeoutMs?: number;
  maxAttempts?: number;
  baseDelayMs?: number;
};

function wait(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function retryAfterMilliseconds(response: Response) {
  const value = response.headers.get("retry-after");
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.min(30_000, seconds * 1_000));
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, Math.min(30_000, date - Date.now())) : null;
}

export async function fetchSecJson<T>(url: string, userAgent: string, options: SecRequestOptions = {}): Promise<T> {
  const timeoutMs = Math.max(1_000, Math.min(30_000, options.timeoutMs ?? 8_000));
  const maxAttempts = Math.max(1, Math.min(5, options.maxAttempts ?? 3));
  const baseDelayMs = Math.max(100, Math.min(2_000, options.baseDelayMs ?? 300));
  let lastError: unknown;
  let attemptsMade = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    attemptsMade = attempt;
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { accept: "application/json", "user-agent": userAgent },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      await wait(baseDelayMs * (2 ** (attempt - 1)));
      continue;
    }

    if (response.ok) {
      try {
        return await response.json() as T;
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts) break;
        await wait(baseDelayMs * (2 ** (attempt - 1)));
        continue;
      }
    }
    const error = new Error(`SEC request returned ${response.status}.`);
    lastError = error;
    if (!RETRYABLE_SEC_STATUSES.has(response.status) || attempt === maxAttempts) break;
    await wait(retryAfterMilliseconds(response) ?? baseDelayMs * (2 ** (attempt - 1)));
  }

  const detail = lastError instanceof Error ? lastError.message : "Unknown SEC request failure.";
  throw new Error(`SEC request failed after ${attemptsMade} ${attemptsMade === 1 ? "attempt" : "attempts"}: ${detail}`);
}
