# LearnWhatYouOwn canonical project state

Last verified: 2026-08-08 (America/Los_Angeles)

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

The 2026-08-08 audit verified the application and backup baseline at Git commit
`1013d30db1b901668d35bb97b14f12dadb00794b`. GitHub `main`, the Cloudflare
apex, `www`, and the direct Workers.dev endpoint all reported that release after
production propagation completed. This documentation refresh necessarily
follows that application commit; use `npm run verify:authority` for the exact
currently deployed SHA rather than treating a self-referential Markdown value
as live proof.

The shared production D1 authority reported:

- 25,651 searchable symbols;
- 2,984 published dossiers;
- 62,722 distinct primary-source documents;
- 6,703 published claims, all 6,703 linked to sources;
- 769 `benchmark_complete`, 2,215 `machine_enriched`, and 15
  `starting_point` dossier records; and
- 2,983 freshness-check records, with zero current errors and zero records that
  have never succeeded.

Index membership is stored once per company and exposed through labeled views.
Current production coverage is:

| Research view | Component ticker rows | Published | Five-source foundation | Benchmark complete | Machine enriched |
| --- | ---: | ---: | ---: | ---: | ---: |
| S&P 500 | 502 | 502 | 502 | 502 | 0 |
| Nasdaq-100 | 102 | 102 | 102 | 94 | 8 |
| Russell 2000 | 1,950 | 1,950 | 1,950 | 206 | 1,744 |
| Russell 3000 | 2,965 | 2,965 | 2,965 | 757 | 2,208 |

Component counts are ticker rows, not marketing names: multiple share classes
can make an index view contain more ticker rows than the index name implies.
Every current row in the four views is published and has at least five distinct
primary sources, but `machine_enriched` is not the same quality claim as
`benchmark_complete`.

All 27 repository Supabase migrations were present remotely through
`20260808052411_optimize_research_notebook_rls.sql`.

These numbers are a dated snapshot and will drift as research coverage expands.
Re-run the repository verification scripts and live D1 queries before making a
current claim.

## Optional ChatGPT Sites mirror verification

The Sites mirror was audited independently on 2026-08-08:

- project `appgprj_6a6992149bac81918aea31053a6f8eb2` is active and public at
  `https://learn-what-you-own.julianspencer.chatgpt.site`;
- its public homepage, representative dossier and research routes, and
  `/api/site-stats` all return HTTP 308 redirects to the corresponding
  `learnwhatyouown.com` production routes, so following those redirects verifies
  production rather than the mirror build itself;
- the newest saved Sites artifact is version 163 from commit
  `528a9f4772adf5c1aab452ebe7e60465e3596208`, which does not match the verified
  application baseline; and
- recent mirror Worker logs contain repeated HTTP 500 responses from the
  mirror-only `POST /api/internal/dossier-freshness` job.

The mirror is therefore **active but degraded and out of source parity**. It is
not production proof, must not take ownership of `learnwhatyouown.com`, and must
not be used as a second research-data authority. Repair requires packaging,
saving, deploying, and then verifying a new Sites version from the exact tested
Git commit; merely changing a mirror environment value is insufficient.

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
