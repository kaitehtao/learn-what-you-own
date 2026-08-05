/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  NOTIFICATION_CRON_SECRET: string;
  SITES_MIRROR_CRON_SECRET?: string;
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
const SITES_MIRROR_ORIGIN = "https://learn-what-you-own.julianspencer.chatgpt.site";
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

async function runScheduledEndpoint(env: Env, ctx: ExecutionContext, pathname: string, userAgent: string) {
  if (!env.NOTIFICATION_CRON_SECRET) throw new Error("NOTIFICATION_CRON_SECRET is not configured");
  const siteUrl = (env.NOTIFICATION_SITE_URL || "https://learnwhatyouown.com").replace(/\/$/, "");
  // Invoke the application inside the same Worker deployment. A public
  // self-request can cross a custom-domain or deployment boundary and compare
  // different secret revisions, causing scheduled work to fail with 401.
  return handler.fetch(new Request(`${siteUrl}${pathname}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.NOTIFICATION_CRON_SECRET}`,
      "user-agent": userAgent,
    },
  }), env, ctx);
}

async function deliverScheduledDigest(env: Env, ctx: ExecutionContext) {
  const response = await runScheduledEndpoint(env, ctx, "/api/notifications/email-digest", "learn-what-you-own-daily-digest/1.0");
  if (!response.ok) throw new Error(`Daily digest endpoint returned ${response.status}`);
}

async function refreshScheduledSecFacts(env: Env, ctx: ExecutionContext) {
  const response = await runScheduledEndpoint(env, ctx, "/api/internal/sec-facts-refresh", "learn-what-you-own-sec-refresh/1.0");
  if (!response.ok) throw new Error(`SEC facts refresh endpoint returned ${response.status}`);
}

async function refreshScheduledInsiderActivity(env: Env, ctx: ExecutionContext) {
  const response = await runScheduledEndpoint(env, ctx, "/api/internal/insider-activity-refresh", "learn-what-you-own-insider-activity/1.0");
  if (!response.ok) throw new Error(`SEC insider activity refresh endpoint returned ${response.status}`);
}

async function refreshScheduledEarningsAlerts(env: Env, ctx: ExecutionContext) {
  const response = await runScheduledEndpoint(env, ctx, "/api/internal/earnings-alerts", "learn-what-you-own-earnings-alerts/1.0");
  if (!response.ok) throw new Error(`Earnings alert endpoint returned ${response.status}`);
}

async function refreshScheduledDossiers(env: Env, ctx: ExecutionContext) {
  const response = await runScheduledEndpoint(env, ctx, "/api/internal/dossier-freshness", "learn-what-you-own-dossier-freshness/1.0");
  if (!response.ok) throw new Error(`Dossier freshness endpoint returned ${response.status}`);

  // The public domain is currently dispatched through Sites, whose D1 binding
  // is distinct from the canonical Cloudflare deployment. Mirror the same
  // source-driven scan into that public database so the visible dossier and
  // the operational Worker remain fresh together. Sites does not receive this
  // mirror-only credential, which prevents a future Sites cron from recursing.
  if (!env.SITES_MIRROR_CRON_SECRET) return;
  const mirrorResponse = await fetch(`${SITES_MIRROR_ORIGIN}/api/internal/dossier-freshness`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.SITES_MIRROR_CRON_SECRET}`,
      "user-agent": "learn-what-you-own-dossier-freshness-mirror/1.0",
      "x-lwyo-sites-mirror": "dossier-freshness",
    },
  });
  if (!mirrorResponse.ok) throw new Error(`Sites dossier freshness mirror returned ${mirrorResponse.status}`);
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
    const isAuthorizedMirrorRoute =
      url.pathname === "/api/internal/dossier-freshness" &&
      request.headers.get("x-lwyo-sites-mirror") === "dossier-freshness";
    if (canonicalUrl && !isAuthorizedMirrorRoute) return Response.redirect(canonicalUrl, 308);

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
    // Filing facts rotate through the published dossier universe several times
    // per day. The member digest and earnings alerts still run only at 08:00
    // Pacific, including across daylight-saving changes.
    ctx.waitUntil((async () => {
      if (controller.cron === "*/15 * * * *") {
        await refreshScheduledDossiers(env, ctx);
        return;
      }
      await refreshScheduledSecFacts(env, ctx);
      await refreshScheduledInsiderActivity(env, ctx);
      if (!isPacificDigestHour(controller.scheduledTime)) return;
      await refreshScheduledEarningsAlerts(env, ctx);
      await deliverScheduledDigest(env, ctx);
    })());
  },
};

export default worker;
