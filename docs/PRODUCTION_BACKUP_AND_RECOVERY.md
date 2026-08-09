# Production backup and recovery

## Scope and owner

The Learn What You Own administrator is responsible for the production backup workflow. The workflow covers the authoritative Cloudflare D1 database, the linked Supabase PostgreSQL project, Supabase Storage objects, and a manifest containing checksums and the Git commit represented by the backup.

## Schedule and retention

- GitHub Actions workflow: `.github/workflows/production-backup.yml`
- Schedule: daily at 09:30 UTC, with manual `workflow_dispatch` available.
- Encryption: AES-256-CBC with PBKDF2; the password is stored only as a GitHub Actions secret.
- Retention: encrypted GitHub artifact retained for 30 days.
- Secrets, plaintext database exports, and unencrypted storage objects must never be uploaded as artifacts or written to logs.

## Verification performed on every run

1. Confirm Cloudflare authentication matches account `e5c3672efaf52cf5b417da2b09e687af`.
2. Confirm D1 identity is `site-creator-d1` / `8c2f7a1b-aa6e-45be-8e89-8c64bb0be557`.
3. Export D1 and Supabase PostgreSQL; download Supabase Storage.
4. Generate SHA-256 checksums for every file.
5. Start a disposable, non-production Supabase database.
6. Restore the D1 export to a disposable SQLite database and restore Supabase SQL to the disposable PostgreSQL database.
7. Run integrity and record-count checks.
8. Encrypt the verified archive before upload.
9. Stop and discard the disposable restore target.

The Supabase logical dump and verification query obtain short-lived credentials
from the linked production project. Transient pooler failures, including
`EAUTHQUERY` authentication-query timeouts, are retried with freshly generated
credentials and bounded backoff. Permanent authentication or authorization
failures stop immediately.

The restore drill must never point at a production database. A run is successful only after both restore targets pass verification and the encrypted artifact upload completes.

## Recovery procedure

1. Select the most recent successful workflow run whose manifest Git commit matches the desired application release.
2. Download the encrypted artifact in a restricted administrator environment.
3. Decrypt with the backup encryption secret and run `npm run backup:verify -- <backup-directory>`.
4. Create new disposable D1 and Supabase targets; never test the archive against production.
5. Run `npm run restore:drill -- <backup-directory>` and compare verified table counts with the manifest and production incident record.
6. Obtain explicit administrator approval for the recovery point and exact production targets.
7. Place the application in maintenance/read-only mode before any production restore.
8. Restore D1, Supabase PostgreSQL, and Storage; verify authentication, dossiers, notebooks, files, watchlists, portfolios, messages, publications, blocks, reports, and editorial queues.
9. Re-enable writes and record the operator, recovery point, timestamps, validation results, and any data gap in the incident log.

## Recovery objectives

- Recovery point objective: less than 24 hours, based on the daily successful backup schedule.
- Recovery time objective: four hours after an administrator approves the recovery point and infrastructure access is available.

## Member portability

`/api/account/export` provides a complete JSON account export, including private workspace records, uploaded-file download links, community publications, revisions, comments, bookmarks, blocks, mutes, and reports. `?format=markdown` provides a portable human-readable research export preserving notebook structure, tags, thesis text, citations, source URLs, evidence dates, disclosures, and long-form research sections.

Account deletion is request-based to prevent accidental loss. User-owned records cascade on final deletion; moderator audit records retain only the minimum actor-independent integrity record where required. Backup copies expire under the 30-day retention schedule.
