CREATE TABLE `customOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productType` enum('merchandise','packaging','manufacturing','logistics') NOT NULL,
	`quantity` int NOT NULL,
	`budget` enum('small','medium','large','enterprise') NOT NULL,
	`description` text NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(50),
	`fileUrls` json,
	`status` enum('pending','reviewing','quoted','in_production','completed','cancelled') NOT NULL DEFAULT 'pending',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customOrders_id` PRIMARY KEY(`id`)
);
