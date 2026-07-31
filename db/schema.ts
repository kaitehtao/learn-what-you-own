import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const companies = sqliteTable("companies", {
  ticker: text("ticker").primaryKey(),
  name: text("name").notNull(),
  sector: text("sector").notNull().default("Not classified"),
  exchange: text("exchange").notNull().default(""),
  marketCap: real("market_cap"),
  membershipsJson: text("memberships_json").notNull().default("[]"),
  indexWeightsJson: text("index_weights_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

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
