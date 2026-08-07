# Deployment and integration runbook

Use this runbook for local setup, database migrations, and production releases. Read `docs/ARCHITECTURE.md` first.

## Prerequisites

- Node.js `>=22.13.0`
- GitHub write access to `kaitehtao/learn-what-you-own`
- Cloudflare access to account `e5c3672efaf52cf5b417da2b09e687af`
- D1 access to `site-creator-d1` (`8c2f7a1b-aa6e-45be-8e89-8c64bb0be557`)
- Access to the production Supabase project
- Access to the Google OAuth client and verified Resend domain

Never place credential values in this file, a GitHub issue, or a shell transcript.

The authoritative Supabase project reference is `fxmdunpolhqponfchwsz`, with project URL `https://fxmdunpolhqponfchwsz.supabase.co`.

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Populate `.env.local` with the correct project values. The file is ignored by Git.

## Environment inventory

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Public runtime configuration | `https://fxmdunpolhqponfchwsz.supabase.co`. |
| `SUPABASE_PUBLISHABLE_KEY` | Public runtime configuration | Browser-safe key protected by RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret, server-only | Notification delivery and privileged server operations. |
| `RESEND_API_KEY` | Secret, server-only | Sends notification email. |
| `NOTIFICATION_FROM_EMAIL` | Non-secret | `Learn What You Own <notifications@learnwhatyouown.com>`. |
| `NOTIFICATION_SITE_URL` | Non-secret | `https://learnwhatyouown.com`. |
| `NOTIFICATION_CRON_SECRET` | Secret, server-only | Authorizes the scheduled digest endpoint. |
| `CLOUDFLARE_API_TOKEN` | Operator secret, not a Worker variable | CLI deploy/D1 access; restrict it to the named account and resources. |

`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and `NOTIFICATION_CRON_SECRET` must be stored as Cloudflare secrets. The public Supabase values may be dashboard variables. `keep_vars: true` prevents a normal deploy from erasing dashboard-managed values, but the production checklist still verifies them after every release.

## Supabase migrations

Apply each file once, in this order, using the production project's SQL editor or `supabase db push` from a correctly linked Supabase CLI:

1. `supabase/migrations/20260731000000_user_accounts.sql`
2. `supabase/migrations/20260731010000_relationship_contributions.sql`
3. `supabase/migrations/20260801000000_private_messages.sql`
4. `supabase/migrations/20260801010000_member_following_public_messages.sql`
5. `supabase/migrations/20260801020000_private_research_notebooks.sql`
6. `supabase/migrations/20260801030000_member_notifications.sql`
7. `supabase/migrations/20260801040000_admin_dashboard_analytics.sql`
8. `supabase/migrations/20260801050000_company_dossier_proposals.sql`
9. `supabase/migrations/20260801060000_company_research_demand.sql`
10. `supabase/migrations/20260801070000_founder_administrator.sql`
11. `supabase/migrations/20260801080000_admin_email_verification.sql`
12. `supabase/migrations/20260801090000_public_profile_bio_photo.sql`
13. `supabase/migrations/20260801100000_public_profile_research_identity.sql`
14. `supabase/migrations/20260802000000_private_research_attachments.sql`
15. `supabase/migrations/20260802010000_public_contribution_research_assets.sql`
16. `supabase/migrations/20260802020000_server_only_member_rpcs.sql`
17. `supabase/migrations/20260802030000_retire_legacy_definer_rpcs.sql`
18. `supabase/migrations/20260804215235_account_data_portability.sql`
19. `supabase/migrations/20260805010000_long_form_research_publishing.sql`
20. `supabase/migrations/20260805011000_community_safety_records.sql`
21. `supabase/migrations/20260805020000_institutional_analyst_workspace.sql`
22. `supabase/migrations/20260805030000_facts_investment_workflow.sql`
23. `supabase/migrations/20260806042619_admin_action_notifications.sql`

These migrations are designed to preserve member data and establish RLS policies. Never apply them to an unverified project merely because its display name looks similar. Confirm the project reference from `SUPABASE_URL` first.

After migration, verify tables, RLS, unique username enforcement, member role constraints, notification outbox permissions, and that the intended founder account—not merely an account with a similar display name—has the `admin` role. Assign subsequent admin/editor roles only through a trusted SQL/operator session.

## D1 migrations

The authoritative target is always:

```text
account: e5c3672efaf52cf5b417da2b09e687af
database: site-creator-d1
database id: 8c2f7a1b-aa6e-45be-8e89-8c64bb0be557
binding: DB
```

The migration lineage is:

1. `drizzle/0000_strange_roughhouse.sql` — legacy profile/contribution foundation
2. `drizzle/0001_gray_dexter_bennett.sql` — company directory and dossier records
3. `drizzle/0002_polite_betty_brant.sql` — filing facts, evidence claims, and relationship graph
4. `drizzle/0003_legacy-companies-compat.sql` — idempotent compatibility parent table
5. `drizzle/0004_seed-onds-sec-facts.sql` — controlled ONDS filing-fact seed
6. `drizzle/0005_emerging-companies-and-aapl-supply-chain.sql` — emerging-company records and initial relationship evidence
7. `drizzle/0006_official-exchange-universe.sql` — official catalog metadata and lookup indexes
8. `drizzle/0007_sec-fact-import-status.sql` — SEC Company Facts refresh state and audit metadata
9. `drizzle/0008_product_feedback.sql` — private, verified-member product feedback and moderation status
10. `drizzle/0009_external_intelligence.sql` — open-data source registry and moderated external observations

Later additive production migrations continue the numbered lineage. In particular,
`drizzle/0035_russell_sec_source_backfill.sql` adds the resumable batch and
per-ticker audit ledger for initial Russell-universe SEC evidence ingestion.

Before applying SQL, export or back up the remote database and inspect its existing schema. Older production databases may already contain part of this lineage. Apply only missing migrations; do not blindly replay a non-idempotent file.

Example after the target has been verified:

```bash
npx wrangler d1 execute site-creator-d1 --remote --file=drizzle/0002_polite_betty_brant.sql
```

Repeat only for a migration proven missing. Query table counts and duplicate keys after each mutation.

### Refreshing the exchange universe

`npm run universe:update` reads the SEC ticker/exchange association file, validates NYSE/Nasdaq symbols against Nasdaq Trader, and reads the latest FINRA `otcSecurityMaster` partition. It generates small UI metadata plus a batched D1 upsert file.

```bash
npm run universe:update
npx wrangler d1 export site-creator-d1 --remote --output /tmp/site-creator-d1-before-universe.sql
npx wrangler d1 execute site-creator-d1 --remote --file drizzle/seed-exchange-universe.sql
```

After import, audit `companies` grouped by `listing_scope` and `exchange`, require official source/as-of metadata on every active row, and confirm `company_dossiers`, `dossier_sources`, filing facts, claims, and relationships were not deleted or promoted. The seed updates catalog identity fields only and does not create a published dossier.

If the production dossier table follows the legacy schema, do not run `seed-dossiers.sql` merely to restore index tags. Generate and apply `drizzle/seed-company-index-overlay.sql`; it updates only company/index metadata and leaves every dossier table untouched.

## Google authentication

1. In Google Cloud, use the Web OAuth client belonging to Learn What You Own.
2. Its authorized redirect URI is `https://fxmdunpolhqponfchwsz.supabase.co/auth/v1/callback`.
3. Store the Google client ID and secret in Supabase Authentication → Providers → Google.
4. In Supabase URL Configuration, set `https://learnwhatyouown.com` as the Site URL.
5. Allow `https://learnwhatyouown.com/auth/callback`, `http://localhost:3000/auth/callback`, and the production Workers callback only while that origin remains public.
6. Test a new Google login, username onboarding, sign-out, and returning login.

Do not configure Google to redirect directly to an application route in place of the Supabase callback.

## Resend and DNS

The sending domain is `learnwhatyouown.com`; the expected sender is `notifications@learnwhatyouown.com`.

1. In Resend, open the domain and copy the exact SPF/DKIM records it currently requires.
2. In Cloudflare DNS under account `e5c3672efaf52cf5b417da2b09e687af`, confirm every record value and proxy setting exactly matches Resend.
3. Wait for Resend to report the domain as verified. Do not infer verification from DNS presence alone.
4. Store `RESEND_API_KEY` as a Worker secret and set `NOTIFICATION_FROM_EMAIL`.
5. Send a test notification to an opted-in test account and inspect Resend delivery logs.

Email notifications never include a private-message body. Daily digests send nothing when no queued messages exist.

## Scheduled filing freshness and daily digest

`vite.config.ts` declares `2-59/5 * * * *` for the initial-source scheduler and
`*/15 * * * *` for the dossier freshness monitor. Each scheduler invocation
acquires a short D1 selection lease, records up to 12 Russell 3000 constituents
with fewer than five sources in descending market-cap order, and publishes one
durable Queue message per ticker. It does not perform SEC ingestion inside the
scheduled HTTP request. `lwyo-dossier-ingestion` delivers one ticker per consumer
batch with concurrency capped at two, bounded retry delay, and
`lwyo-dossier-ingestion-dlq` as the dead-letter queue. Before selection the
scheduler reconciles any queued or running ledger batch left for more than 20
minutes: complete source packs are preserved and unfinished tickers become
eligible for retry. The separate
quarter-hour freshness invocation checks the 10 highest-priority published dossiers against the
SEC submissions feed. Failed checks are retried before the normal least-recently
scanned rotation. Newly detected earnings releases,
10-Ks, 10-Qs, definitive proxies, and material 8-Ks are recorded in
`dossier_freshness_events`. Periodic reports and earnings events also trigger a
Company Facts refresh. The exact filing event and source publish automatically
with a system audit identity; filing detection never silently rewrites a bull
case, bear case, valuation conclusion, or owner summary.

The initial source backfill is one deduplicated Russell 3000 pass; each batch
item retains its Russell 2000 membership so the subset is not fetched twice.
It stores a balanced recent pack of exact EDGAR accession links, attempts a
normalized Company Facts import, and records the outcome in
`dossier_source_backfill_batches` and `dossier_source_backfill_items`. A ticker
stays unpublished until at least five exact dossier sources exist. Operators can
enqueue an additional bounded batch from **Admin → SEC source backfill**. The
public `/research/batches` page lists every completed batch and its tickers.
Source-foundation completion does not bypass the dossier quality rule. The
scheduled automatic benchmark validator checks exact citation resolution,
source depth, claim count, section coverage, and claim-type diversity before it
marks a dossier benchmark complete. Failed candidates stay in the administrator
exception ledger without a per-ticker approval queue.

Freshness accessions are presented to administrators as recent automatic
company-and-reporting-period packages. The raw event records remain individually
auditable, but official SEC evidence does not require per-ticker approval. No
automated scan changes bull, bear, valuation, or owner-summary conclusions.

The first successful scan establishes a conservative baseline by recording only
the latest filing in each supported category. Subsequent scans ingest every new
supported accession since the preceding successful check. SEC links point to
the exact accession and primary document.

`vite.config.ts` declares `0 15,16 * * *`. These are the two UTC hours that can correspond to 08:00 Pacific across daylight-saving changes. `worker/index.ts` checks `America/Los_Angeles` and only proceeds during the invocation that is actually 08:00.

The Worker posts to `/api/notifications/email-digest`, `/api/internal/sec-facts-refresh`, and `/api/internal/dossier-completion` using `NOTIFICATION_CRON_SECRET`. The digest endpoint processes only queued daily notifications and leaves the no-message case empty. The SEC refresh endpoint selects the five least-recently attempted published dossiers, imports only normalized SEC Company Facts, and records success, unsupported-XBRL, or error status. The dossier-completion endpoint consumes a bounded evidence-ready batch every five minutes and records automatic successes or exceptions. This bounded rotation avoids aggressive SEC traffic while keeping published financial evidence fresh.

Before deploying this architecture, create `lwyo-dossier-ingestion` and
`lwyo-dossier-ingestion-dlq` in the authoritative Cloudflare account and apply
`drizzle/0038_dossier_ingestion_queue_reliability.sql` to the authoritative D1
database. After deployment, verify all four cron triggers, the producer binding,
the queue consumer, and the dead-letter queue on the `learn-what-you-own` Worker.
Inspect at least one completed ticker job, one freshness invocation, and one daily
scheduled invocation. Never point the digest to a preview origin.

## Build and deploy

```bash
npm ci
npm test
npm run build
npm run release:preflight
```

The generated config is `dist/server/wrangler.json`. The package and generated Worker name are permanently set to `learn-what-you-own`; preflight fails instead of deploying if the Worker name, D1 binding, routes, or cron triggers drift.

```bash
npm run deploy:production
```

The deployment command records the Git commit in `RELEASE_COMMIT_SHA`, which is visible to administrators in the production dashboard. It refuses to deploy tracked, uncommitted work.
After Wrangler publishes, the same command runs `npm run verify:authority`. The release fails unless apex, `www`, and the direct Workers.dev URL return identical public-research statistics and the exact deployed Git SHA.

Before saving a Sites version, create the archive with `npm run sites:package -- <archive.tgz>`. The packager stages the existing production build, copies only Git-tracked migrations, and runs `sites:verify-archive` automatically. The verifier rejects nested `dist/dist` trees and any SQL migration that is not tracked by the release commit. Do not upload an archive produced by copying the working tree's `drizzle` directory directly because local dossier drafts are intentionally excluded from releases.

Alternatively, use the existing Cloudflare Git integration only after confirming it targets account `e5c3672efaf52cf5b417da2b09e687af`, Worker `learn-what-you-own`, and branch `main`.

The apex and `www` hostnames use zone routes in `vite.config.ts`. Keep the existing proxied DNS records in place. Do not change the apex to a Wrangler `custom_domain` attachment: that conflicts with the externally managed records and can upload a new Worker while leaving the public domain on an older Sites origin.

The Sites project is preview/control-plane infrastructure only. Its custom-domain list must remain empty. Never attach `learnwhatyouown.com` or `www.learnwhatyouown.com` to the Sites Worker because that creates a second D1 authority and takes precedence over the canonical Worker route.

Do not deploy the generated name as a new service. Do not create a new D1 database to resolve a binding error.

## Release record

For every production release, retain:

- Git commit SHA;
- deploy timestamp and operator;
- Cloudflare account, Worker, and D1 IDs;
- migrations applied;
- test/build result;
- post-deploy checklist result;
- rollback commit or prior Worker version.

## Backups, exports, and restore drills

Supabase is currently on the Free plan, so Learn What You Own creates an independent logical database backup rather than relying on managed daily backups. Supabase database dumps do not contain Storage object bytes; the backup command therefore downloads all Storage buckets separately.

```bash
npm run backup:production -- --output backups/manual-YYYY-MM-DD
npm run backup:verify -- backups/manual-YYYY-MM-DD
npm run restore:drill -- backups/manual-YYYY-MM-DD
```

For an emergency database-only snapshot when Storage credentials are unavailable, add `--skip-storage`. The manifest records that omission. To validate only the isolated D1 restoration, add `--d1-only` to the restore drill; a complete drill still requires a disposable Supabase target.

`backup:production` verifies the Cloudflare account, D1 database ID, linked Supabase project, file hashes, and source Git commit. It creates both the unmodified D1 export and a restore-normalized copy because the legacy D1 schema declares some foreign keys before the `companies` compatibility table. The Supabase CLI creates a short-lived database login; the native `pg_dump` process consumes it without printing or storing the credential.

The D1 restore drill always uses isolated local storage and never modifies the remote database. A full Supabase restore drill requires `SUPABASE_RESTORE_DRILL_DB_URL` to identify a disposable non-production Postgres database; the script refuses the production project reference. Supabase Storage objects must be restored separately from the `supabase-storage/` directory after the database restore.

The private GitHub workflow `Encrypted production backup` runs daily and retains only an AES-256 encrypted artifact for 30 days. Configure these GitHub Actions secrets before enabling the schedule:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BACKUP_ENCRYPTION_PASSWORD`

Members can download their own JSON data export from the account page. Private uploaded files are represented by one-hour signed download links. A member can request or cancel account deletion; an administrator must review and execute deletion through the existing audited account controls.
