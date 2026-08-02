import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const companies = sqliteTable("companies", {
  ticker: text("ticker").primaryKey(),
  name: text("name").notNull(),
  sector: text("sector").notNull().default("Not classified"),
  exchange: text("exchange").notNull().default(""),
  marketCap: real("market_cap"),
  membershipsJson: text("memberships_json").notNull().default("[]"),
  indexWeightsJson: text("index_weights_json").notNull().default("{}"),
  cik: text("cik"),
  listingScope: text("listing_scope", { enum: ["listed", "otc", "other"] }).notNull().default("other"),
  securityType: text("security_type").notNull().default("Listed issuer security"),
  securityDescription: text("security_description").notNull().default(""),
  universeSourceUrl: text("universe_source_url").notNull().default(""),
  universeSourceAsOf: text("universe_source_as_of").notNull().default(""),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("companies_listing_scope_ticker_idx").on(table.listingScope, table.ticker),
  index("companies_exchange_ticker_idx").on(table.exchange, table.ticker),
  index("companies_name_idx").on(table.name),
]);

export const companyDossiers = sqliteTable("company_dossiers", {
  ticker: text("ticker").primaryKey().references(() => companies.ticker, { onDelete: "cascade" }),
  status: text("status", { enum: ["queued", "researching", "verified", "published"] }).notNull().default("queued"),
  contentJson: text("content_json"),
  verifiedBy: text("verified_by"),
  verifiedAt: text("verified_at"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const dossierSources = sqliteTable("dossier_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticker: text("ticker").notNull().references(() => companyDossiers.ticker, { onDelete: "cascade" }),
  sourceType: text("source_type", { enum: ["sec", "company"] }).notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  filingType: text("filing_type"),
  filedAt: text("filed_at"),
  accessedAt: text("accessed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("dossier_source_ticker_url_idx").on(table.ticker, table.url),
]);

// Filing-derived numerical facts remain separate from editorial prose so every
// chart point can be traced to the exact filing and reporting period.
export const filingFacts = sqliteTable("filing_facts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticker: text("ticker").notNull().references(() => companies.ticker, { onDelete: "cascade" }),
  metricKey: text("metric_key").notNull(),
  taxonomy: text("taxonomy").notNull().default("us-gaap"),
  concept: text("concept").notNull(),
  label: text("label").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  periodStart: text("period_start"),
  periodEnd: text("period_end").notNull(),
  fiscalYear: integer("fiscal_year"),
  fiscalPeriod: text("fiscal_period"),
  form: text("form").notNull(),
  filedAt: text("filed_at").notNull(),
  accessionNumber: text("accession_number").notNull(),
  sourceUrl: text("source_url").notNull(),
  dimensionsJson: text("dimensions_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("filing_fact_period_idx").on(
    table.ticker,
    table.metricKey,
    table.periodEnd,
    table.fiscalPeriod,
  ),
]);

// Import state distinguishes a queued refresh from an SEC issuer whose XBRL
// filing does not expose any of the normalized metrics we currently support.
export const filingFactImports = sqliteTable("filing_fact_imports", {
  ticker: text("ticker").primaryKey().references(() => companies.ticker, { onDelete: "cascade" }),
  status: text("status", { enum: ["success", "no_compatible_facts", "error"] }).notNull(),
  sourceUrl: text("source_url").notNull(),
  importedCount: integer("imported_count").notNull().default(0),
  metricCount: integer("metric_count").notNull().default(0),
  lastAttemptedAt: text("last_attempted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSuccessAt: text("last_success_at"),
  errorMessage: text("error_message"),
}, (table) => [
  index("filing_fact_import_status_attempted_idx").on(table.status, table.lastAttemptedAt),
]);

// Each newly detected 10-Q or 10-K creates one durable quarterly update. Filed
// facts can refresh automatically; thesis prose remains visibly queued for
// editorial review until a human publishes the interpretation.
export const quarterlyDossierUpdates = sqliteTable("quarterly_dossier_updates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticker: text("ticker").notNull().references(() => companyDossiers.ticker, { onDelete: "cascade" }),
  accessionNumber: text("accession_number").notNull(),
  form: text("form").notNull(),
  periodEnd: text("period_end").notNull(),
  filedAt: text("filed_at").notNull(),
  sourceUrl: text("source_url").notNull(),
  status: text("status", { enum: ["facts_refreshed", "editorial_review", "published"] }).notNull().default("facts_refreshed"),
  editorialSummary: text("editorial_summary").notNull().default(""),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("quarterly_dossier_update_accession_idx").on(table.ticker, table.accessionNumber),
  index("quarterly_dossier_update_public_idx").on(table.ticker, table.filedAt),
  index("quarterly_dossier_update_review_idx").on(table.status, table.filedAt),
]);

// A claim is the smallest publishable unit in a dossier. The classification
// prevents an editorial interpretation from being presented as a filed fact.
export const dossierClaims = sqliteTable("dossier_claims", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticker: text("ticker").notNull().references(() => companies.ticker, { onDelete: "cascade" }),
  section: text("section").notNull(),
  claimType: text("claim_type", { enum: ["verified_fact", "company_statement", "editorial_analysis"] }).notNull(),
  claim: text("claim").notNull(),
  whyItMatters: text("why_it_matters").notNull().default(""),
  sourceTitle: text("source_title").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceExcerpt: text("source_excerpt").notNull().default(""),
  evidenceDate: text("evidence_date").notNull(),
  status: text("status", { enum: ["draft", "verified", "published"] }).notNull().default("draft"),
  verifiedBy: text("verified_by"),
  verifiedAt: text("verified_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("dossier_claim_source_idx").on(table.ticker, table.claim, table.sourceUrl),
]);

// A relationship always points from a supplier to a customer. Either endpoint
// may be a private organization without a ticker; public tickers become links.
export const companyRelationships = sqliteTable("company_relationships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplierTicker: text("supplier_ticker").references(() => companies.ticker, { onDelete: "set null" }),
  supplierName: text("supplier_name").notNull(),
  customerTicker: text("customer_ticker").references(() => companies.ticker, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  productService: text("product_service").notNull(),
  evidenceSummary: text("evidence_summary").notNull(),
  materiality: text("materiality", { enum: ["named", "material", "strategic", "unknown"] }).notNull().default("unknown"),
  evidenceClass: text("evidence_class", { enum: ["direct_disclosure", "corroborated", "inferred"] }).notNull().default("direct_disclosure"),
  sourceType: text("source_type", { enum: ["sec", "company"] }).notNull(),
  sourceTitle: text("source_title").notNull(),
  sourceUrl: text("source_url").notNull(),
  evidenceDate: text("evidence_date").notNull(),
  status: text("status", { enum: ["current", "historical"] }).notNull().default("current"),
  contributorUsername: text("contributor_username"),
  supabaseContributionId: text("supabase_contribution_id"),
  verifiedBy: text("verified_by"),
  verifiedAt: text("verified_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("company_relationship_evidence_idx").on(
    table.supplierName,
    table.customerName,
    table.productService,
    table.sourceUrl,
  ),
  uniqueIndex("company_relationship_contribution_idx").on(table.supabaseContributionId),
]);

// Upcoming IPO and private-company dossiers enter through Supabase moderation.
// Only approved profiles are copied into D1 and become publicly discoverable.
export const emergingCompanyDossiers = sqliteTable("emerging_company_dossiers", {
  slug: text("slug").primaryKey(),
  companyName: text("company_name").notNull(),
  companyType: text("company_type", { enum: ["upcoming_ipo", "private"] }).notNull(),
  proposedTicker: text("proposed_ticker"),
  proposedExchange: text("proposed_exchange"),
  expectedIpoDate: text("expected_ipo_date"),
  websiteUrl: text("website_url").notNull(),
  summary: text("summary").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  primarySourceUrl: text("primary_source_url").notNull(),
  roadshowTitle: text("roadshow_title"),
  roadshowStoragePath: text("roadshow_storage_path"),
  roadshowSourceUrl: text("roadshow_source_url"),
  contributorUsername: text("contributor_username"),
  supabaseContributionId: text("supabase_contribution_id").notNull(),
  verifiedBy: text("verified_by").notNull(),
  verifiedAt: text("verified_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("emerging_company_contribution_idx").on(table.supabaseContributionId),
]);

// External observations remain separate from SEC facts and editorial claims so
// every record retains its license, retrieval time, entity match, and caveats.
export const externalDataSources = sqliteTable("external_data_sources", {
  sourceKey: text("source_key").primaryKey(),
  name: text("name").notNull(),
  publisher: text("publisher").notNull(),
  category: text("category").notNull(),
  baseUrl: text("base_url").notNull(),
  apiUrl: text("api_url"),
  accessClass: text("access_class", { enum: ["us_government_open_data", "cc0_open_data"] }).notNull(),
  attribution: text("attribution").notNull().default(""),
  refreshCadence: text("refresh_cadence").notNull().default("source dependent"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const externalObservations = sqliteTable("external_observations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticker: text("ticker").notNull().references(() => companies.ticker, { onDelete: "cascade" }),
  sourceKey: text("source_key").notNull().references(() => externalDataSources.sourceKey),
  externalRecordId: text("external_record_id").notNull(),
  observationType: text("observation_type").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  observedAt: text("observed_at"),
  retrievedAt: text("retrieved_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  sourceUrl: text("source_url").notNull(),
  companyMatchMethod: text("company_match_method", { enum: ["direct_identifier", "verified_alias", "manual_review"] }).notNull(),
  matchConfidence: text("match_confidence", { enum: ["high", "medium", "low"] }).notNull(),
  limitations: text("limitations").notNull().default(""),
  rawJson: text("raw_json").notNull().default("{}"),
  status: text("status", { enum: ["draft", "verified", "published", "rejected"] }).notNull().default("draft"),
  verifiedBy: text("verified_by"),
  verifiedAt: text("verified_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("external_observation_record_idx").on(table.ticker, table.sourceKey, table.externalRecordId),
  index("external_observation_public_idx").on(table.ticker, table.status, table.observedAt),
]);

export const profiles = sqliteTable("profiles", {
  email: text("email").primaryKey(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["member", "contributor", "editor", "admin"] }).notNull().default("member"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const watchlistItems = sqliteTable("watchlist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("user_email").notNull().references(() => profiles.email, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("watchlist_user_ticker_idx").on(table.userEmail, table.ticker),
]);

export const portfolioPositions = sqliteTable("portfolio_positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("user_email").notNull().references(() => profiles.email, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(),
  accountLabel: text("account_label").notNull().default("Primary portfolio"),
  shares: real("shares"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const contributions = sqliteTable("contributions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("user_email").notNull().references(() => profiles.email, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(),
  contributionType: text("contribution_type").notNull(),
  claim: text("claim").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  sourceUrl: text("source_url").notNull(),
  evidenceDate: text("evidence_date").notNull(),
  confidence: text("confidence").notNull(),
  timeHorizon: text("time_horizon").notNull(),
  expertise: text("expertise").notNull().default(""),
  positionDisclosure: text("position_disclosure").notNull(),
  conflictDisclosure: text("conflict_disclosure").notNull().default(""),
  status: text("status", { enum: ["submitted", "needs_revision", "approved", "rejected"] }).notNull().default("submitted"),
  moderationNote: text("moderation_note").notNull().default(""),
  moderatedBy: text("moderated_by"),
  moderatedAt: text("moderated_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const productFeedback = sqliteTable("product_feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  category: text("category", { enum: ["New feature", "Product improvement", "Research coverage", "Bug report", "Accessibility", "Other"] }).notNull(),
  title: text("title").notNull(),
  details: text("details").notNull(),
  status: text("status", { enum: ["submitted", "reviewing", "planned", "completed", "declined"] }).notNull().default("submitted"),
  moderatorNote: text("moderator_note").notNull().default(""),
  moderatedBy: text("moderated_by"),
  moderatedAt: text("moderated_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("product_feedback_user_created_idx").on(table.userId, table.createdAt),
  index("product_feedback_status_created_idx").on(table.status, table.createdAt),
]);

export const productFeedbackVotes = sqliteTable("product_feedback_votes", {
  feedbackId: integer("feedback_id").notNull().references(() => productFeedback.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("product_feedback_vote_unique_idx").on(table.feedbackId, table.userId),
  index("product_feedback_vote_rank_idx").on(table.feedbackId, table.createdAt),
]);

// Points are awarded only after an editor or administrator verifies that a
// contribution created durable value. The source tuple makes every award
// idempotent and auditable instead of rewarding raw posting volume.
export const memberRewardLedger = sqliteTable("member_reward_ledger", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  eventType: text("event_type").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  points: integer("points").notNull(),
  description: text("description").notNull(),
  awardedBy: text("awarded_by"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("member_reward_source_unique_idx").on(table.userId, table.eventType, table.sourceType, table.sourceId),
  index("member_reward_user_created_idx").on(table.userId, table.createdAt),
  index("member_reward_username_idx").on(table.username),
]);
