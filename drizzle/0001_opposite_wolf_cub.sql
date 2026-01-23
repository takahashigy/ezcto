CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`assetType` enum('logo','banner','pfp','poster','narrative','whitepaper','tweet','website') NOT NULL,
	`fileUrl` varchar(1000),
	`fileKey` varchar(500),
	`textContent` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`orderType` enum('launch_standard','launch_pro','merch_design','merch_production') NOT NULL,
	`status` enum('pending','processing','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`totalAmount` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'USD',
	`orderDetails` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`userId` int NOT NULL,
	`paymentMethod` varchar(50) NOT NULL,
	`paymentProvider` varchar(50) NOT NULL DEFAULT 'stripe',
	`transactionId` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'USD',
	`status` enum('pending','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`ticker` varchar(50),
	`website` varchar(500),
	`status` enum('draft','generating','completed','failed') NOT NULL DEFAULT 'draft',
	`styleTemplate` varchar(100),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plan` enum('free','standard','pro') NOT NULL DEFAULT 'free',
	`stripeSubscriptionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`status` enum('active','cancelled','expired','past_due') NOT NULL DEFAULT 'active',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_unique` UNIQUE(`userId`)
);
