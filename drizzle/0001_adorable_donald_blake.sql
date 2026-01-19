CREATE TABLE `approval_events` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`deal_id` varchar(36) NOT NULL,
	`type` enum('SENT','VIEWED','APPROVED','REJECTED') NOT NULL,
	`meta_json` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_tokens` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`deal_id` varchar(36) NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `approval_tokens_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `deal_snapshots` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`client_name` varchar(255) NOT NULL,
	`client_email` varchar(320),
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`total` int NOT NULL,
	`items_json` text NOT NULL,
	`status` enum('DRAFT','SENT','APPROVED','REJECTED','EXPIRED') NOT NULL DEFAULT 'DRAFT',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deal_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_configs` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`deal_id` varchar(36),
	`url` varchar(2048) NOT NULL,
	`events` varchar(255) NOT NULL,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_configs_id` PRIMARY KEY(`id`)
);
