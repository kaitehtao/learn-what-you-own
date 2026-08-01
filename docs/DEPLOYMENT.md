# Deployment and integration runbook

Use this runbook for local setup, database migrations, and production releases. Read `ARCHITECTURE.md` first.

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

These migrations are designed to preserve member data and establish RLS policies. Never apply them to an unverified project merely because its display name looks similar. Confirm the project reference from `SUPABASE_URL` first.

After migration, verify tables, RLS, unique username enforcement, member role constraints, and notification outbox permissions. Assign admin/editor roles only through a trusted SQL/operator session.

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

## Scheduled daily digest

`vite.config.ts` declares `0 15,16 * * *`. These are the two UTC hours that can correspond to 08:00 Pacific across daylight-saving changes. `worker/index.ts` checks `America/Los_Angeles` and only delivers during the invocation that is actually 08:00.

The Worker posts to `/api/notifications/email-digest` using `NOTIFICATION_CRON_SECRET`. The endpoint processes only queued daily notifications and leaves the no-message case empty.

After deployment, verify both cron triggers exist on the `learn-what-you-own` Worker and inspect at least one scheduled invocation. Never point the digest to a preview origin.

## Build and deploy

```bash
npm ci
npm test
npm run build
```

The generated config is `dist/server/wrangler.json`. Because its generated name may be `site-creator-vinext-starter`, explicitly target the canonical production Worker when deploying from the CLI:

```bash
npx wrangler deploy --config dist/server/wrangler.json --name learn-what-you-own
```

Alternatively, use the existing Cloudflare Git integration only after confirming it targets account `e5c3672efaf52cf5b417da2b09e687af`, Worker `learn-what-you-own`, and branch `main`.

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
