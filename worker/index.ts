/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import {
  processDossierSourceBackfillMessage,
  recordDossierSourceBackfillFailure,
  type DossierSourceBackfillMessage,
} from "../app/data/dossierSourceBackfill";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  NOTIFICATION_CRON_SECRET: string;
  NOTIFICATION_SITE_URL?: string;
  DOSSIER_INGESTION_QUEUE: Queue<DossierSourceBackfillMessage>;
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
const DOSSIER_QUEUE_MAX_ATTEMPTS = 5;
const CANONICAL_ORIGIN = "https://learnwhatyouown.com";
const PUBLIC_ALIAS_HOSTS = new Set([
  "www.learnwhatyouown.com",
  "learn-what-you-own.julianspencer.chatgpt.site",
]);
const PRIVATE_SEARCH_PATH_PREFIXES = [
  "/account", "/admin", "/api", "/login", "/messages", "/notebook",
  "/notifications", "/onboarding", "/portfolio", "/watchlist", "/workspace",
];

export function canonicalPublicUrl(requestUrl: string) {
  const url = new URL(requestUrl);
  const hostname = url.hostname.toLowerCase();
  const isPublicAlias = PUBLIC_ALIAS_HOSTS.has(hostname);
  const isInsecureCanonicalOrigin = hostname === "learnwhatyouown.com" && url.protocol !== "https:";
  if (!isPublicAlias && !isInsecureCanonicalOrigin) return null;
  const canonical = new URL(`${url.pathname}${url.search}`, CANONICAL_ORIGIN);
  return canonical.toString();
}

function withSearchHeaders(requestUrl: string, response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.toLowerCase().includes("text/html")) return response;
  const url = new URL(requestUrl);
  const headers = new Headers(response.headers);
  const canonical = new URL(url.pathname, CANONICAL_ORIGIN).toString();
  headers.append("link", `<${canonical}>; rel=\"canonical\"`);
  if (PRIVATE_SEARCH_PATH_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
    headers.set("x-robots-tag", "noindex, nofollow");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
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
  // Cloudflare and its D1 binding are the sole scheduled-research authority.
  // The optional Sites project is redirect-only and must never receive writes.
  const response = await runScheduledEndpoint(
    env,
    ctx,
    "/api/internal/dossier-freshness?limit=10",
    "learn-what-you-own-dossier-freshness/1.0",
  );
  if (!response.ok) throw new Error(`Dossier freshness endpoint returned ${response.status}`);
}

async function discoverScheduledSecFilings(env: Env, ctx: ExecutionContext) {
  const response = await runScheduledEndpoint(env, ctx, "/api/internal/sec-current-filings?limit=25", "learn-what-you-own-sec-current-filings/1.0");
  if (!response.ok) throw new Error(`SEC current-filings endpoint returned ${response.status}`);
}

async function backfillScheduledFilingChanges(env: Env, ctx: ExecutionContext) {
  const response = await runScheduledEndpoint(env, ctx, "/api/internal/filing-change-backfill?limit=25", "learn-what-you-own-filing-change-backfill/1.0");
  if (!response.ok) throw new Error(`Filing change backfill endpoint returned ${response.status}`);
}

async function backfillScheduledDossierSources(env: Env, ctx: ExecutionContext) {
  const response = await runScheduledEndpoint(env, ctx, "/api/internal/dossier-source-backfill?limit=12", "learn-what-you-own-sec-source-backfill/1.0");
  if (!response.ok) throw new Error(`Dossier source backfill endpoint returned ${response.status}`);
}

async function completeScheduledDossiers(env: Env, ctx: ExecutionContext) {
  const response = await runScheduledEndpoint(env, ctx, "/api/internal/dossier-completion?limit=10", "learn-what-you-own-benchmark-completion/1.0");
  if (!response.ok) throw new Error(`Automatic benchmark completion endpoint returned ${response.status}`);
}

async function refreshScheduledCompanyProfiles(env: Env, ctx: ExecutionContext) {
  const response = await runScheduledEndpoint(env, ctx, "/api/internal/company-profile-refresh", "learn-what-you-own-company-profile/1.0");
  if (!response.ok) throw new Error(`Company profile refresh endpoint returned ${response.status}`);
}

async function refreshScheduledRolloutMarketCaps(env: Env, ctx: ExecutionContext) {
  const response = await runScheduledEndpoint(
    env,
    ctx,
    "/api/internal/rollout-market-cap-refresh",
    "learn-what-you-own-market-cap-ranking/1.0",
  );
  if (!response.ok) throw new Error(`Market-cap ranking endpoint returned ${response.status}`);
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

    const response = await handler.fetch(request, env, ctx);
    return withSearchHeaders(request.url, response);
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // Filing facts rotate through the published dossier universe in bounded
    // five-minute batches. The member digest and earnings alerts still run only at 08:00
    // Pacific, including across daylight-saving changes.
    ctx.waitUntil((async () => {
      if (controller.cron === "0-59/5 * * * *") {
        await refreshScheduledSecFacts(env, ctx);
        return;
      }
      if (controller.cron === "1-59/5 * * * *") {
        await discoverScheduledSecFilings(env, ctx);
        return;
      }
      if (controller.cron === "2-59/5 * * * *") {
        await Promise.all([
          backfillScheduledDossierSources(env, ctx),
          completeScheduledDossiers(env, ctx),
        ]);
        return;
      }
      if (controller.cron === "3-59/5 * * * *") {
        await backfillScheduledFilingChanges(env, ctx);
        // Use the otherwise idle remainder of this scheduled invocation for a
        // second bounded narrative attempt. The completion lease prevents an
        // overlap if the minute-two attempt is still running.
        await completeScheduledDossiers(env, ctx);
        return;
      }
      if (controller.cron === "4-59/5 * * * *") {
        await refreshScheduledCompanyProfiles(env, ctx);
        return;
      }
      if (controller.cron === "*/15 * * * *") {
        await refreshScheduledDossiers(env, ctx);
        return;
      }
      await refreshScheduledRolloutMarketCaps(env, ctx);
      await refreshScheduledInsiderActivity(env, ctx);
      if (!isPacificDigestHour(controller.scheduledTime)) return;
      await refreshScheduledEarningsAlerts(env, ctx);
      await deliverScheduledDigest(env, ctx);
    })());
  },

  async queue(batch: MessageBatch<DossierSourceBackfillMessage>): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processDossierSourceBackfillMessage(message.body);
        message.ack();
      } catch (error) {
        const terminal = message.attempts >= DOSSIER_QUEUE_MAX_ATTEMPTS;
        await recordDossierSourceBackfillFailure(message.body, error, terminal);
        if (terminal) {
          console.error(`Dossier ingestion permanently failed for ${message.body.ticker}`, error);
          message.ack();
        } else {
          const delaySeconds = Math.min(3_600, 30 * (2 ** Math.max(0, message.attempts - 1)));
          console.warn(`Dossier ingestion retry ${message.attempts} for ${message.body.ticker} in ${delaySeconds}s`);
          message.retry({ delaySeconds });
        }
      }
    }
  },
};

export default worker;
