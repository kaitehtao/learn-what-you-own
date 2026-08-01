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
