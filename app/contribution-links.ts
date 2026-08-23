const MAX_RELEVANT_LINKS = 5;
const MAX_RELEVANT_LINK_LENGTH = 1_000;

export function normalizeRelevantLinks(input: unknown) {
  const values = Array.isArray(input) ? input : String(input ?? "").split(/\r?\n/);
  const normalized: string[] = [];

  for (const value of values) {
    let candidate = String(value ?? "").trim();
    if (!candidate) continue;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) candidate = `https://${candidate}`;
    if (candidate.length > MAX_RELEVANT_LINK_LENGTH) return null;
    try {
      const url = new URL(candidate);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
      const href = url.toString();
      if (!normalized.includes(href)) normalized.push(href);
    } catch {
      return null;
    }
  }

  return normalized.length <= MAX_RELEVANT_LINKS ? normalized : null;
}

export function relevantLinkLabel(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    if (hostname === "x.com" || hostname === "twitter.com") return "View X post";
    return `View ${hostname}`;
  } catch {
    return "Open relevant link";
  }
}
