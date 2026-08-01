import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "8c2f7a1b-aa6e-45be-8e89-8c64bb0be557";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  // Preserve a direct fallback URL for smoke tests and incident recovery.
  workers_dev: true,
  // Supabase's public runtime values are managed in the Cloudflare dashboard.
  // Preserve them when the Git integration runs `wrangler deploy`.
  keep_vars: true,
  // Keep the canonical public origin attached to this Worker. Without an
  // explicit route, a successful workers.dev deploy can leave the apex domain
  // serving an older Sites deployment.
  routes: [
    { pattern: "learnwhatyouown.com", custom_domain: true },
    { pattern: "www.learnwhatyouown.com/*", zone_name: "learnwhatyouown.com" },
  ],
  // 15:00 UTC is 08:00 PDT; 16:00 UTC is 08:00 PST. The Worker confirms
  // America/Los_Angeles local time before delivering, so only one run proceeds.
  triggers: { crons: ["0 15,16 * * *"] },
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
