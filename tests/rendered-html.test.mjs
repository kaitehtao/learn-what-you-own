import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("keeps filed facts, editorial claims, and company relationships as separate public records", async () => {
  const [schema, migration] = await Promise.all([
    source("db/schema.ts"),
    source("drizzle/0002_polite_betty_brant.sql"),
  ]);

  assert.match(schema, /export const filingFacts/);
  assert.match(schema, /export const dossierClaims/);
  assert.match(schema, /export const companyRelationships/);
  assert.match(schema, /"verified_fact", "company_statement", "editorial_analysis"/);
  assert.match(schema, /supplierTicker/);
  assert.match(schema, /customerTicker/);
  assert.match(migration, /CREATE TABLE `filing_facts`/);
  assert.match(migration, /CREATE TABLE `company_relationships`/);
  assert.match(migration, /company_relationship_contribution_idx/);
});

test("publishes only moderated relationship research to the D1 graph", async () => {
  const [publicResearchRoute, moderationRoute, contributionRoute, supabaseMigration] = await Promise.all([
    source("app/api/research/route.ts"),
    source("app/api/admin/contributions/route.ts"),
    source("app/api/contributions/route.ts"),
    source("supabase/migrations/20260731010000_relationship_contributions.sql"),
  ]);

  assert.match(publicResearchRoute, /companyRelationships/);
  assert.match(publicResearchRoute, /dossierClaims\.status, "published"/);
  assert.match(moderationRoute, /payload\.status === "approved"/);
  assert.match(moderationRoute, /publishRelationship/);
  assert.match(contributionRoute, /Supplier \/ customer relationship/);
  assert.match(supabaseMigration, /relationship_direction/);
  assert.match(supabaseMigration, /supplier_to_company/);
  assert.match(supabaseMigration, /company_to_customer/);
});

test("renders the research foundation on featured, starter, and ONDS dossier pages", async () => {
  const [panel, featured, starter, ondas] = await Promise.all([
    source("app/ResearchFoundationPanel.tsx"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/company/onds/page.tsx"),
  ]);

  assert.match(panel, /PUBLIC FILING FACTS/);
  assert.match(panel, /BUSINESS RELATIONSHIP GRAPH/);
  assert.match(panel, /relatedTicker[\s\S]*\/company\//);
  assert.match(featured, /<ResearchFoundationPanel/);
  assert.match(starter, /<ResearchFoundationPanel/);
  assert.match(ondas, /<ResearchFoundationPanel/);
});

test("locks the first A batch to ten alphabetical, SEC-sourced dossiers", async () => {
  const [claims, importRoute] = await Promise.all([
    source("app/data/curatedDossierClaims.ts"),
    source("app/api/admin/research/import/route.ts"),
  ]);

  assert.match(claims, /firstAlphabeticalABatch = \["A", "AA", "AAL", "AAMI", "AAOI", "AAON", "AAP", "AAPL", "AAT", "ABAT"\]/);
  assert.equal((claims.match(/sourceUrl: "https:\/\/www\.sec\.gov\/Archives\/edgar\/data\//g) ?? []).length, 10);
  assert.equal((claims.match(/\n    filingType: "10-K"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "business_model"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "segments"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "revenue_drivers"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "risk_factors"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "owner_watchlist"/g) ?? []).length, 10);
  assert.equal((claims.match(/whyItMatters:/g) ?? []).length, 51);
  assert.equal((claims.match(/sourceExcerpt:/g) ?? []).length, 51);

  assert.match(importRoute, /sourceHostname !== "sec\.gov"/);
  assert.match(importRoute, /const D1_FACT_BATCH_SIZE = 5/);
  assert.match(importRoute, /db\.insert\(companyDossiers\)/);
  assert.match(importRoute, /db\.insert\(dossierSources\)/);
  assert.match(importRoute, /db\.insert\(dossierClaims\)/);
  assert.match(importRoute, /dossierStatus: dossier \? "published" : "facts-only"/);
});

test("keeps private messages between verified sender and recipient accounts", async () => {
  const [migration, route, client, header] = await Promise.all([
    source("supabase/migrations/20260801000000_private_messages.sql"),
    source("app/api/messages/route.ts"),
    source("app/messages/MessagesClient.tsx"),
    source("app/ui.tsx"),
  ]);

  assert.match(migration, /create table if not exists public\.private_messages/);
  assert.match(migration, /auth\.uid\(\) = sender_id/);
  assert.match(migration, /auth\.uid\(\) = recipient_id/);
  assert.match(migration, /sender_id <> recipient_id/);
  assert.match(migration, /security definer set search_path = public/);
  assert.match(migration, /revoke all on public\.private_messages from anon, authenticated/);
  assert.match(migration, /grant execute on function public\.send_private_message/);
  assert.match(route, /requireSupabaseUser/);
  assert.match(route, /send_member_message/);
  assert.match(route, /mark_private_message_read/);
  assert.match(route, /delete_private_message/);
  assert.doesNotMatch(route, /user\.email|profile\.email/);
  assert.match(client, /Member correspondence/);
  assert.match(client, /Send private message/);
  assert.match(client, /Reply/);
  assert.match(header, /href="\/messages"/);
});

test("supports public member profiles, follows, and per-message visibility", async () => {
  const [migration, memberRoute, followRoute, memberClient, messageClient] = await Promise.all([
    source("supabase/migrations/20260801010000_member_following_public_messages.sql"),
    source("app/api/members/[username]/route.ts"),
    source("app/api/follows/route.ts"),
    source("app/members/[username]/MemberProfileClient.tsx"),
    source("app/messages/MessagesClient.tsx"),
  ]);

  assert.match(migration, /create table if not exists public\.member_follows/);
  assert.match(migration, /follower_id <> followed_id/);
  assert.match(migration, /auth\.uid\(\) = follower_id/);
  assert.match(migration, /visibility in \('private', 'public'\)/);
  assert.match(migration, /visibility = 'public'/);
  assert.match(migration, /send_member_message/);
  assert.match(memberRoute, /followerCount/);
  assert.match(memberRoute, /followingCount/);
  assert.match(memberRoute, /publicMessages/);
  assert.match(followRoute, /You cannot follow yourself/);
  assert.match(memberClient, /Followers/);
  assert.match(memberClient, /Following/);
  assert.match(memberClient, /Public note/);
  assert.match(messageClient, /WHO CAN SEE THIS/);
  assert.match(messageClient, /Only you and the recipient/);
  assert.match(messageClient, /Also appears on their profile/);
});

test("keeps investment notebooks private while supporting sourced public handoff", async () => {
  const [migration, route, client, captureButton, contributionPage, header] = await Promise.all([
    source("supabase/migrations/20260801020000_private_research_notebooks.sql"),
    source("app/api/notebook/route.ts"),
    source("app/notebook/NotebookClient.tsx"),
    source("app/SaveToNotebookButton.tsx"),
    source("app/contribute/page.tsx"),
    source("app/ui.tsx"),
  ]);

  assert.match(migration, /create table if not exists public\.research_notebooks/);
  assert.match(migration, /create table if not exists public\.research_notes/);
  assert.match(migration, /auth\.uid\(\) = user_id/);
  assert.match(migration, /revoke all on public\.research_notebooks from anon/);
  assert.match(migration, /revoke all on public\.research_notes from anon/);
  assert.match(route, /requireSupabaseUser/);
  assert.match(route, /Choose a ticker from the research universe/);
  assert.match(route, /Source URL must begin with http:\/\/ or https:\/\//);
  assert.match(client, /PRIVATE BY DEFAULT/);
  assert.match(client, /ONE-SENTENCE WORKING THESIS/);
  assert.match(client, /Prepare public contribution/);
  assert.match(client, /setTimeout[\s\S]*850/);
  assert.match(captureButton, /action: "capture"/);
  assert.match(contributionPage, /initialDraft/);
  assert.match(header, /href="\/notebook"/);
});

test("creates private member notifications and opt-in email delivery", async () => {
  const [migration, route, bell, center, messages, emailDelivery, digestRoute, worker, viteConfig, header] = await Promise.all([
    source("supabase/migrations/20260801030000_member_notifications.sql"),
    source("app/api/notifications/route.ts"),
    source("app/NotificationBell.tsx"),
    source("app/notifications/NotificationsClient.tsx"),
    source("app/messages/MessagesClient.tsx"),
    source("app/email-notifications.ts"),
    source("app/api/notifications/email-digest/route.ts"),
    source("worker/index.ts"),
    source("vite.config.ts"),
    source("app/ui.tsx"),
  ]);

  assert.match(migration, /create table if not exists public\.notifications/);
  assert.match(migration, /create table if not exists public\.notification_preferences/);
  assert.match(migration, /create table if not exists public\.email_notification_outbox/);
  assert.match(migration, /auth\.uid\(\) = user_id/);
  assert.match(migration, /revoke all on public\.email_notification_outbox from anon, authenticated/);
  assert.match(migration, /insert into public\.notifications/);
  assert.match(migration, /on conflict \(user_id, entity_type, entity_id\) do nothing/);
  assert.match(route, /requireSupabaseUser/);
  assert.match(route, /read_all/);
  assert.match(route, /emailAvailable/);
  assert.match(bell, /30000/);
  assert.match(bell, /unread notifications/);
  assert.match(center, /Email delivery is awaiting provider connection/);
  assert.match(messages, /lwy:notifications-changed/);
  assert.match(emailDelivery, /The private message body is never included/);
  assert.match(emailDelivery, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(emailDelivery, /RESEND_API_KEY/);
  assert.match(emailDelivery, /if \(!due\?\.length\) return \{ recipients: 0, notifications: 0 \}/);
  assert.match(emailDelivery, /if \(!notifications\?\.length\)[\s\S]*status: "skipped"[\s\S]*No notification content available/);
  assert.doesNotMatch(emailDelivery, /messageBody|message_body/);
  assert.match(digestRoute, /NOTIFICATION_CRON_SECRET/);
  assert.match(worker, /America\/Los_Angeles/);
  assert.match(worker, /isPacificDigestHour\(controller\.scheduledTime\)/);
  assert.match(worker, /\/api\/notifications\/email-digest/);
  assert.match(viteConfig, /0 15,16 \* \* \*/);
  assert.match(header, /NotificationBell/);
  assert.match(header, /href="\/notifications"/);
});

test("provides an admin-only audience and account control center", async () => {
  const [migration, route, dashboard, tracker, layout, adminPage] = await Promise.all([
    source("supabase/migrations/20260801040000_admin_dashboard_analytics.sql"),
    source("app/api/admin/dashboard/route.ts"),
    source("app/admin/AdminDashboard.tsx"),
    source("app/VisitorTracker.tsx"),
    source("app/layout.tsx"),
    source("app/admin/page.tsx"),
  ]);

  assert.match(migration, /create table if not exists public\.site_visits/);
  assert.match(migration, /create table if not exists public\.admin_account_audit/);
  assert.match(migration, /revoke all on public\.site_visits from anon, authenticated/);
  assert.match(migration, /admin_dashboard_visitor_metrics/);
  assert.doesNotMatch(migration, /ip_address|user_agent/);
  assert.match(route, /requireAdmin/);
  assert.match(route, /inviteUserByEmail/);
  assert.match(route, /deleteUser\(userId, false\)/);
  assert.match(route, /You cannot delete the account you are currently using/);
  assert.match(route, /The final administrator cannot be deleted/);
  assert.match(route, /admin_account_audit/);
  assert.match(dashboard, /Audience and accounts/);
  assert.match(dashboard, /Invite member/);
  assert.match(dashboard, /DELETE @/);
  assert.match(dashboard, /Visitor counts use a random first-party browser identifier/);
  assert.match(tracker, /navigator\.doNotTrack/);
  assert.match(tracker, /crypto\.randomUUID/);
  assert.match(layout, /<VisitorTracker/);
  assert.match(adminPage, /<AdminDashboard/);
});
