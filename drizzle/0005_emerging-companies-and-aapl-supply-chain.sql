CREATE TABLE IF NOT EXISTS `emerging_company_dossiers` (
	`slug` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`company_type` text NOT NULL,
	`proposed_ticker` text,
	`proposed_exchange` text,
	`expected_ipo_date` text,
	`website_url` text NOT NULL,
	`summary` text NOT NULL,
	`why_it_matters` text NOT NULL,
	`primary_source_url` text NOT NULL,
	`roadshow_title` text,
	`roadshow_storage_path` text,
	`roadshow_source_url` text,
	`contributor_username` text,
	`supabase_contribution_id` text NOT NULL,
	`verified_by` text NOT NULL,
	`verified_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `emerging_company_contribution_idx` ON `emerging_company_dossiers` (`supabase_contribution_id`);
--> statement-breakpoint
INSERT OR IGNORE INTO `companies` (`ticker`, `name`, `sector`, `exchange`)
VALUES
  ('AAPL', 'Apple Inc.', 'Technology', 'NASDAQ'),
  ('TSM', 'Taiwan Semiconductor Manufacturing Company Limited', 'Technology', 'NYSE');
--> statement-breakpoint
INSERT OR IGNORE INTO `company_relationships` (
  `supplier_ticker`, `supplier_name`, `customer_ticker`, `customer_name`,
  `product_service`, `evidence_summary`, `materiality`, `evidence_class`,
  `source_type`, `source_title`, `source_url`, `evidence_date`, `status`,
  `contributor_username`, `verified_by`
) VALUES
  ('TSM', 'Taiwan Semiconductor Manufacturing Company Limited', 'AAPL', 'Apple Inc.', 'Materials, manufacturing, or assembly; Apple does not specify this supplier''s exact role in the cited list.', 'Apple names TSMC in its Supplier List. The relationship is direct company disclosure, while the precise component assignment requires separate corroboration.', 'named', 'direct_disclosure', 'company', 'Apple Supplier List — Fiscal Year 2020', 'https://www.apple.com/euro/supplier-responsibility/k/generic/pdf/Apple-Supplier-List.pdf', '2020-09-26', 'current', 'LearnWhatYouOwn research desk', 'primary-source seed'),
  (NULL, 'Hon Hai Precision Industry Co., Ltd. (Foxconn)', 'AAPL', 'Apple Inc.', 'Materials, manufacturing, or assembly; exact role not stated in the cited list.', 'Apple names Hon Hai Precision Industry in its Supplier List. Product and facility-level exposure should be corroborated before being described more specifically.', 'named', 'direct_disclosure', 'company', 'Apple Supplier List — Fiscal Year 2020', 'https://www.apple.com/euro/supplier-responsibility/k/generic/pdf/Apple-Supplier-List.pdf', '2020-09-26', 'current', 'LearnWhatYouOwn research desk', 'primary-source seed'),
  (NULL, 'Pegatron Corporation', 'AAPL', 'Apple Inc.', 'Materials, manufacturing, or assembly; exact role not stated in the cited list.', 'Apple names Pegatron in its Supplier List. The graph records only the disclosed relationship, not an inferred product allocation.', 'named', 'direct_disclosure', 'company', 'Apple Supplier List — Fiscal Year 2020', 'https://www.apple.com/euro/supplier-responsibility/k/generic/pdf/Apple-Supplier-List.pdf', '2020-09-26', 'current', 'LearnWhatYouOwn research desk', 'primary-source seed'),
  (NULL, 'Samsung Electronics Co., Ltd.', 'AAPL', 'Apple Inc.', 'Materials, manufacturing, or assembly; exact role not stated in the cited list.', 'Apple names Samsung Electronics in its Supplier List. Any component-level description belongs in a separately sourced edge.', 'named', 'direct_disclosure', 'company', 'Apple Supplier List — Fiscal Year 2020', 'https://www.apple.com/euro/supplier-responsibility/k/generic/pdf/Apple-Supplier-List.pdf', '2020-09-26', 'current', 'LearnWhatYouOwn research desk', 'primary-source seed'),
  (NULL, 'LG Display Co., Ltd.', 'AAPL', 'Apple Inc.', 'Materials, manufacturing, or assembly; exact role not stated in the cited list.', 'Apple names LG Display in its Supplier List. The source establishes supplier status but does not quantify Apple revenue or dependency.', 'named', 'direct_disclosure', 'company', 'Apple Supplier List — Fiscal Year 2020', 'https://www.apple.com/euro/supplier-responsibility/k/generic/pdf/Apple-Supplier-List.pdf', '2020-09-26', 'current', 'LearnWhatYouOwn research desk', 'primary-source seed');
