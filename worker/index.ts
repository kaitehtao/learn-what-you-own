/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  NOTIFICATION_CRON_SECRET: string;
  NOTIFICATION_SITE_URL?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

const DIGEST_TIME_ZONE = "America/Los_Angeles";
const DIGEST_HOUR = "08";
const CANONICAL_ORIGIN = "https://learnwhatyouown.com";
const PUBLIC_ALIAS_HOSTS = new Set([
  "www.learnwhatyouown.com",
  "learn-what-you-own.julianspencer.chatgpt.site",
]);

export function canonicalPublicUrl(requestUrl: string) {
  const url = new URL(requestUrl);
  if (!PUBLIC_ALIAS_HOSTS.has(url.hostname.toLowerCase())) return null;
  const canonical = new URL(`${url.pathname}${url.search}`, CANONICAL_ORIGIN);
  return canonical.toString();
}

export function isPacificDigestHour(scheduledTime: number) {
  const localHour = new Intl.DateTimeFormat("en-US", {
    timeZone: DIGEST_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(scheduledTime)).find((part) => part.type === "hour")?.value;

  return localHour === DIGEST_HOUR;
}

async function deliverScheduledDigest(env: Env) {
  if (!env.NOTIFICATION_CRON_SECRET) throw new Error("NOTIFICATION_CRON_SECRET is not configured");
  const siteUrl = (env.NOTIFICATION_SITE_URL || "https://learnwhatyouown.com").replace(/\/$/, "");
  const response = await fetch(`${siteUrl}/api/notifications/email-digest`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.NOTIFICATION_CRON_SECRET}`,
      "user-agent": "learn-what-you-own-daily-digest/1.0",
    },
  });

  if (!response.ok) throw new Error(`Daily digest endpoint returned ${response.status}`);
}

async function refreshScheduledSecFacts(env: Env) {
  if (!env.NOTIFICATION_CRON_SECRET) throw new Error("A scheduled-task secret is not configured");
  const siteUrl = (env.NOTIFICATION_SITE_URL || "https://learnwhatyouown.com").replace(/\/$/, "");
  const response = await fetch(`${siteUrl}/api/internal/sec-facts-refresh`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.NOTIFICATION_CRON_SECRET}`,
      "user-agent": "learn-what-you-own-sec-refresh/1.0",
    },
  });
  if (!response.ok) throw new Error(`SEC facts refresh endpoint returned ${response.status}`);
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const canonicalUrl = canonicalPublicUrl(request.url);
    if (canonicalUrl) return Response.redirect(canonicalUrl, 308);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // The trigger runs at both possible 08:00 Pacific UTC offsets. Only the
    // invocation that is actually 08:00 in Los Angeles proceeds, keeping the
    // delivery time stable across daylight-saving changes.
    if (!isPacificDigestHour(controller.scheduledTime)) return;
    ctx.waitUntil(Promise.all([
      deliverScheduledDigest(env),
      refreshScheduledSecFacts(env),
    ]));
  },
};

export default worker;
