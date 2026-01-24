CREATE TABLE `generation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','generating','completed','failed') NOT NULL DEFAULT 'pending',
	`startTime` timestamp NOT NULL,
	`endTime` timestamp,
	`durationMs` int,
	`assetsGenerated` json,
	`errorMessage` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generation_history_id` PRIMARY KEY(`id`)
);
