ALTER TABLE `projects` ADD `deploymentUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `projects` ADD `deploymentStatus` enum('not_deployed','deployed','failed') DEFAULT 'not_deployed';