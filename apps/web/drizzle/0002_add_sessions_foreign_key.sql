CREATE TABLE `sessions_new` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`ip_address` text,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_new_token_unique` ON `sessions_new` (`token`);--> statement-breakpoint
INSERT INTO `sessions_new`
SELECT `id`, `user_id`, `expires_at`, `token`, `created_at`, `updated_at`, `ip_address`, `user_agent`
FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `sessions_new` RENAME TO `sessions`;--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);