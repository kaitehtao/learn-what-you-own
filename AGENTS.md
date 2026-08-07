# LearnWhatYouOwn agent instructions

## Start here

The canonical checkout is `/Users/remarkai/Documents/LearnWhatYouOwn`. Before substantive work, read:

- `docs/CANONICAL_PROJECT_STATE.md`
- `PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `DATA_MODEL.md`
- `EDITORIAL_STANDARDS.md`
- `docs/DEPLOYMENT.md`

Historical chats are context, not a source of truth for current code or deployment state.

## Product rules

- Prefer structured claims, evidence, theses, and versioned dossier sections over generic articles or posts.
- Every material factual claim should support a real citation.
- Distinguish verified facts, management statements, estimates, contributor opinions, and AI inference.
- Keep private research and member data private by default.
- Require moderation before community submissions alter published dossiers.
- Do not hard-code prices, market capitalizations, earnings dates, index membership, or ownership data as permanent truth.
- Do not invent financial figures, quotations, customers, suppliers, guidance, sources, or citations.

## Engineering rules

- Work from the existing architecture; avoid unrelated refactors.
- Use strict TypeScript, accessible reusable components, server-side secret handling, and database-enforced authorization/RLS.
- Preserve user work and untracked files unless their disposition is explicitly verified.
- Files under `scripts/production-data/applied-a-ticker-rollout/` are historical applied snapshots, not replayable migrations.
- Add tests for material behavior and run build, lint, type checks, and relevant tests before completion.
- Never commit API keys, service-role keys, database passwords, tokens, or private member data.

## Release rules

GitHub `main` is the authoritative code history. Cloudflare is the canonical public runtime, Supabase is the account/private-data authority, and ChatGPT Sites is a secondary mirror.

Verify every layer independently before saying they are synchronized. A clean Git working tree, a successful local build, a Sites version, or repository documentation is not production proof.

Production data changes require an exact target check, backup, deliberate migration, post-write counts, duplicate/completeness audits, and a release record. Do not replay production snapshots or apply untracked SQL merely because filenames resemble migrations.
