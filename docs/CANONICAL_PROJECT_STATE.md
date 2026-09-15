# LearnWhatYouOwn canonical project state

Last verified: 2026-09-15 (America/Los_Angeles)

This document is the durable handoff for LearnWhatYouOwn. Historical ChatGPT and Codex conversations explain how the product evolved, but they are not deployment proof. When a chat conflicts with this document or live infrastructure, verify the live layer and update this file in the same release.

## Mission and product standard

LearnWhatYouOwn helps investors understand the business behind every ticker. The product is an evidence-led ownership intelligence platform, not a trading terminal, stock-promotion feed, or unrestricted message board.

The core product object is one living company dossier that organizes:

- owner summary and business model;
- bull, base, bear, consensus, and contrarian views;
- thesis breakers, catalysts, risks, and unanswered questions;
- filing-derived financial history and ownership information;
- competitors, comparables, customers, suppliers, and relationships;
- official company releases, external journalism, interviews, and community research; and
- claim-level sources, review status, freshness, and correction history.

Material factual claims should be traceable to evidence. Management statements, independently verified facts, estimates, contributor opinions, and AI inference must remain visibly distinct.

## Canonical authorities

| Layer | Canonical authority |
| --- | --- |
| Source code | GitHub `kaitehtao/learn-what-you-own`, branch `main` |
| Public application | Cloudflare Worker `learn-what-you-own` |
| Public research data | Cloudflare D1 `site-creator-d1` (`8c2f7a1b-aa6e-45be-8e89-8c64bb0be557`) |
| Accounts and private member data | Supabase project `fxmdunpolhqponfchwsz` |
| Secondary mirror | ChatGPT Sites project `appgprj_6a6992149bac81918aea31053a6f8eb2` |
| Public domain | `https://learnwhatyouown.com` |

The release order is GitHub `main` -> Cloudflare -> Supabase migration verification -> ChatGPT Sites mirror. The public domain and direct Worker must read the same D1 authority. The Sites project is a secondary mirror and must not take ownership of the custom domain or become a second production database authority.

## Verified release snapshot

The 2026-09-14 scheduler-isolation release at code commit
`11d6b5997441a787d5c663b10e0d96b42c53baad` is the current canonical release.
It prevents source-backfill and filing-change failures from starving the
independent dossier-completion worker. The preceding stabilization commit
`168cdbbe45808a9ddf240761438bacbd31863d28` made server-generated evidence IDs
authoritative for both citation URLs and excerpts, added error-specific company
profile cooldowns, and moved SEC fact/history rotation to bounded four-company
batches every five minutes. Lint, type checking, the 520-ticker repository
audit, and all 155 automated tests passed. GitHub `main`, the apex domain, and
the direct Worker reported the deployed commit. The ChatGPT Sites mirror still
returns an exact HTTP 308 redirect to canonical production.

The public production authority reported on 2026-09-15:

- 25,651 searchable symbols;
- 2,984 published dossiers;
- 80,934 distinct primary-source documents; and
- 30,808 published claims, all 30,808 linked to sources.

Seven of the 17 dossiers blocked at the prior snapshot subsequently passed the
same automatic benchmark rule: `BSY`, `DDS`, `UGI`, `RDN`, `NEXT`, `SPIR`, and
`LZM`. Ten remain machine-enriched: `NU`, `TRI`, `BIRK`, `DLO`, `FCPT`, `KOS`,
`ODC`, `NREF`, `TRDA`, and `KGEI`. Every one has at least six public sources;
the remaining gate is source-grounded narrative validation, not source absence.
The protected D1 job ledger could not be re-audited in this verification pass
because the local Cloudflare CLI session had expired; public quality, source,
claim, and freshness endpoints were independently verified.

The 2026-08-25 narrative-reliability release at code commit
`1442d60fd9b83947f2512f106358ff7c7be3a96d` repaired the final small cohort of
filing-backed dossiers that had exhausted the prior model retry window. The
server now snaps a lightly paraphrased model citation back to an exact filing
excerpt only when the filing URL and word-overlap test identify one
unambiguous server-held source; weak or ambiguous evidence still fails closed.
Primary-source retrieval now retries transient HTTP 429 and 5xx responses with
bounded backoff. The new pipeline generation gives only still-incomplete
records a controlled retry window without deleting the historical audit trail.
The complete production suite passed lint, the 520-ticker repository dossier
audit, and all 148 automated tests. The public authority endpoint reported the
exact release commit after deployment. The first production cycles promoted 17
of the 34 previously blocked dossiers, including `REXR`, to benchmark complete.

The 2026-08-24 research-transparency release at code commit
`6eea851a643e2175d026cf7e7727a5d8d880ec26` adds one standardized coverage and
freshness panel to both flagship and developing dossiers. It exposes complete,
partial, and unavailable research layers; the latest automatic filing change;
live primary-source counts; SEC taxonomy, concept, and accession provenance for
displayed facts; and the public `/methodology` definition and source-hierarchy
page. The complete production suite passed 145 tests and the 520-ticker
repository dossier audit before release. Deployment parity must still be
verified from the release SHA and public routes after Cloudflare publication.

The 2026-08-21 audit verified GitHub `main`, the Cloudflare apex, `www`, and the
direct Workers.dev endpoint at SEO release commit
`363c2d5c8a32c2f903d795a6733bade3a94f53f6`. The release standardized company
metadata, added `CollectionPage` and breadcrumb structured data to the four
index research hubs, and added `mainEntityOfPage` to dossier article data. The
live SEO audit passed 32 sampled public pages drawn from 3,006 canonical URLs
across three sitemaps. Use `npm run verify:authority` for the currently deployed
SHA rather than treating a dated Markdown value as live proof.

The shared production D1 authority reported on 2026-09-15:

- 25,651 searchable symbols;
- 2,984 published dossiers;
- 80,934 distinct primary-source documents; and
- 30,808 published claims, all 30,808 linked to sources.

The most recent complete freshness-ledger audit remains the 2026-08-15 check:
2,983 freshness records, zero current errors, and zero records that had never
succeeded. The public coverage counters and authority endpoints were refreshed
again on 2026-08-21; protected job-level error ledgers still require an
authenticated administrator or D1 session and should not be inferred from the
public counters alone.

Index membership is stored once per company and exposed through labeled views.
Current production coverage is:

| Research view | Component ticker rows | Published | Five-source foundation | Benchmark complete | Machine enriched |
| --- | ---: | ---: | ---: | ---: | ---: |
| S&P 500 | 502 | 502 | 502 | 502 | 0 |
| Nasdaq-100 | 102 | 102 | 102 | 101 | 1 |
| Russell 2000 | 1,950 | 1,950 | 1,950 | 1,943 | 7 |
| Russell 3000 | 2,965 | 2,965 | 2,965 | 2,956 | 9 |

Component counts are ticker rows, not marketing names: multiple share classes
can make an index view contain more ticker rows than the index name implies.
Every published row in the four views has at least five distinct primary
sources, but `machine_enriched` is not the same quality claim as
`benchmark_complete`. All current component rows in these four views have a
published source foundation. The remaining index backlog overlaps across
universes: nine Russell 3000 rows remain machine-enriched, including seven
Russell 2000 rows. Thomson Reuters (`TRI`) is the single remaining
machine-enriched Nasdaq-100 row. Across the complete listed universe, ten
dossiers remain machine-enriched. The remaining names at the time of
verification were `NU`, `TRI`, `BIRK`, `DLO`, `FCPT`, `KOS`, `ODC`, `NREF`,
`TRDA`, and `KGEI`.

The 2026-08-13 worker repair raised the bounded paid-Worker CPU budget from the
accidental 100 ms ceiling to 30,000 ms, reduced AI prompt size, added explicit
deadlines, and replaced fragile model-copied quotations with stable evidence IDs
that the server resolves to exact SEC excerpts. Migration
`drizzle/0047_supersede_low_cpu_diagnostics.sql` preserved historical failures
while relabeling 848 obsolete timeout records. The production rollback point is
the checksum-verified D1 backup created immediately before that migration.

Company-profile enrichment is active but incomplete. The most recent protected
production audit found 1,741 contact profiles, including 616 IR URLs and 360 IR
emails; 1,687 tickers had 8,193 sourced current-management people. Direct IR
phone coverage remained sparse. Remaining work is tracked in GitHub issues 14
through 16.

The 2026-08-14 reliability release removed a silent narrative-queue blocker:
issuers without two exact SEC archive documents can no longer be selected for
AI narrative generation, and every selected job is now recorded before source
fetching begins. It also separated company-profile AI work onto
`4-59/5 * * * *`, limited it to one active job, split contact and management
stages, and bounded external and model calls. The first production narrative
cycle after deployment completed Wayfair (`W`) in nine seconds and promoted it
through the automatic benchmark pipeline. The first profile cycle completed in
one second with an explicit validation failure rather than leaving another
orphaned running job.

The follow-up release at `d0823ffc54dcda0207030c2fdee3fcbd48336318`
rebuilds completion claims from stored narrative output using unique,
section-labeled claim text, allows recoverable editorial-review dossiers back
into the deterministic completion pipeline, and requires at least two exact SEC
archive filings in every narrative-ready source pack. Its first production
cycle cleared all five stalled editorial-review dossiers and raised the
benchmark count from 924 to 938. The source worker also began repairing thin
packs for major issuers, adding exact filings to AAPL, NVDA, MSFT, AMZN, AVGO,
META, LLY, MU, JPM, WMT, and AMD. Registration statements are now eligible
management-bio sources for newly listed issuers. The first post-release profile
cycle validated that path by extracting three sourced ARM management biographies
from its SEC registration statement in three seconds.

The 2026-08-15 repair at `44560f80f4f6dc830629178e7c3f2b6efedce276`
removed three active failure modes. Bank issuers whose public periodic reports
are filed with the FDIC now satisfy the same evidence gate through registered
FDIC filing documents instead of being retried indefinitely for unavailable SEC
archive URLs. PDF regulator filings are converted to bounded plain text through
the production Workers AI binding before evidence extraction. Narrative
competitor evidence now fails closed to an explicit insufficient-evidence
statement, and management-profile extraction retries malformed or truncated
model JSON with a smaller output shape without consuming the permanent retry
allowance. Migration `drizzle/0048_replace_blocked_bank_ir_with_fdic_filings.sql`
registered exact 10-K, 10-Q, and proxy documents for OZK and PFBC and reconciled
their historical partial source jobs. After deployment, the source worker had
no incomplete jobs in the observed 30-minute window and six consecutive
narrative cycles completed, including KNSL at 18:08 UTC.

All 28 repository Supabase migrations were present remotely through
`20260821000000_contribution_relevant_links.sql`.

These numbers are a dated snapshot and will drift as research coverage expands.
Re-run the repository verification scripts and live D1 queries before making a
current claim.

## Optional ChatGPT Sites mirror verification

The Sites mirror was audited independently again on 2026-08-15:

- project `appgprj_6a6992149bac81918aea31053a6f8eb2` is active and public at
  `https://learn-what-you-own.julianspencer.chatgpt.site`;
- its public homepage, representative dossier and research routes, and
  `/api/site-stats` all return HTTP 308 redirects to the corresponding
  `learnwhatyouown.com` production routes, so following those redirects verifies
  production rather than the mirror build itself;
- the newest saved Sites artifact is version 165 from commit
  `262f970488519e348bf5e31f899809cc2e8fd669`, which does not match the verified
  application baseline; and
- the homepage, BA dossier, Russell 2000 research view, and site-statistics API
  each returned HTTP 308 to the exact corresponding canonical production route.

The mirror is therefore **active, healthy as a redirect, and intentionally out
of source parity**. Because every tested route delegates to canonical
production, it is not production proof, must not take ownership of
`learnwhatyouown.com`, and must not be used as a second research-data authority.
Do not replace the redirect-only design with an independently writable research
application.

## Backup and restore verification

GitHub Actions run
[`31287239536`](https://github.com/kaitehtao/learn-what-you-own/actions/runs/31287239536)
completed successfully on 2026-08-08 (America/Los_Angeles) from commit
`1013d30db1b901668d35bb97b14f12dadb00794b`. The workflow:

- exported and checksum-verified five production backup files;
- restored Cloudflare D1 into a disposable SQLite database and verified 25,667
  company records, 2,999 dossier records, and 750,543 filing facts;
- restored Supabase into a disposable non-production database and matched
  expected counts for `auth.users`, `public.profiles`, `storage.buckets`, and
  `storage.objects`;
- encrypted the archive with AES-256-CBC and PBKDF2; and
- uploaded the 34,014,378-byte encrypted artifact
  `lwyo-encrypted-production-backup-31287239536`, retained through
  2026-09-08.

The D1 count above includes database records outside the active public symbol
and published-dossier views, so it should not be substituted for the public
coverage figures in the release snapshot.

Before the 2026-08-15 regulator-source migration, a raw 552 MB production D1
export was written and SHA-256 verified as
`82670629f7bdc62bb9fe25b3ae46c56fe011edaed174e8534deb1a261490acd3`.
The backup helper was changed to stream D1 restore normalization rather than
loading the complete SQL export into one JavaScript string. The migration was
also exercised against an isolated SQLite fixture covering the affected bank
source records and backfill ledgers before the production write. A future full
restore drill should continue using the encrypted scheduled backup workflow or
a deliberately provisioned disposable database rather than a time-constrained
interactive session.

## Consolidated product decisions

The following decisions originated across earlier product and implementation conversations and now form the canonical direction:

1. Organize research around permanent company dossiers, claims, evidence, and evolving theses rather than disconnected articles or posts.
2. Use structured, moderated contributions instead of an unrestricted stock-chat feed. Require sources, expertise, confidence, time horizon, and position/conflict disclosures where relevant.
3. Keep private notebooks, attachments, portfolio data, messages, and private theses private by default. Publishing requires an explicit user action and moderation workflow.
4. Keep SEC filings separate from official company/IR press releases and external journalistic coverage.
5. Treat live prices, market capitalizations, earnings dates, ownership, index membership, and filing facts as sourced data with an as-of date; do not hard-code them as permanent truth.
6. Label index membership clearly while maintaining one deduplicated research universe. S&P 500, Nasdaq-100, Russell 2000, and Russell 3000 pages are views over that universe.
7. Automatically publish exact SEC filing evidence and refresh filed facts after earnings releases, 10-Ks, 10-Qs, definitive proxies, and material 8-Ks. Automatically grant initial benchmark completion when the active deterministic evidence rule passes; keep failures in an exception ledger. Later thesis changes and community interpretations remain under moderation.
8. Poll SEC current-filings feeds every five minutes for tracked issuers, retain the rotating submissions scan as a fallback, and publish a citation-linked objective change packet after each normalized 10-Q or 10-K. Show both sequential and year-over-year changes when comparable facts exist; never manufacture a missing comparison.
9. Provide member watchlists, portfolios, earnings alerts, notes, public profiles, messaging, contributions, rewards, feedback, and administrator moderation tools.
10. Preserve claim-level citations and distinguish primary sources from licensed or community-provided material. Do not republish restricted analyst research without rights.
11. Use GitHub `main` as the authoritative code history. A Sites version number, a local build, or a chat description alone is never proof that production is synchronized.
12. Run bulk dossier source ingestion as durable per-ticker Queue jobs with D1 audit ledgers, bounded SEC requests, retry backoff, and a five-source publication gate. Review newly detected filings as evidence-preserving company/report-period packages.

## Current implemented platform areas

The repository contains the public research directory and dossiers, index-specific research views, SEC financial and ownership ingestion, official and external news, comparable-company tools, earnings intelligence, insider activity, FACTS workflow, portfolios, watchlists, private notebooks and attachments, long-form research publishing, interviews, conversations, contributor reputation and rewards, member profiles and messaging, feedback and safety reports, administrator workflows, notifications, backup tooling, and deployment verification.

Coverage depth is not uniform merely because a symbol exists in the directory. Dossier quality and freshness must remain explicit and must be audited from the database rather than inferred from a route count.

## Release and verification rules

Before declaring a release synchronized:

1. Fetch GitHub and require local `HEAD` to equal `origin/main`.
2. Run the full build and test suite.
3. Run production preflight and verify the Worker name, D1 binding, custom routes, and scheduled triggers.
4. Verify apex, `www`, and direct Worker authority parity against the exact Git commit.
5. Compare local and remote Supabase migration histories and test material RLS/role behavior.
6. Save and publish the Sites mirror from the exact tested commit, then verify a route introduced by that release.
7. Record the commit, migrations, deployment time, data counts, tests, and rollback point.

If Sites returns `Failed to publish the built site` with no actionable logs, stop blind retries. Re-publish the last known-good Sites version, confirm it succeeds, then publish and verify the target version.

## Working with future assistants

Start in `/Users/remarkai/Documents/LearnWhatYouOwn`. Read `AGENTS.md`, this file, `PRODUCT.md`, `docs/ARCHITECTURE.md`, `DATA_MODEL.md`, `EDITORIAL_STANDARDS.md`, and `docs/DEPLOYMENT.md` before changing architecture or production data.

Do not reconstruct current deployment state from archived chats. Use the repository and live verification tools. If an old conversation contains a useful product idea that is not represented here, add it through a reviewed issue or specification instead of treating the chat as an already implemented feature.
