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
  description: text("description"),
  lede: text("lede"),
  sells: text("sells"),
  revenueModel: text("revenue_model"),
  opportunity: text("opportunity"),
  mustGoRight: text("must_go_right"),
  editorNote: text("editor_note"),
  bullTitle: text("bull_title"),
  bullJson: text("bull_json"),
  bearTitle: text("bear_title"),
  bearJson: text("bear_json"),
  thesisBreaker: text("thesis_breaker"),
  financialDriversJson: text("financial_drivers_json"),
  risksJson: text("risks_json"),
  monitorJson: text("monitor_json"),
  questionsJson: text("questions_json"),
  competitors: text("competitors"),
  evidenceDate: text("evidence_date"),
  validatedAt: text("validated_at"),
  qualityTier: text("quality_tier", { enum: ["starting_point", "machine_enriched", "editorial_review", "benchmark_complete"] }).notNull().default("starting_point"),
  qualityReviewedAt: text("quality_reviewed_at"),
  qualityRunId: text("quality_run_id"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Completion is a database policy, not a ticker allowlist. Editors can evolve
// the active evidence standard without shipping a new front-end build, and the
// scheduled reconciler applies the same rule to every dossier.
export const dossierQualityRules = sqliteTable("dossier_quality_rules", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  minSourceCount: integer("min_source_count").notNull(),
  minVerifiedClaimCount: integer("min_verified_claim_count").notNull(),
  minDistinctSectionCount: integer("min_distinct_section_count").notNull(),
  minDistinctClaimTypeCount: integer("min_distinct_claim_type_count").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("dossier_quality_active_rule_idx").on(table.isActive).where(sql`${table.isActive} = true`),
]);

export const dossierCompletionBatches = sqliteTable("dossier_completion_batches", {
  id: text("id").primaryKey(),
  universeName: text("universe_name").notNull(),
  selectionRule: text("selection_rule").notNull(),
  requestedCount: integer("requested_count").notNull(),
  selectedCount: integer("selected_count").notNull().default(0),
  approvedCount: integer("approved_count").notNull().default(0),
  needsRevisionCount: integer("needs_revision_count").notNull().default(0),
  status: text("status", { enum: ["automatic_validation", "completed"] }).notNull().default("automatic_validation"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
}, (table) => [index("dossier_completion_batch_status_idx").on(table.status, table.createdAt)]);

export const dossierCompletionCandidates = sqliteTable("dossier_completion_candidates", {
  batchId: text("batch_id").notNull().references(() => dossierCompletionBatches.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull().references(() => companies.ticker, { onDelete: "cascade" }),
  priorityRank: integer("priority_rank").notNull(),
  status: text("status", { enum: ["evidence_packet_ready", "editorial_review", "approved", "needs_revision"] }).notNull().default("evidence_packet_ready"),
  sourceCount: integer("source_count").notNull(),
  claimPreviewJson: text("claim_preview_json").notNull(),
  validationJson: text("validation_json").notNull().default("{}"),
  reviewNote: text("review_note").notNull().default(""),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  approvedAt: text("approved_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("dossier_completion_candidate_batch_ticker_idx").on(table.batchId, table.ticker),
  index("dossier_completion_candidate_status_idx").on(table.status, table.priorityRank),
  index("dossier_completion_candidate_ticker_idx").on(table.ticker, table.createdAt),
]);

export const dossierSourceBackfillBatches = sqliteTable("dossier_source_backfill_batches", {
  id: text("id").primaryKey(),
  universeName: text("universe_name").notNull(),
  selectionRule: text("selection_rule").notNull(),
  requestedLimit: integer("requested_limit").notNull(),
  selectedCount: integer("selected_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  skippedCount: integer("skipped_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  sourceCountAdded: integer("source_count_added").notNull().default(0),
  status: text("status", { enum: ["running", "completed", "partial", "failed"] }).notNull().default("running"),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
}, (table) => [
  index("dossier_source_backfill_batch_status_idx").on(table.status, table.startedAt),
]);

export const dossierSourceBackfillItems = sqliteTable("dossier_source_backfill_items", {
  batchId: text("batch_id").notNull().references(() => dossierSourceBackfillBatches.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull().references(() => companies.ticker, { onDelete: "cascade" }),
  priorityRank: integer("priority_rank").notNull(),
  membershipsJson: text("memberships_json").notNull().default("[]"),
  status: text("status", { enum: ["running", "source_foundation_complete", "no_sec_match", "no_supported_filings", "error"] }).notNull().default("running"),
  sourceCountBefore: integer("source_count_before").notNull().default(0),
  sourceCountAfter: integer("source_count_after").notNull().default(0),
  factsImportStatus: text("facts_import_status").notNull().default("not_attempted"),
  factsImportDetail: text("facts_import_detail").notNull().default(""),
  errorMessage: text("error_message").notNull().default(""),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
}, (table) => [
  uniqueIndex("dossier_source_backfill_item_batch_ticker_idx").on(table.batchId, table.ticker),
  index("dossier_source_backfill_item_ticker_idx").on(table.ticker, table.completedAt),
  index("dossier_source_backfill_item_status_idx").on(table.status, table.completedAt),
]);

export const dossierSources = sqliteTable("dossier_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticker: text("ticker").notNull().references(() => companyDossiers.ticker, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  evidenceDate: text("evidence_date"),
  excerpt: text("excerpt"),
  verifiedAt: text("verified_at"),
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
// facts and the exact filing appear automatically; any analyst interpretation
// remains a separate, explicitly moderated layer.
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

// SEC submission monitoring is intentionally separate from published dossier
// prose. A newly filed document becomes public evidence immediately; changing
// the ownership thesis still requires a separate editorial action.
export const dossierFreshnessChecks = sqliteTable("dossier_freshness_checks", {
  ticker: text("ticker").primaryKey().references(() => companyDossiers.ticker, { onDelete: "cascade" }),
  lastAttemptedAt: text("last_attempted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSuccessAt: text("last_success_at"),
  latestFilingDate: text("latest_filing_date"),
  detectedCount: integer("detected_count").notNull().default(0),
  errorMessage: text("error_message"),
}, (table) => [
  index("dossier_freshness_check_attempt_idx").on(table.lastAttemptedAt),
]);

export const dossierFreshnessEvents = sqliteTable("dossier_freshness_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticker: text("ticker").notNull().references(() => companyDossiers.ticker, { onDelete: "cascade" }),
  accessionNumber: text("accession_number").notNull(),
  form: text("form").notNull(),
  filingDate: text("filing_date").notNull(),
  reportDate: text("report_date").notNull().default(""),
  primaryDocument: text("primary_document").notNull(),
  sourceUrl: text("source_url").notNull(),
  eventType: text("event_type", { enum: ["earnings_release", "annual_report", "quarterly_report", "proxy_statement", "material_8k"] }).notNull(),
  secItemsJson: text("sec_items_json").notNull().default("[]"),
  materialityReason: text("materiality_reason").notNull(),
  reviewFocusJson: text("review_focus_json").notNull().default("[]"),
  factsRefreshStatus: text("facts_refresh_status", { enum: ["not_applicable", "pending", "refreshed", "failed"] }).notNull().default("not_applicable"),
  factsRefreshDetail: text("facts_refresh_detail").notNull().default(""),
  status: text("status", { enum: ["editorial_review", "published", "ignored", "failed"] }).notNull().default("published"),
  editorialSummary: text("editorial_summary").notNull().default(""),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  publishedAt: text("published_at"),
  detectedAt: text("detected_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("dossier_freshness_event_accession_idx").on(table.ticker, table.accessionNumber),
  index("dossier_freshness_event_review_idx").on(table.status, table.filingDate),
  index("dossier_freshness_event_ticker_idx").on(table.ticker, table.filingDate),
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

// Point-in-time consensus snapshots preserve what investors knew before a
// report. Never overwrite these rows: revision history is the product.
export const earningsConsensusSnapshots = sqliteTable("earnings_consensus_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticker: text("ticker").notNull(),
  reportDate: text("report_date").notNull(),
  fiscalQuarter: text("fiscal_quarter").notNull().default(""),
  snapshotDate: text("snapshot_date").notNull(),
  epsEstimate: real("eps_estimate"),
  analystCount: integer("analyst_count"),
  sourceLabel: text("source_label").notNull(),
  sourceUrl: text("source_url").notNull(),
  capturedAt: text("captured_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("earnings_consensus_snapshot_unique_idx").on(table.ticker, table.reportDate, table.snapshotDate, table.sourceLabel),
  index("earnings_consensus_revision_idx").on(table.ticker, table.reportDate, table.snapshotDate),
]);

// Authenticated members can submit one active estimate per company/report.
// Server-side identity checks protect writes; public readers only receive the
// aggregate, never contributor identity attached to an individual forecast.
export const earningsCommunityEstimates = sqliteTable("earnings_community_estimates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  ticker: text("ticker").notNull(),
  reportDate: text("report_date").notNull(),
  fiscalQuarter: text("fiscal_quarter").notNull().default(""),
  epsEstimate: real("eps_estimate"),
  revenueEstimateMillions: real("revenue_estimate_millions"),
  thesisCase: text("thesis_case", { enum: ["bull", "base", "bear"] }).notNull().default("base"),
  confidence: integer("confidence").notNull().default(3),
  keyDriver: text("key_driver").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("earnings_community_user_report_idx").on(table.userId, table.ticker, table.reportDate),
  index("earnings_community_aggregate_idx").on(table.ticker, table.reportDate, table.updatedAt),
]);

// Provider-reported results are kept separately from consensus snapshots and
// community estimates so an actual can never silently replace an estimate.
export const earningsResults = sqliteTable("earnings_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticker: text("ticker").notNull(),
  reportDate: text("report_date").notNull(),
  fiscalQuarter: text("fiscal_quarter").notNull().default(""),
  epsActual: real("eps_actual"),
  epsConsensusAtReport: real("eps_consensus_at_report"),
  epsSurprisePercent: real("eps_surprise_percent"),
  sourceLabel: text("source_label").notNull(),
  sourceUrl: text("source_url").notNull(),
  capturedAt: text("captured_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("earnings_result_report_idx").on(table.ticker, table.reportDate),
  index("earnings_result_date_idx").on(table.reportDate, table.ticker),
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

// Professional and community interviews are distinct from issuer-management
// interviews. Contributors submit them, editors verify credentials and
// disclosures, and only approved records become public.
export const professionalInterviews = sqliteTable("professional_interviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  guestName: text("guest_name").notNull(),
  guestTitle: text("guest_title").notNull(),
  firm: text("firm").notNull().default(""),
  credentials: text("credentials").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  topicsJson: text("topics_json").notNull().default("[]"),
  interviewUrl: text("interview_url").notNull(),
  transcriptUrl: text("transcript_url").notNull().default(""),
  disclosure: text("disclosure").notNull(),
  status: text("status", { enum: ["submitted", "reviewing", "approved", "rejected"] }).notNull().default("submitted"),
  moderatorNote: text("moderator_note").notNull().default(""),
  moderatedBy: text("moderated_by"),
  moderatedAt: text("moderated_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("professional_interview_public_idx").on(table.status, table.createdAt),
  index("professional_interview_user_idx").on(table.userId, table.createdAt),
]);

// Outbound brokerage events measure channel interest without storing account
// credentials, holdings, IP addresses, user-agent fingerprints, or member IDs.
// Partner conversions and compensation remain authoritative in the broker's
// approved affiliate reporting portal.
export const brokerageClicks = sqliteTable("brokerage_clicks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clickId: text("click_id").notNull(),
  brokerKey: text("broker_key").notNull(),
  action: text("action", { enum: ["login", "open"] }).notNull(),
  destinationType: text("destination_type", { enum: ["official", "paid_referral"] }).notNull().default("official"),
  sourcePath: text("source_path").notNull().default("/portfolio"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("brokerage_click_id_idx").on(table.clickId),
  index("brokerage_click_broker_created_idx").on(table.brokerKey, table.createdAt),
  index("brokerage_click_action_created_idx").on(table.action, table.createdAt),
]);

// A normalized, filing-level ledger powers the cross-company insider screen.
// Only SEC transaction codes P and S are stored here; awards, gifts, exercises,
// and tax withholding stay visible in individual filings but do not distort the
// ranked buy/sell research lists.
export const secInsiderTransactions = sqliteTable("sec_insider_transactions", {
  id: text("id").primaryKey(),
  ticker: text("ticker").notNull(),
  companyName: text("company_name").notNull(),
  cik: text("cik").notNull(),
  accessionNumber: text("accession_number").notNull(),
  form: text("form").notNull(),
  filingDate: text("filing_date").notNull(),
  transactionDate: text("transaction_date").notNull(),
  insiderName: text("insider_name").notNull(),
  insiderRelation: text("insider_relation").notNull(),
  transactionCode: text("transaction_code").notNull(),
  direction: text("direction", { enum: ["purchase", "sale"] }).notNull(),
  transactionType: text("transaction_type").notNull(),
  securityTitle: text("security_title").notNull(),
  shares: real("shares").notNull(),
  price: real("price"),
  reportedValue: real("reported_value"),
  sharesHeld: real("shares_held"),
  directOrIndirect: text("direct_or_indirect").notNull().default(""),
  sourceUrl: text("source_url").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("sec_insider_accession_transaction_idx").on(table.accessionNumber, table.id),
  index("sec_insider_direction_date_idx").on(table.direction, table.transactionDate),
  index("sec_insider_ticker_date_idx").on(table.ticker, table.transactionDate),
]);

export const secOwnershipIndexImports = sqliteTable("sec_ownership_index_imports", {
  indexDate: text("index_date").primaryKey(),
  status: text("status").notNull().default("pending"),
  nextOffset: integer("next_offset").notNull().default(0),
  totalFilings: integer("total_filings").notNull().default(0),
  importedTransactions: integer("imported_transactions").notNull().default(0),
  failedFilings: integer("failed_filings").notNull().default(0),
  indexUrl: text("index_url").notNull().default(""),
  lastAttemptedAt: text("last_attempted_at"),
  lastSuccessAt: text("last_success_at"),
  lastError: text("last_error").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("sec_ownership_import_status_date_idx").on(table.status, table.indexDate),
]);
