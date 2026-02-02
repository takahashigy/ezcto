CREATE TABLE `whitelist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletAddress` varchar(100) NOT NULL,
	`freeGenerations` int NOT NULL DEFAULT 1,
	`usedGenerations` int NOT NULL DEFAULT 0,
	`note` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`addedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whitelist_id` PRIMARY KEY(`id`),
	CONSTRAINT `whitelist_walletAddress_unique` UNIQUE(`walletAddress`)
);
