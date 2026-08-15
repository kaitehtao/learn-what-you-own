# LearnWhatYouOwn canonical project state

Last verified: 2026-08-14 (America/Los_Angeles)

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

The 2026-08-14 audit verified GitHub `main`, the Cloudflare apex, `www`, and the
direct Workers.dev endpoint at application commit
`a94f87f928aa77ffc08f253f601503bde3dbc47e`. Use
`npm run verify:authority` for the currently deployed SHA rather than treating a
dated Markdown value as live proof.

The shared production D1 authority reported:

- 25,651 searchable symbols;
- 2,984 published dossiers;
- 63,739 distinct primary-source documents;
- 8,261 published claims, all 8,261 linked to sources;
- 923 `benchmark_complete`, 2,056 `machine_enriched`, five `editorial_review`,
  and 15 `starting_point` dossier records; and
- 2,983 freshness-check records, with zero current errors and zero records that
  have never succeeded. The newest successful check was recorded on 2026-08-13.

Index membership is stored once per company and exposed through labeled views.
Current production coverage is:

| Research view | Component ticker rows | Published | Five-source foundation | Benchmark complete | Machine enriched |
| --- | ---: | ---: | ---: | ---: | ---: |
| S&P 500 | 502 | 502 | 502 | 502 | 0 |
| Nasdaq-100 | 102 | 102 | 102 | 100 | 2 |
| Russell 2000 | 1,950 | 1,950 | 1,950 | 206 | 1,744 |
| Russell 3000 | 2,965 | 2,965 | 2,965 | 905 | 2,055 |

Component counts are ticker rows, not marketing names: multiple share classes
can make an index view contain more ticker rows than the index name implies.
Every published row in the four views has at least five distinct primary
sources, but `machine_enriched` is not the same quality claim as
`benchmark_complete`. All current component rows in these four views have a
published source foundation; 2,056 dossiers still need a validated structured
owner narrative before they can pass the benchmark rule.

The 2026-08-13 worker repair raised the bounded paid-Worker CPU budget from the
accidental 100 ms ceiling to 30,000 ms, reduced AI prompt size, added explicit
deadlines, and replaced fragile model-copied quotations with stable evidence IDs
that the server resolves to exact SEC excerpts. Migration
`drizzle/0047_supersede_low_cpu_diagnostics.sql` preserved historical failures
while relabeling 848 obsolete timeout records. The production rollback point is
the checksum-verified D1 backup created immediately before that migration.

Company-profile enrichment is active but incomplete. Production now has 394
contact profiles, including 353 IR URLs
and 208 IR emails; 352 tickers currently have 1,828 sourced current-management
biographies. Remaining work is tracked in GitHub issues 14 through 16.

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

All 27 repository Supabase migrations were present remotely through
`20260808052411_optimize_research_notebook_rls.sql`.

These numbers are a dated snapshot and will drift as research coverage expands.
Re-run the repository verification scripts and live D1 queries before making a
current claim.

## Optional ChatGPT Sites mirror verification

The Sites mirror was audited independently on 2026-08-13:

- project `appgprj_6a6992149bac81918aea31053a6f8eb2` is active and public at
  `https://learn-what-you-own.julianspencer.chatgpt.site`;
- its public homepage, representative dossier and research routes, and
  `/api/site-stats` all return HTTP 308 redirects to the corresponding
  `learnwhatyouown.com` production routes, so following those redirects verifies
  production rather than the mirror build itself;
- the newest saved Sites artifact is version 165 from commit
  `262f970488519e348bf5e31f899809cc2e8fd669`, which does not match the verified
  application baseline; and
- the most recent 24-hour mirror Worker-log query returned no errors.

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

## Consolidated product decisions

The following decisions originated across earlier product and implementation conversations and now form the canonical direction:

1. Organize research around permanent company dossiers, claims, evidence, and evolving theses rather than disconnected articles or posts.
2. Use structured, moderated contributions instead of an unrestricted stock-chat feed. Require sources, expertise, confidence, time horizon, and position/conflict disclosures where relevant.
3. Keep private notebooks, attachments, portfolio data, messages, and private theses private by default. Publishing requires an explicit user action and moderation workflow.
4. Keep SEC filings separate from official company/IR press releases and external journalistic coverage.
5. Treat live prices, market capitalizations, earnings dates, ownership, index membership, and filing facts as sourced data with an as-of date; do not hard-code them as permanent truth.
6. Label index membership clearly while maintaining one deduplicated research universe. S&P 500, Nasdaq-100, Russell 2000, and Russell 3000 pages are views over that universe.
7. Automatically publish exact SEC filing evidence and refresh filed facts after earnings releases, 10-Ks, 10-Qs, definitive proxies, and material 8-Ks. Automatically grant initial benchmark completion when the active deterministic evidence rule passes; keep failures in an exception ledger. Later thesis changes and community interpretations remain under moderation.
8. Provide member watchlists, portfolios, earnings alerts, notes, public profiles, messaging, contributions, rewards, feedback, and administrator moderation tools.
9. Preserve claim-level citations and distinguish primary sources from licensed or community-provided material. Do not republish restricted analyst research without rights.
10. Use GitHub `main` as the authoritative code history. A Sites version number, a local build, or a chat description alone is never proof that production is synchronized.
11. Run bulk dossier source ingestion as durable per-ticker Queue jobs with D1 audit ledgers, bounded SEC requests, retry backoff, and a five-source publication gate. Review newly detected filings as evidence-preserving company/report-period packages.

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
