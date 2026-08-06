# Learn What You Own

Evidence-led company dossiers built with vinext and deployed on Cloudflare. Public research stays in Cloudflare D1; member identity, profiles, watchlists, portfolio positions, and community insights use Supabase.

## Operator documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system boundaries, authoritative production identifiers, and data ownership
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — migrations, environment configuration, OAuth, email, cron, and deployment procedure
- [`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md) — preflight, release, smoke-test, audit, and rollback checklist

The canonical public origin is `https://learnwhatyouown.com`. The Cloudflare D1 database named `site-creator-d1` in account `e5c3672efaf52cf5b417da2b09e687af` is the authoritative public-research database. Preview deployments must not be treated as production or populated independently.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase member accounts

1. Create a Supabase project.
2. Open the Supabase SQL editor and run these migrations in order:
   - `supabase/migrations/20260731000000_user_accounts.sql`
   - `supabase/migrations/20260731010000_relationship_contributions.sql`
   - `supabase/migrations/20260801000000_private_messages.sql`
   - `supabase/migrations/20260801010000_member_following_public_messages.sql`
   - `supabase/migrations/20260801020000_private_research_notebooks.sql`
   - `supabase/migrations/20260801030000_member_notifications.sql`
   - `supabase/migrations/20260801040000_admin_dashboard_analytics.sql`
   - `supabase/migrations/20260801050000_company_dossier_proposals.sql`
   - `supabase/migrations/20260801060000_company_research_demand.sql`
   - `supabase/migrations/20260801070000_founder_administrator.sql`
   - `supabase/migrations/20260801080000_admin_email_verification.sql`
   - `supabase/migrations/20260801090000_public_profile_bio_photo.sql`
   - `supabase/migrations/20260801100000_public_profile_research_identity.sql`
   - `supabase/migrations/20260802000000_private_research_attachments.sql`
   - `supabase/migrations/20260802010000_public_contribution_research_assets.sql`
   - `supabase/migrations/20260802020000_server_only_member_rpcs.sql`
   - `supabase/migrations/20260802030000_retire_legacy_definer_rpcs.sql`
   - `supabase/migrations/20260804215235_account_data_portability.sql`
   - `supabase/migrations/20260805010000_long_form_research_publishing.sql`
   - `supabase/migrations/20260805011000_community_safety_records.sql`
   - `supabase/migrations/20260805020000_institutional_analyst_workspace.sql`
   - `supabase/migrations/20260805030000_facts_investment_workflow.sql`
   - `supabase/migrations/20260806042619_admin_action_notifications.sql`
3. In **Authentication → Providers → Email**, enable email/password and require email confirmation.
4. In **Authentication → URL Configuration**, set the production Site URL and allow:
   - `http://localhost:3000/auth/callback`
   - `https://learnwhatyouown.com/auth/callback`
   - the current `workers.dev` origin followed by `/auth/callback`, if that origin remains public
5. Copy the Project URL and publishable key from **Project Settings → API** into `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` locally and in the Cloudflare Worker environment.

The publishable key is designed for browser use; row-level security protects private records. Never put the Supabase `service_role` or secret key in browser code or a public environment variable.

### Google sign-in

1. Create a Web OAuth client in Google Cloud.
2. Add Supabase's callback URL as an authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
3. Add the Google client ID and client secret under **Supabase → Authentication → Providers → Google**.
4. Keep the application callback URLs listed above in Supabase's redirect allowlist.

Email users select a unique username during registration. Google users select one after their first verified sign-in. Emails are held in Supabase Auth and are never displayed with published insights.

Administrators can open `/admin` to review visitor/session metrics, account growth, invitations, roles, deletions, and the privileged-action audit log. Visitor analytics use a random first-party browser identifier, respect Do Not Track, and deliberately avoid IP addresses and user-agent fingerprinting.

The founder-administrator migration promotes the existing `Yourhost` username to `admin`, then checks the legacy `founder` username. If neither has been claimed, it promotes the oldest existing account, matching the prototype's original first-account founder convention. Review the selected account immediately after applying the migration.

## Filing facts and relationship graph

Public research uses three deliberately separate D1 record types:

- `filing_facts` contains normalized numerical facts and the exact SEC filing provenance for every period.
- `dossier_claims` labels each published statement as a verified fact, company statement, or editorial analysis.
- `company_relationships` stores directional supplier-to-customer edges. Public tickers are clickable; private organizations can still appear as named nodes.

Apply the D1 migrations in the order documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Do not apply them to a preview database under the production name. Editors can then open `/admin` and import a ticker's normalized SEC Company Facts. The importer uses the verified ticker-to-CIK mapping and does not import analyst estimates.

Members can submit a **Supplier / customer relationship** with primary evidence. The proposal stays private in Supabase until an editor approves it; approval promotes the structured edge to D1 while retaining the contributor username and disclosure trail.

## External intelligence

Every public-company dossier maps sector-relevant, free external research sources alongside SEC evidence. The initial registry covers USAspending, USPTO, EPA ECHO, NHTSA, EIA, ClinicalTrials.gov, openFDA, NIH RePORTER, BLS, Census, BEA, CFTC, OpenAlex, and Wikidata.

Apply `drizzle/0009_external_intelligence.sql` before importing observations. `external_data_sources` retains access, attribution, and refresh metadata; `external_observations` keeps the original record identifier, retrieval date, company-match method, confidence, limitations, and moderation status. A listed source is only a research path. It must not be presented as evidence about an issuer until the specific record and company identity are verified.

Members can submit an **External dataset observation** for editorial review directly from a dossier source card. Approved generic contributions appear through the existing community-intelligence workflow; future automated connectors should write external observations as drafts and require moderation before publication.

## Exchange and OTC catalogs

The public catalog has two deliberately separate lanes:

- `/companies` serves current NYSE and Nasdaq ticker/exchange associations from the SEC, cross-checked against Nasdaq Trader's symbol-directory files.
- `/otc` serves FINRA's current OTC security master. OTC is not treated as synonymous with the Pink market, and each record keeps its issue type.

Run `npm run universe:update` to refresh the generated catalog metadata and batched `drizzle/seed-exchange-universe.sql`. Review the count changes, export production D1, apply `drizzle/0006_official-exchange-universe.sql` if it is not already present, and then execute the seed against the verified remote D1. Catalog import never publishes a dossier.

## Security model

- Supabase Auth validates email/password and Google sessions.
- Email/password accounts must verify their email before member APIs accept them.
- Row-level security restricts watchlists and portfolio positions to their owner.
- A security-definer profile function lets a user change only their username and display name, never their role.
- Contributions are private to the author until an editor approves them; approved insights are public and attributed only to the username.
- Editor/admin roles must be assigned directly in the Supabase `profiles` table by a trusted administrator.

## Useful commands

- `npm run dev` — local development
- `npm run build` — production build verification
- `npm test` — project tests
- `npm run db:generate` — generate D1/Drizzle migrations
- `npm run db:seed:dossiers` — regenerate the ignored dossier seed SQL
- `npm run db:seed:company-overlay` — regenerate the company-only index metadata overlay
- `npm run sec:update` — refresh the SEC ticker-to-CIK directory
- `npm run universe:update` — refresh SEC/Nasdaq-listed and FINRA OTC catalog seed data
