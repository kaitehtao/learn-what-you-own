CREATE TABLE IF NOT EXISTS `dossier_freshness_checks` (
  `ticker` text PRIMARY KEY NOT NULL REFERENCES `company_dossiers`(`ticker`) ON DELETE CASCADE,
  `last_attempted_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_success_at` text,
  `latest_filing_date` text,
  `detected_count` integer NOT NULL DEFAULT 0,
  `error_message` text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `dossier_freshness_check_attempt_idx` ON `dossier_freshness_checks` (`last_attempted_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dossier_freshness_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `ticker` text NOT NULL REFERENCES `company_dossiers`(`ticker`) ON DELETE CASCADE,
  `accession_number` text NOT NULL,
  `form` text NOT NULL,
  `filing_date` text NOT NULL,
  `report_date` text NOT NULL DEFAULT '',
  `primary_document` text NOT NULL,
  `source_url` text NOT NULL,
  `event_type` text NOT NULL CHECK (`event_type` IN ('earnings_release','annual_report','quarterly_report','proxy_statement','material_8k')),
  `sec_items_json` text NOT NULL DEFAULT '[]',
  `materiality_reason` text NOT NULL,
  `review_focus_json` text NOT NULL DEFAULT '[]',
  `facts_refresh_status` text NOT NULL DEFAULT 'not_applicable' CHECK (`facts_refresh_status` IN ('not_applicable','pending','refreshed','failed')),
  `facts_refresh_detail` text NOT NULL DEFAULT '',
  `status` text NOT NULL DEFAULT 'editorial_review' CHECK (`status` IN ('editorial_review','published','ignored','failed')),
  `editorial_summary` text NOT NULL DEFAULT '',
  `reviewed_by` text,
  `reviewed_at` text,
  `published_at` text,
  `detected_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `dossier_freshness_event_accession_idx` ON `dossier_freshness_events` (`ticker`,`accession_number`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `dossier_freshness_event_review_idx` ON `dossier_freshness_events` (`status`,`filing_date`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `dossier_freshness_event_ticker_idx` ON `dossier_freshness_events` (`ticker`,`filing_date`);
