CREATE TABLE `company_relationships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_ticker` text,
	`supplier_name` text NOT NULL,
	`customer_ticker` text,
	`customer_name` text NOT NULL,
	`product_service` text NOT NULL,
	`evidence_summary` text NOT NULL,
	`materiality` text DEFAULT 'unknown' NOT NULL,
	`evidence_class` text DEFAULT 'direct_disclosure' NOT NULL,
	`source_type` text NOT NULL,
	`source_title` text NOT NULL,
	`source_url` text NOT NULL,
	`evidence_date` text NOT NULL,
	`status` text DEFAULT 'current' NOT NULL,
	`contributor_username` text,
	`supabase_contribution_id` text,
	`verified_by` text,
	`verified_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`supplier_ticker`) REFERENCES `companies`(`ticker`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`customer_ticker`) REFERENCES `companies`(`ticker`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `company_relationship_evidence_idx` ON `company_relationships` (`supplier_name`,`customer_name`,`product_service`,`source_url`);--> statement-breakpoint
CREATE UNIQUE INDEX `company_relationship_contribution_idx` ON `company_relationships` (`supabase_contribution_id`);--> statement-breakpoint
CREATE TABLE `dossier_claims` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticker` text NOT NULL,
	`section` text NOT NULL,
	`claim_type` text NOT NULL,
	`claim` text NOT NULL,
	`why_it_matters` text DEFAULT '' NOT NULL,
	`source_title` text NOT NULL,
	`source_url` text NOT NULL,
	`source_excerpt` text DEFAULT '' NOT NULL,
	`evidence_date` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`verified_by` text,
	`verified_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`ticker`) REFERENCES `companies`(`ticker`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dossier_claim_source_idx` ON `dossier_claims` (`ticker`,`claim`,`source_url`);--> statement-breakpoint
CREATE TABLE `filing_facts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticker` text NOT NULL,
	`metric_key` text NOT NULL,
	`taxonomy` text DEFAULT 'us-gaap' NOT NULL,
	`concept` text NOT NULL,
	`label` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`period_start` text,
	`period_end` text NOT NULL,
	`fiscal_year` integer,
	`fiscal_period` text,
	`form` text NOT NULL,
	`filed_at` text NOT NULL,
	`accession_number` text NOT NULL,
	`source_url` text NOT NULL,
	`dimensions_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`ticker`) REFERENCES `companies`(`ticker`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `filing_fact_period_idx` ON `filing_facts` (`ticker`,`metric_key`,`period_end`,`fiscal_period`);