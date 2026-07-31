-- Older production databases predate the normalized company directory. Keep
-- this idempotent so current Sites databases are unchanged while legacy D1
-- databases gain the parent table required by filing facts and graph edges.
CREATE TABLE IF NOT EXISTS `companies` (
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
