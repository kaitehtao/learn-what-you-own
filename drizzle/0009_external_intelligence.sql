CREATE TABLE IF NOT EXISTS `external_data_sources` (
  `source_key` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `publisher` text NOT NULL,
  `category` text NOT NULL,
  `base_url` text NOT NULL,
  `api_url` text,
  `access_class` text NOT NULL CHECK (`access_class` IN ('us_government_open_data', 'cc0_open_data')),
  `attribution` text NOT NULL DEFAULT '',
  `refresh_cadence` text NOT NULL DEFAULT 'source dependent',
  `is_active` integer NOT NULL DEFAULT 1,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `external_observations` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `ticker` text NOT NULL REFERENCES `companies`(`ticker`) ON DELETE CASCADE,
  `source_key` text NOT NULL REFERENCES `external_data_sources`(`source_key`),
  `external_record_id` text NOT NULL,
  `observation_type` text NOT NULL,
  `title` text NOT NULL,
  `summary` text NOT NULL,
  `observed_at` text,
  `retrieved_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `source_url` text NOT NULL,
  `company_match_method` text NOT NULL CHECK (`company_match_method` IN ('direct_identifier', 'verified_alias', 'manual_review')),
  `match_confidence` text NOT NULL CHECK (`match_confidence` IN ('high', 'medium', 'low')),
  `limitations` text NOT NULL DEFAULT '',
  `raw_json` text NOT NULL DEFAULT '{}',
  `status` text NOT NULL DEFAULT 'draft' CHECK (`status` IN ('draft', 'verified', 'published', 'rejected')),
  `verified_by` text,
  `verified_at` text,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `external_observation_record_idx` ON `external_observations` (`ticker`,`source_key`,`external_record_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `external_observation_public_idx` ON `external_observations` (`ticker`,`status`,`observed_at`);
--> statement-breakpoint
INSERT OR IGNORE INTO `external_data_sources` (`source_key`,`name`,`publisher`,`category`,`base_url`,`api_url`,`access_class`,`attribution`,`refresh_cadence`) VALUES
  ('usaspending','USAspending.gov','U.S. Department of the Treasury','Government business','https://www.usaspending.gov/','https://api.usaspending.gov/','us_government_open_data','Source: USAspending.gov','daily'),
  ('uspto','USPTO Open Data','U.S. Patent and Trademark Office','Patents & innovation','https://data.uspto.gov/',NULL,'us_government_open_data','Source: U.S. Patent and Trademark Office','source dependent'),
  ('epa-echo','EPA ECHO','U.S. Environmental Protection Agency','Facilities & compliance','https://echo.epa.gov/',NULL,'us_government_open_data','Source: U.S. EPA ECHO','source dependent'),
  ('nhtsa','NHTSA Safety Data','National Highway Traffic Safety Administration','Product safety','https://www.nhtsa.gov/nhtsa-datasets-and-apis','https://api.nhtsa.gov/','us_government_open_data','Source: NHTSA','daily'),
  ('eia','EIA Open Data','U.S. Energy Information Administration','Energy-market conditions','https://www.eia.gov/opendata/','https://api.eia.gov/','us_government_open_data','Source: U.S. Energy Information Administration','source dependent'),
  ('clinicaltrials','ClinicalTrials.gov','U.S. National Library of Medicine','Clinical pipeline','https://clinicaltrials.gov/data-api/about-api','https://clinicaltrials.gov/api/v2/','us_government_open_data','Source: ClinicalTrials.gov; retrieved and processed by Learn What You Own','daily'),
  ('openfda','openFDA','U.S. Food and Drug Administration','Regulatory & safety','https://open.fda.gov/','https://api.fda.gov/','us_government_open_data','Source: U.S. Food and Drug Administration','source dependent'),
  ('nih-reporter','NIH RePORTER','National Institutes of Health','Funded research','https://api.reporter.nih.gov/','https://api.reporter.nih.gov/','us_government_open_data','Source: NIH RePORTER','source dependent'),
  ('bls','BLS Public Data','U.S. Bureau of Labor Statistics','Labor & cost conditions','https://www.bls.gov/developers/','https://api.bls.gov/publicAPI/v2/','us_government_open_data','This product uses BLS data; BLS cannot vouch for derived data or analyses.','source dependent'),
  ('census','Census Data API','U.S. Census Bureau','Market & demographics','https://www.census.gov/data/developers.html','https://api.census.gov/data.html','us_government_open_data','This product uses the Census Bureau Data API but is not endorsed or certified by the Census Bureau.','source dependent'),
  ('bea','BEA Data API','U.S. Bureau of Economic Analysis','Industry economics','https://www.bea.gov/resources/for-developers','https://apps.bea.gov/api/data','us_government_open_data','Source: U.S. Bureau of Economic Analysis','source dependent'),
  ('cftc-cot','CFTC Commitments of Traders','Commodity Futures Trading Commission','Commodity positioning','https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm','https://publicreporting.cftc.gov/','us_government_open_data','Source: U.S. Commodity Futures Trading Commission','weekly'),
  ('openalex','OpenAlex','OurResearch','Scientific knowledge','https://developers.openalex.org/','https://api.openalex.org/','cc0_open_data','Source: OpenAlex','source dependent'),
  ('wikidata','Wikidata','Wikimedia community','Entity graph','https://www.wikidata.org/wiki/Wikidata:Data_access','https://www.wikidata.org/w/api.php','cc0_open_data','Source: Wikidata','source dependent');
