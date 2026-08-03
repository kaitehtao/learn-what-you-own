CREATE TABLE IF NOT EXISTS `sec_insider_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`ticker` text NOT NULL,
	`company_name` text NOT NULL,
	`cik` text NOT NULL,
	`accession_number` text NOT NULL,
	`form` text NOT NULL,
	`filing_date` text NOT NULL,
	`transaction_date` text NOT NULL,
	`insider_name` text NOT NULL,
	`insider_relation` text NOT NULL,
	`transaction_code` text NOT NULL,
	`direction` text NOT NULL CHECK(`direction` IN ('purchase','sale')),
	`transaction_type` text NOT NULL,
	`security_title` text NOT NULL,
	`shares` real NOT NULL,
	`price` real,
	`reported_value` real,
	`shares_held` real,
	`direct_or_indirect` text DEFAULT '' NOT NULL,
	`source_url` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `sec_insider_accession_transaction_idx` ON `sec_insider_transactions` (`accession_number`,`id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sec_insider_direction_date_idx` ON `sec_insider_transactions` (`direction`,`transaction_date`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sec_insider_ticker_date_idx` ON `sec_insider_transactions` (`ticker`,`transaction_date`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sec_ownership_index_imports` (
	`index_date` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`next_offset` integer DEFAULT 0 NOT NULL,
	`total_filings` integer DEFAULT 0 NOT NULL,
	`imported_transactions` integer DEFAULT 0 NOT NULL,
	`failed_filings` integer DEFAULT 0 NOT NULL,
	`index_url` text DEFAULT '' NOT NULL,
	`last_attempted_at` text,
	`last_success_at` text,
	`last_error` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sec_ownership_import_status_date_idx` ON `sec_ownership_index_imports` (`status`,`index_date`);
