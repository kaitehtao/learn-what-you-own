# Production architecture and handoff

This document is the operating map for Learn What You Own. It records identifiers, boundaries, and invariants so a developer or coding agent can continue the project without creating a second production path.

## Authoritative production identifiers

| Concern | Authoritative value | Notes |
| --- | --- | --- |
| GitHub repository | `kaitehtao/learn-what-you-own` | `main` is the production source branch. |
| Public origin | `https://learnwhatyouown.com` | Use for callbacks, notification links, and user-facing URLs. |
| Cloudflare login/owner | `kaitehtao@gmail.com` | Do not deploy from the `kai@parkonecapital.com` account. |
| Cloudflare account ID | `e5c3672efaf52cf5b417da2b09e687af` | Verify this before every production mutation. |
| Production Worker | `learn-what-you-own` | Expected Workers URL: `https://learn-what-you-own.kaitehtao.workers.dev`. |
| D1 binding | `DB` | The application accesses D1 only through this binding. |
| D1 database | `site-creator-d1` | The single authoritative public-research database. |
| D1 database ID | `8c2f7a1b-aa6e-45be-8e89-8c64bb0be557` | Must match the production Worker binding. |
| Sites project | `appgprj_6a6992149bac81918aea31053a6f8eb2` | Preview/control-plane identifier in `.openai/hosting.json`. |
| Sites redirect mirror | `https://learn-what-you-own.julianspencer.chatgpt.site` | Non-authoritative release history whose requests redirect permanently to the canonical origin. It owns no custom hostname, scheduled jobs, or research-data authority. |
| Supabase project ref | `fxmdunpolhqponfchwsz` | Production URL: `https://fxmdunpolhqponfchwsz.supabase.co`. Verify against the live `/api/auth/config` response before mutations. |
| Resend domain | `learnwhatyouown.com` | Sender: `notifications@learnwhatyouown.com`. DNS is hosted in the authoritative Cloudflare account. |

The package name and generated Worker configuration are both canonicalized to `learn-what-you-own`. Production preflight fails when the Worker name, D1 binding, public routes, or cron triggers drift. The Sites project must never attach `learnwhatyouown.com` or `www.learnwhatyouown.com`; those hostnames belong exclusively to the canonical Cloudflare Worker.

The optional Sites project is redirect-only. Every request, including internal
API paths, receives an HTTP 308 redirect to the matching canonical production
URL. Canonical scheduled work runs only inside the Cloudflare Worker and writes
only to the authoritative Cloudflare D1 database; it never calls a Sites route
or writes to a Sites database. The Sites hosting configuration deliberately has
no D1 binding, so a mirror release cannot create or migrate a second research
database. The repository retains the canonical Cloudflare `DB` binding for its
production build; the Sites packager rewrites only the derived mirror artifact
to remove that binding.

## System boundaries

### Cloudflare Worker and D1

Cloudflare serves the vinext application, scheduled digest trigger, static assets, and public dossier APIs. D1 owns public, editorially reviewed research:

- company directory and dossier publication state;
- SEC filing facts and filing provenance;
- claim-level evidence and source records;
- SEC-sourced company contact profiles and filing-grounded current management biographies;
- supplier/customer relationship edges;
- approved public research records and legacy compatibility tables.

D1 does not own user authentication, private notebooks, private messages, or private watchlists.

### Supabase

Supabase owns member identity and private/community state:

- email/password and Google authentication;
- profiles, usernames, and member roles;
- watchlists and manual portfolio positions;
- contribution proposals awaiting editorial review;
- private/public messages and following relationships;
- private research notebooks and notes;
- private-company profiles, ARR and operating-metric history, financing rounds, pre/post-money valuations, investors, and cap-table entries;
- private collaborative earnings-model cells, assumptions, evidence links, and append-only revisions; public model pages receive only server-aggregated anonymous statistics;
- in-app notification preferences and email outbox records.
- privacy-conscious visitor sessions and administrator account-action audits.

Row-level security is the primary authorization boundary. The service-role key is server-only and must never be returned from an API route or added to a browser bundle.

### Google OAuth

Google is an authentication provider for Supabase. Google redirects only to the Supabase callback; Supabase then redirects to the application callback allowlist. Google does not store application profiles or authorization roles.

### Resend

Resend sends opt-in notification email. It does not store private-message bodies in outgoing alerts. Immediate and daily delivery read queued notification metadata from Supabase using the server-only service role.

## Core invariants

1. `learnwhatyouown.com` reads public research from one D1 database: `site-creator-d1` in Cloudflare account `e5c3672efaf52cf5b417da2b09e687af`.
2. Preview URLs may run the code, but they do not become independent production systems.
3. Apex, `www`, and the direct Workers.dev URL must return identical `/api/site-stats` data and the same `releaseCommit`; `npm run verify:authority` enforces this after deployment.
4. Only SEC filings and official company/IR sources qualify as primary dossier evidence.
5. Community submissions remain private in Supabase until an editor/admin explicitly approves them.
6. Private member data never moves into D1 merely to make a dossier public.
7. Secrets live in platform secret stores or ignored local environment files, never in Git.
8. Administrator/editor roles are assigned directly by a trusted operator in Supabase, not by a public client action.
9. The Sites mirror receives no scheduled writes and cannot bypass the canonical redirect for any route or request header.

## Code map

- `app/` — pages, API routes, member workflows, and dossier presentation
- `app/admin/` and `app/api/admin/dashboard/` — admin-only adoption metrics and account operations
- `db/schema.ts` and `db/index.ts` — D1/Drizzle schema and binding access
- `drizzle/` — ordered D1 schema migrations and controlled seed material
- `supabase/migrations/` — ordered Postgres/RLS migrations
- `worker/index.ts` — Worker fetch, SEC initial-source backfill, dossier-freshness monitor, and scheduled-digest entry point
- `vite.config.ts` — Cloudflare binding, cron, and build configuration
- `.openai/hosting.json` — shared build binding names and Sites project identifier; the Sites packager removes D1 only from the derived mirror artifact
- `tests/rendered-html.test.mjs` — build-level feature and security assertions
- `docs/NATURAL_LANGUAGE_SEARCH.md` — phased, evidence-aware search architecture and acceptance tests

## Safe continuation rules for coding agents

Before changing production, an agent must confirm the Git branch, Cloudflare account ID, Worker name, D1 database ID, Supabase project URL, and target origin. If any target differs from this document, stop and resolve the discrepancy rather than creating or populating a new resource.

Agents may read public runtime identifiers but must not print secret values into logs, issues, commits, or chat. Repository access does not imply access to Cloudflare, Supabase, Google, or Resend; those permissions are granted separately.
