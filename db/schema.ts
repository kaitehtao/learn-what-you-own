import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
