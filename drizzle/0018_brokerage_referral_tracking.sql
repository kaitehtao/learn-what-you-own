CREATE TABLE IF NOT EXISTS `brokerage_clicks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`click_id` text NOT NULL,
	`broker_key` text NOT NULL,
	`action` text NOT NULL CHECK(`action` IN ('login','open')),
	`destination_type` text DEFAULT 'official' NOT NULL CHECK(`destination_type` IN ('official','paid_referral')),
	`source_path` text DEFAULT '/portfolio' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `brokerage_click_id_idx` ON `brokerage_clicks` (`click_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `brokerage_click_broker_created_idx` ON `brokerage_clicks` (`broker_key`,`created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `brokerage_click_action_created_idx` ON `brokerage_clicks` (`action`,`created_at`);
--> statement-breakpoint
PRAGMA optimize;
