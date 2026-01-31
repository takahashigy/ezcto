ALTER TABLE `projects` ADD `paymentStatus` enum('unpaid','pending','paid') DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `paymentAmount` varchar(100);--> statement-breakpoint
ALTER TABLE `projects` ADD `paymentCurrency` varchar(20);--> statement-breakpoint
ALTER TABLE `projects` ADD `paymentTxHash` varchar(200);--> statement-breakpoint
ALTER TABLE `projects` ADD `paymentWalletAddress` varchar(200);--> statement-breakpoint
ALTER TABLE `projects` ADD `paidAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `freeGenerationsUsed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalPaidProjects` int DEFAULT 0 NOT NULL;