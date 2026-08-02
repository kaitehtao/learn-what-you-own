CREATE TABLE IF NOT EXISTS `product_feedback_votes` (
	`feedback_id` integer NOT NULL REFERENCES `product_feedback`(`id`) ON DELETE CASCADE,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `product_feedback_vote_unique_idx` ON `product_feedback_votes` (`feedback_id`,`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_feedback_vote_rank_idx` ON `product_feedback_votes` (`feedback_id`,`created_at`);
