CREATE TABLE IF NOT EXISTS `filing_fact_imports` (
	`ticker` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`source_url` text NOT NULL,
	`imported_count` integer DEFAULT 0 NOT NULL,
	`metric_count` integer DEFAULT 0 NOT NULL,
	`last_attempted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_success_at` text,
	`error_message` text,
	FOREIGN KEY (`ticker`) REFERENCES `companies`(`ticker`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `filing_fact_import_status_attempted_idx` ON `filing_fact_imports` (`status`,`last_attempted_at`);
