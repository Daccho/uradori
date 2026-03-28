CREATE TABLE `audience_voices` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audience_voices_topic` ON `audience_voices` (`topic_id`);--> statement-breakpoint
CREATE TABLE `dialog_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`speaker` text NOT NULL,
	`text` text NOT NULL,
	`source` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`session_id`) REFERENCES `dialog_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_dialog_logs_session` ON `dialog_logs` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_dialog_logs_topic_created` ON `dialog_logs` (`topic_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `dialog_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`ended_at` text,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_dialog_sessions_topic` ON `dialog_sessions` (`topic_id`);--> statement-breakpoint
CREATE TABLE `materials` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`vectorize_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_materials_topic` ON `materials` (`topic_id`);--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`title_id` text NOT NULL,
	`onair_date` text NOT NULL,
	`headline` text NOT NULL,
	`corner_start_time` text,
	`corner_end_time` text,
	`headline_genre` text,
	`broadcast_script` text
);
--> statement-breakpoint
CREATE INDEX `idx_topics_titleid_date` ON `topics` (`title_id`,`onair_date`);