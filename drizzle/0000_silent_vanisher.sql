CREATE TABLE `error_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` varchar(255) NOT NULL,
	`key` varchar(255) NOT NULL,
	`modules` text,
	`origin` enum('Onboarding','Production','Testing','Other') NOT NULL DEFAULT 'Onboarding',
	`reason` enum('ClientBase','Modelador','Analista','Engenharia','EmAnalise','Outro') NOT NULL DEFAULT 'EmAnalise',
	`assignedAgent` varchar(255),
	`assignedAgentId` int,
	`records` text,
	`status` enum('NoPrazo','SLAVencida','Critico','Resolvido') NOT NULL DEFAULT 'NoPrazo',
	`ticketUrl` varchar(500),
	`recommendedAction` varchar(255),
	`resolutionDescription` text,
	`resolutionDate` timestamp,
	`priority` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `error_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `error_reports_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reportId` int,
	`type` enum('critical_report','sla_warning','status_changed','assigned_to_you','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`actionUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255),
	`comment` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`previousStatus` enum('NoPrazo','SLAVencida','Critico','Resolvido'),
	`newStatus` enum('NoPrazo','SLAVencida','Critico','Resolvido') NOT NULL,
	`changedBy` int NOT NULL,
	`changedByName` varchar(255),
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`department` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
