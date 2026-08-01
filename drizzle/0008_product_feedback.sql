CREATE TABLE IF NOT EXISTS `product_feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`username` text NOT NULL,
	`category` text NOT NULL CHECK (`category` IN ('New feature', 'Product improvement', 'Research coverage', 'Bug report', 'Accessibility', 'Other')),
	`title` text NOT NULL CHECK (length(`title`) BETWEEN 8 AND 120),
	`details` text NOT NULL CHECK (length(`details`) BETWEEN 30 AND 4000),
	`status` text DEFAULT 'submitted' NOT NULL CHECK (`status` IN ('submitted', 'reviewing', 'planned', 'completed', 'declined')),
	`moderator_note` text DEFAULT '' NOT NULL,
	`moderated_by` text,
	`moderated_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_feedback_user_created_idx` ON `product_feedback` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_feedback_status_created_idx` ON `product_feedback` (`status`,`created_at`);
