# Learn What You Own

Evidence-led company dossiers built with vinext and deployed on Cloudflare. Public research stays in Cloudflare D1; member identity, profiles, watchlists, portfolio positions, and community insights use Supabase.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase member accounts

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/migrations/20260731000000_user_accounts.sql`.
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
