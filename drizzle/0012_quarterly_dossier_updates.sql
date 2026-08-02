CREATE TABLE IF NOT EXISTS `quarterly_dossier_updates` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `ticker` text NOT NULL REFERENCES `company_dossiers`(`ticker`) ON DELETE CASCADE,
  `accession_number` text NOT NULL,
  `form` text NOT NULL,
  `period_end` text NOT NULL,
  `filed_at` text NOT NULL,
  `source_url` text NOT NULL,
  `status` text NOT NULL DEFAULT 'facts_refreshed' CHECK (`status` IN ('facts_refreshed', 'editorial_review', 'published')),
  `editorial_summary` text NOT NULL DEFAULT '',
  `reviewed_by` text,
  `reviewed_at` text,
  `published_at` text,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `quarterly_dossier_update_accession_idx` ON `quarterly_dossier_updates` (`ticker`,`accession_number`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `quarterly_dossier_update_public_idx` ON `quarterly_dossier_updates` (`ticker`,`filed_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `quarterly_dossier_update_review_idx` ON `quarterly_dossier_updates` (`status`,`filed_at`);
