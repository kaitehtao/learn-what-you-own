# LearnWhatYouOwn canonical project state

Last verified: 2026-08-06

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

The 2026-08-06 audit verified:

- GitHub `main` at `9caccda26c556052e6fce8e122aa8b65794b91ea`;
- Cloudflare apex, `www`, and the direct Workers.dev endpoint reporting that same release;
- 25,651 searchable symbols, 1,266 published dossiers, and 4,213 published claims from the shared D1 authority;
- all 23 repository Supabase migrations present remotely, through `20260806042619_admin_action_notifications.sql`; and
- public ChatGPT Sites version 149 built from the same Git commit.

These numbers are a dated snapshot and will drift as research coverage expands. Re-run the repository verification scripts before making a current claim.

## Consolidated product decisions

The following decisions originated across earlier product and implementation conversations and now form the canonical direction:

1. Organize research around permanent company dossiers, claims, evidence, and evolving theses rather than disconnected articles or posts.
2. Use structured, moderated contributions instead of an unrestricted stock-chat feed. Require sources, expertise, confidence, time horizon, and position/conflict disclosures where relevant.
3. Keep private notebooks, attachments, portfolio data, messages, and private theses private by default. Publishing requires an explicit user action and moderation workflow.
4. Keep SEC filings separate from official company/IR press releases and external journalistic coverage.
5. Treat live prices, market capitalizations, earnings dates, ownership, index membership, and filing facts as sourced data with an as-of date; do not hard-code them as permanent truth.
6. Label index membership clearly while maintaining one deduplicated research universe. S&P 500, Nasdaq-100, Russell 2000, and Russell 3000 pages are views over that universe.
7. Automate dossier freshness after earnings releases, 10-Ks, 10-Qs, definitive proxies, and material 8-Ks, while keeping thesis changes under editorial review.
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
