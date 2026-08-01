import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("describes homepage search honestly and offers supported examples", async () => {
  const [home, search] = await Promise.all([
    source("app/page.tsx"),
    source("app/data/companySearch.ts"),
  ]);

  assert.match(home, /placeholder="Search ticker, company, sector, or index"/);
  assert.match(home, /Search by ticker, company, sector, or index/);
  assert.match(home, /\["AMC", "NVIDIA", "Semiconductors", "S&P 500"\]/);
  assert.doesNotMatch(home, />Popular </);
  assert.doesNotMatch(home, /executive, or theme/);
  assert.match(search, /company\.ticker/);
  assert.match(search, /company\.name/);
  assert.match(search, /company\.sector/);
  assert.match(search, /company\.memberships/);
});

test("uses authoritative live homepage coverage and deduplicated primary-source counts", async () => {
  const [home, statsRoute, styles] = await Promise.all([
    source("app/page.tsx"),
    source("app/api/site-stats/route.ts"),
    source("app/globals.css"),
  ]);

  assert.match(home, /fetch\("\/api\/site-stats"\)/);
  assert.match(home, /researchableSymbols/);
  assert.match(home, /uniquePrimarySources/);
  assert.match(home, /sourceCountsByTicker\[company\.ticker\]/);
  assert.match(home, /\/api\/universe\?market=\$\{market\}/);
  assert.doesNotMatch(home, /8,903/);
  assert.doesNotMatch(home, /researchUniverse\.length\.toLocaleString/);
  assert.match(statsRoute, /companies WHERE is_active=1/);
  assert.match(statsRoute, /sec-accession:/);
  assert.match(statsRoute, /COUNT\(DISTINCT source_key\)/);
  assert.match(statsRoute, /cd\.status = 'published'/);
  assert.match(styles, /\.proof-definition\{/);
});

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

test("adds sector-aware external intelligence with moderated public evidence", async () => {
  const [registry, panel, featured, starter, ondas, contributionClient, contributionRoute, schema, migration] = await Promise.all([
    source("app/data/externalIntelligence.ts"),
    source("app/ExternalIntelligencePanel.tsx"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/company/onds/page.tsx"),
    source("app/contribute/ContributionClient.tsx"),
    source("app/api/contributions/route.ts"),
    source("db/schema.ts"),
    source("drizzle/0009_external_intelligence.sql"),
  ]);

  for (const sourceName of ["USAspending.gov", "USPTO Open Data", "EPA ECHO", "NHTSA Safety Data", "EIA Open Data", "ClinicalTrials.gov", "openFDA", "NIH RePORTER", "BLS Public Data", "Census Data API", "BEA Data API", "CFTC Commitments of Traders", "OpenAlex", "Wikidata"]) {
    assert.match(registry, new RegExp(sourceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(panel, /FREE EXTERNAL DATA · BEYOND SEC FILINGS/);
  assert.match(panel, /research paths—not claims/);
  assert.match(panel, /VERIFY BEFORE PUBLISHING/);
  assert.match(featured, /<ExternalIntelligencePanel/);
  assert.match(starter, /<ExternalIntelligencePanel/);
  assert.match(ondas, /<ExternalIntelligencePanel/);
  assert.match(contributionClient, /External dataset observation/);
  assert.match(contributionRoute, /External dataset observation/);
  assert.match(schema, /export const externalDataSources/);
  assert.match(schema, /export const externalObservations/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `external_observations`/);
  assert.match(migration, /company_match_method/);
  assert.match(migration, /match_confidence/);
});

test("locks the first A batch to ten alphabetical, SEC-sourced dossiers", async () => {
  const [claims, importRoute, factRepository] = await Promise.all([
    source("app/data/curatedDossierClaims.ts"),
    source("app/api/admin/research/import/route.ts"),
    source("app/data/secFactsRepository.ts"),
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
  assert.match(factRepository, /const D1_FACT_BATCH_SIZE = 5/);
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

test("distinguishes public research from verified-account tools and collects private phone details", async () => {
  const [comparison, home, login, onboarding, header] = await Promise.all([
    source("app/AccessComparison.tsx"),
    source("app/page.tsx"),
    source("app/login/page.tsx"),
    source("app/onboarding/page.tsx"),
    source("app/ui.tsx"),
  ]);

  assert.match(comparison, /WITHOUT AN ACCOUNT/);
  assert.match(comparison, /WITH A FREE ACCOUNT/);
  assert.match(comparison, /private watchlists, portfolios, and research notebooks/);
  assert.match(home, /<AccessComparison/);
  assert.match(login, /PHONE NUMBER <em>optional<\/em>/);
  assert.match(login, /does not opt you into marketing texts/);
  assert.match(onboarding, /PHONE NUMBER <em>optional<\/em>/);
  assert.match(login, /phone_number: phoneNumber/);
  assert.match(onboarding, /sms_marketing_consent: false/);
  assert.match(onboarding, /supabase\.auth\.updateUser/);
  assert.match(header, /Join free/);
});

test("accepts authenticated product feedback with private history and moderation status", async () => {
  const [page, client, route, migration, layout, account] = await Promise.all([
    source("app/feedback/page.tsx"),
    source("app/feedback/FeedbackClient.tsx"),
    source("app/api/feedback/route.ts"),
    source("drizzle/0008_product_feedback.sql"),
    source("app/layout.tsx"),
    source("app/account/AccountClient.tsx"),
  ]);

  assert.match(page, /HELP SHAPE THE PRODUCT/);
  assert.match(client, /New product feedback/);
  assert.match(client, /My feedback history/);
  assert.match(client, /@Yourhost will review/);
  assert.match(route, /requireSupabaseUser/);
  assert.match(route, /Title must be 8–120 characters/);
  assert.match(route, /Details must be 30–4,000 characters/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `product_feedback`/);
  assert.match(migration, /`status` IN \('submitted', 'reviewing', 'planned', 'completed', 'declined'\)/);
  assert.match(route, /env\.DB\.prepare/);
  assert.match(route, /WHERE user_id=\?/);
  assert.match(layout, /href="\/feedback"/);
  assert.match(account, /Product feedback/);
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

test("moderates IPO and private-company dossiers before publishing them to D1", async () => {
  const [schema, d1Migration, supabaseMigration, contributionRoute, moderationRoute, contributionClient, directory] = await Promise.all([
    source("db/schema.ts"),
    source("drizzle/0005_emerging-companies-and-aapl-supply-chain.sql"),
    source("supabase/migrations/20260801050000_company_dossier_proposals.sql"),
    source("app/api/contributions/route.ts"),
    source("app/api/admin/contributions/route.ts"),
    source("app/contribute/ContributionClient.tsx"),
    source("app/emerging-companies/page.tsx"),
  ]);

  assert.match(schema, /export const emergingCompanyDossiers/);
  assert.match(d1Migration, /CREATE TABLE IF NOT EXISTS `emerging_company_dossiers`/);
  assert.match(supabaseMigration, /roadshow-materials/);
  assert.match(supabaseMigration, /file_size_limit/);
  assert.match(supabaseMigration, /application\/pdf/);
  assert.match(contributionRoute, /Upcoming IPO dossier/);
  assert.match(contributionRoute, /Private company dossier/);
  assert.match(moderationRoute, /publishCompanyProposal/);
  assert.match(moderationRoute, /payload\.status === "approved"/);
  assert.match(contributionClient, /UPLOAD PDF · MAX 20 MB/);
  assert.match(directory, /Upcoming IPOs/);
  assert.match(directory, /Private companies/);
});

test("shows an evidence-classified Apple supply-chain research document", async () => {
  const [document, panel, migration] = await Promise.all([
    source("app/company/aapl/supply-chain/page.tsx"),
    source("app/ResearchFoundationPanel.tsx"),
    source("drizzle/0005_emerging-companies-and-aapl-supply-chain.sql"),
  ]);

  assert.match(document, /Apple’s 2025 Form 10-K/);
  assert.match(document, /generally does <strong>not<\/strong> name the individual supplier/);
  assert.match(document, /Apple Supplier List/);
  assert.match(document, /What one graph relationship stores/);
  assert.match(document, /Still unresolved/);
  assert.match(panel, /Open Apple supply-chain document/);
  assert.match(migration, /Taiwan Semiconductor Manufacturing Company Limited/);
  assert.match(migration, /exact role in the cited list/);
});

test("opens homepage sample cards and changelog rows as company dossiers", async () => {
  const home = await source("app/page.tsx");

  assert.match(home, /const dossierHref = \(ticker: string\) => `\/company\/\$\{companySlug\(ticker\)\}`/);
  assert.match(home, /className="company-card-link" href=\{dossierHref\(company\.ticker\)\}/);
  assert.match(home, /href=\{dossierHref\(update\.ticker\)\} className="change-row"/);
  assert.doesNotMatch(home, /company\.ticker === "ONDS" \? "\/company\/onds" : "\/companies"/);
});

test("keeps NYSE and Nasdaq separate from the official FINRA OTC catalog", async () => {
  const [directory, api, schema, migration, updater, overlay, metadata, header, footer] = await Promise.all([
    source("app/CompanyUniverseDirectory.tsx"),
    source("app/api/universe/route.ts"),
    source("db/schema.ts"),
    source("drizzle/0006_official-exchange-universe.sql"),
    source("scripts/update-exchange-universe.mjs"),
    source("scripts/generate-company-index-overlay.ts"),
    source("app/data/exchangeUniverseMeta.generated.ts"),
    source("app/ui.tsx"),
    source("app/layout.tsx"),
  ]);

  assert.match(directory, /OTC does not mean “Pink Sheet” in every case/);
  assert.match(directory, /Catalog coverage is separate from dossier completion/);
  assert.match(directory, /SEC \+ Nasdaq Trader sources/);
  assert.match(api, /c\.listing_scope = \?/);
  assert.match(api, /LEFT JOIN company_dossiers/);
  assert.match(api, /LIMIT \? OFFSET \?/);
  assert.match(schema, /listingScope/);
  assert.match(schema, /securityType/);
  assert.match(schema, /universeSourceUrl/);
  assert.match(migration, /companies_listing_scope_ticker_idx/);
  assert.match(updater, /company_tickers_exchange\.json/);
  assert.match(updater, /otcSecurityMaster/);
  assert.match(updater, /nasdaqlisted\.txt/);
  assert.match(overlay, /memberships_json = excluded\.memberships_json/);
  assert.doesNotMatch(overlay, /exchange = excluded\.exchange/);
  assert.doesNotMatch(overlay, /name = excluded\.name/);
  assert.doesNotMatch(overlay, /company_dossiers/);
  assert.match(metadata, /listedSecurityCount = \d+/);
  assert.match(metadata, /otcSecurityCount = \d+/);
  assert.match(header, /href="\/otc"/);
  assert.match(footer, /OTC \/ Pink Market/);
});

test("keeps long starter-company names clear of account actions", async () => {
  const [starter, styles] = await Promise.all([
    source("app/company/[ticker]/page.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(starter, /name: catalogCompany\?\.name \|\| universeCompany\.name/);
  assert.match(starter, /normalized\(firstWord\) === normalized\(ticker\)/);
  assert.match(styles, /@media\(max-width:1100px\)\{\.starter-company-hero>\.container\{grid-template-columns:1fr/);
  assert.match(styles, /\.starter-company-title h1\{max-width:24ch/);
  assert.match(styles, /\.starter-company-actions\{max-width:540px[^}]*flex-wrap:wrap/);
});

test("ranks twelve homepage dossiers by verified community research demand", async () => {
  const [home, route, migration] = await Promise.all([
    source("app/page.tsx"),
    source("app/api/research-demand/route.ts"),
    source("supabase/migrations/20260801060000_company_research_demand.sql"),
  ]);

  for (const ticker of ["AMC", "NVDA", "AAPL", "AMZN", "TSLA", "PLTR", "RKLB", "BB", "BE", "BA", "CAT", "CRWV"]) assert.match(home, new RegExp(`ticker: "${ticker}"`));
  assert.match(home, /Hot companies, ranked by owners/);
  assert.match(home, /toggleDemand/);
  assert.match(home, /viewerVotes/);
  assert.match(home, /NEXT IN THE RESEARCH QUEUE/);
  assert.match(route, /company_research_demand/);
  assert.match(route, /requireSupabaseUser/);
  assert.match(migration, /create table if not exists public\.company_research_votes/);
  assert.match(migration, /count\(distinct s\.visitor_id\)/);
  assert.match(migration, /vote_count \* 10 \+ c\.page_views/);
  assert.match(migration, /auth\.uid\(\) = user_id/);
});

test("provides full primary-source dossiers for all twelve homepage companies", async () => {
  const [dossiers, featuredPage, starterPage, ondas] = await Promise.all([
    source("app/data/featuredDossiers.ts"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/company/onds/page.tsx"),
  ]);
  for (const ticker of ["NVDA", "AAPL", "AMZN", "TSLA", "PLTR", "RKLB", "BB", "BE", "BA", "CAT", "CRWV"]) assert.match(dossiers, new RegExp(`\\n  ${ticker}: \\{`));
  assert.match(dossiers, /BlackBerry 2026 Form 10-K/);
  assert.match(dossiers, /Bloom Energy 2025 Form 10-K/);
  assert.match(dossiers, /Rocket Lab 2025 Form 10-K/);
  assert.match(dossiers, /Palantir 2025 Form 10-K/);
  assert.match(dossiers, /Tesla 2025 Form 10-K/);
  assert.match(featuredPage, /ResearchDemandButton/);
  assert.match(starterPage, /ResearchDemandButton/);
  assert.match(ondas, /ResearchDemandButton/);
});

test("publishes complete primary-source owner dossiers for AMC and RCL", async () => {
  const [dossiers, featuredPage, generator] = await Promise.all([
    source("app/data/featuredDossiers.ts"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("scripts/generate-normalized-dossier-publish.ts"),
  ]);

  for (const ticker of ["AMC", "RCL"]) {
    assert.match(dossiers, new RegExp(`\\n  ${ticker}: \\{`));
    assert.match(dossiers, new RegExp(`ticker: "${ticker}"[\\s\\S]{0,120}completeness: 100`));
  }
  assert.match(dossiers, /AMC Entertainment 2025 Form 10-K/);
  assert.match(dossiers, /AMC Second-Quarter 2026 Form 10-Q/);
  assert.match(dossiers, /2026 YTD share-price return/);
  assert.match(dossiers, /Cinemark Holdings/);
  assert.match(dossiers, /Regal Cineworld Group/);
  assert.match(dossiers, /IMAX Corporation/);
  assert.match(featuredPage, /Competitors &amp; comparables/);
  assert.match(featuredPage, /Performance—and what drove it/);
  assert.match(dossiers, /Royal Caribbean 2025 Form 10-K/);
  assert.match(dossiers, /Royal Caribbean Second-Quarter 2026 Results/);
  assert.match(featuredPage, /Primary-source editorial review/);
  assert.match(featuredPage, /item\.href\.includes\("sec\.gov"\)/);
  assert.match(generator, /financial_drivers_json/);
  assert.match(generator, /INSERT INTO dossier_claims/);
  assert.match(generator, /DELETE FROM dossier_sources WHERE ticker/);
});

test("publishes a complete filing-grounded CoreWeave ownership dossier", async () => {
  const [dossiers, featuredPage] = await Promise.all([
    source("app/data/featuredDossiers.ts"),
    source("app/FeaturedCompanyDossier.tsx"),
  ]);

  assert.match(dossiers, /ticker: "CRWV"[\s\S]{0,120}completeness: 100/);
  assert.match(dossiers, /CoreWeave First-Quarter 2026 Form 10-Q/);
  assert.match(dossiers, /\$99\.4B/);
  assert.match(dossiers, /65% top two/);
  assert.match(dossiers, /\$25\.15B debt/);
  assert.match(dossiers, /\$7\.70B Q1 capex/);
  assert.match(dossiers, /NVIDIA and CoreWeave expanded collaboration/);
  assert.match(dossiers, /Nebius Group/);
  assert.match(dossiers, /Amazon Web Services/);
  assert.match(dossiers, /Microsoft Azure/);
  assert.match(dossiers, /Lambda/);
  assert.match(dossiers, /Crusoe/);
  assert.match(dossiers, /Second-quarter results · August 11/);
  assert.match(featuredPage, /CoreWeave, Inc\./);
});

test("publishes the founder mission with @Yourhost as host and letter author", async () => {
  const [home, letter, header, footer, founderMigration] = await Promise.all([
    source("app/page.tsx"),
    source("app/founders-letter/page.tsx"),
    source("app/ui.tsx"),
    source("app/layout.tsx"),
    source("supabase/migrations/20260801070000_founder_administrator.sql"),
  ]);

  assert.match(home, /THE FOUNDER’S MISSION/);
  assert.match(home, /Ownership should come with understanding/);
  assert.match(home, /Ownership Intelligence Network/);
  assert.match(home, /HOSTED &amp; MODERATED BY/);
  assert.match(home, /@Yourhost/);
  assert.doesNotMatch(home, /RemarkAI/);
  assert.match(letter, /We believe ownership should come with understanding/);
  assert.match(letter, /Written by @Yourhost · Founder, public host, and moderator/);
  assert.match(letter, /Together, they create a new form of Ownership Intelligence/);
  assert.match(founderMigration, /lower\(username\) in \('yourhost', 'founder'\)/);
  assert.match(founderMigration, /set role = 'admin'/);
  assert.match(founderMigration, /order by created_at asc/);
  assert.match(home, /href="\/company\/amc"/);
  assert.match(header, /href="\/company\/amc">Research/);
  assert.match(footer, /Founder’s Letter/);
  assert.match(footer, /Featured AMC dossier/);
});

test("separates company releases from external news on every dossier", async () => {
  const [panel, route, dossiers, featuredPage, starterPage, ondas, styles] = await Promise.all([
    source("app/CompanyNewsPanel.tsx"),
    source("app/api/company-news/route.ts"),
    source("app/data/featuredDossiers.ts"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/company/onds/page.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(panel, /Headline monitor, not verified research/);
  assert.match(panel, /Company releases/);
  assert.match(panel, /Public &amp; industry coverage/);
  assert.match(route, /officialNews\(newsroomUrl, newsroomFeedUrl\)/);
  assert.match(route, /www\.bing\.com\/news\/search/);
  assert.match(route, /replace\(\/\^http:/);
  assert.match(route, /parseNewsroomHtml/);
  assert.match(route, /stale-while-revalidate=900/);
  assert.match(dossiers, /investor\.amctheatres\.com\/news-events\/press-releases/);
  assert.match(dossiers, /investor\.amctheatres\.com\/news-events\/press-releases\/rss/);
  assert.match(dossiers, /rclinvestor\.com\/press-releases/);
  assert.match(featuredPage, /href="#news"/);
  assert.match(starterPage, /CompanyNewsPanel/);
  assert.match(ondas, /CompanyNewsPanel/);
  assert.match(styles, /\.company-news-grid\{display:grid;grid-template-columns:1fr 1fr/);
});

test("automatically imports, refreshes, and explains filing-grounded financial history", async () => {
  const [panel, researchApi, importer, scheduledRoute, worker, schema, migration, publisher, styles] = await Promise.all([
    source("app/ResearchFoundationPanel.tsx"),
    source("app/api/research/route.ts"),
    source("app/data/secFactsRepository.ts"),
    source("app/api/internal/sec-facts-refresh/route.ts"),
    source("worker/index.ts"),
    source("db/schema.ts"),
    source("drizzle/0007_sec-fact-import-status.sql"),
    source("scripts/generate-normalized-dossier-publish.ts"),
    source("app/globals.css"),
  ]);

  assert.match(panel, /Filed financial history/);
  assert.match(panel, /Comparable-period changes/);
  assert.match(panel, /No estimates were substituted/);
  assert.match(panel, /Open machine-readable source/);
  assert.match(researchApi, /factsImport/);
  assert.match(importer, /data\.sec\.gov\/api\/xbrl\/companyfacts/);
  assert.match(importer, /filingFactImports/);
  assert.match(scheduledRoute, /DAILY_REFRESH_LIMIT = 5/);
  assert.match(scheduledRoute, /orderBy\(asc\(filingFactImports\.lastAttemptedAt\)/);
  assert.match(worker, /refreshScheduledSecFacts/);
  assert.match(schema, /filingFactImports/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `filing_fact_imports`/);
  assert.match(publisher, /generateSecFactSql/);
  assert.match(styles, /\.filing-history\{display:flex/);
});
