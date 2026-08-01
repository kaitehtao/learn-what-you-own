CREATE TABLE `companies` (
	`ticker` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sector` text DEFAULT 'Not classified' NOT NULL,
	`exchange` text DEFAULT '' NOT NULL,
	`market_cap` real,
	`memberships_json` text DEFAULT '[]' NOT NULL,
	`index_weights_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `company_dossiers` (
	`ticker` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`content_json` text,
	`verified_by` text,
	`verified_at` text,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`ticker`) REFERENCES `companies`(`ticker`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dossier_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticker` text NOT NULL,
	`source_type` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`filing_type` text,
	`filed_at` text,
	`accessed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`ticker`) REFERENCES `company_dossiers`(`ticker`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dossier_source_ticker_url_idx` ON `dossier_sources` (`ticker`,`url`);