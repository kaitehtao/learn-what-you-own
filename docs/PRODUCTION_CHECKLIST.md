# Production verification checklist

Complete this checklist before and after every production release. A coding agent must stop if it cannot prove the target identity.

## Preflight

- [ ] `git status --short` is clean or every change is intentionally included.
- [ ] `git fetch origin` completes and the release commit is based on current `origin/main`.
- [ ] `npm ci`, `npm test`, and `npm run build` pass.
- [ ] Target Cloudflare login is `kaitehtao@gmail.com`, not `kai@parkonecapital.com`.
- [ ] Cloudflare account ID is `e5c3672efaf52cf5b417da2b09e687af`.
- [ ] Worker target is `learn-what-you-own`.
- [ ] D1 binding `DB` resolves to `site-creator-d1` / `8c2f7a1b-aa6e-45be-8e89-8c64bb0be557`.
- [ ] `SUPABASE_URL` is `https://fxmdunpolhqponfchwsz.supabase.co`.
- [ ] A recoverable D1 export/backup exists before schema or bulk-data mutations.
- [ ] A Supabase backup/export exists before schema mutations.
- [ ] Required secrets exist without printing their values.
- [ ] Migration history has been compared with the ordered lists in `DEPLOYMENT.md`.

## Deploy

- [ ] Deploy the reviewed Git commit to the existing `learn-what-you-own` Worker.
- [ ] Confirm the deploy did not create `site-creator-vinext-starter` or another service.
- [ ] Confirm custom domain `learnwhatyouown.com` routes to the released Worker.
- [ ] Confirm `DB` still points to the authoritative D1 after deployment.
- [ ] Confirm the two digest cron expressions are present.
- [ ] Record the Cloudflare version/deployment ID and previous version.

## Public smoke tests

- [ ] `/` and `/companies` load successfully.
- [ ] At least one flagship dossier and one standard dossier load.
- [ ] Dossier SEC/IR source links are clickable and primary-source labels are accurate.
- [ ] Chart ranges render without overlap on desktop and mobile.
- [ ] Earnings calendar entries link to their company dossiers.
- [ ] Transcript and call links open the specific event when a verified link exists.
- [ ] Relationship graph does not show duplicate edges.

## Member smoke tests

- [ ] Email registration requires verification.
- [ ] Google login returns through Supabase and completes username onboarding.
- [ ] Password reset returns to the production origin.
- [ ] A member can create and reload a private notebook and note.
- [ ] A member can add/remove a watchlist ticker and a manual portfolio position.
- [ ] Private messages are visible only to sender and recipient.
- [ ] Public messages appear on the intended member profile.
- [ ] Follow/follower counts update correctly.
- [ ] A contribution remains private until editorial approval.
- [ ] A member cannot assign an editor/admin role to themselves.

## Notification and email tests

- [ ] Notification bell and `/notifications` show new message alerts.
- [ ] Resend reports `learnwhatyouown.com` as verified.
- [ ] Immediate email sends only to opted-in users.
- [ ] Daily digest sends once around 08:00 America/Los_Angeles.
- [ ] Empty daily queues produce no email.
- [ ] Email never contains a private-message body.
- [ ] Failed outbox records remain diagnosable and retryable.

## Dossier data audit

- [ ] Published/queued counts are recorded by ticker initial.
- [ ] Every published dossier has required SEC and/or official company sources.
- [ ] No incomplete dossier is labeled complete or flagship.
- [ ] Duplicate ticker, claim-source, filing-fact, and relationship-edge counts are zero.
- [ ] Seed/import work was applied to remote D1, not only local SQLite.
- [ ] The public directory count is not reported as the completed-dossier count.

## Observability and rollback

- [ ] Worker error logs are clean after smoke tests.
- [ ] Scheduled trigger invocation is visible in Cloudflare logs.
- [ ] Supabase authentication and database logs show no new policy errors.
- [ ] Resend delivery logs show the expected sender and recipient result.
- [ ] Rollback means restoring the prior Worker version first; database rollback uses the pre-mutation export or a reviewed forward migration.
- [ ] The release result and any exceptions are recorded in the corresponding GitHub issue or release note without secrets.
