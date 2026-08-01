ALTER TABLE `companies` ADD COLUMN `cik` text;
--> statement-breakpoint
ALTER TABLE `companies` ADD COLUMN `listing_scope` text DEFAULT 'other' NOT NULL;
--> statement-breakpoint
ALTER TABLE `companies` ADD COLUMN `security_type` text DEFAULT 'Listed issuer security' NOT NULL;
--> statement-breakpoint
ALTER TABLE `companies` ADD COLUMN `security_description` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `companies` ADD COLUMN `universe_source_url` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `companies` ADD COLUMN `universe_source_as_of` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `companies` ADD COLUMN `is_active` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
CREATE INDEX `companies_listing_scope_ticker_idx` ON `companies` (`listing_scope`,`ticker`);
--> statement-breakpoint
CREATE INDEX `companies_exchange_ticker_idx` ON `companies` (`exchange`,`ticker`);
--> statement-breakpoint
CREATE INDEX `companies_name_idx` ON `companies` (`name`);
