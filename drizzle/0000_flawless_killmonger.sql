CREATE TYPE "public"."notification_type" AS ENUM('critical_report', 'sla_warning', 'status_changed', 'assigned_to_you', 'system');--> statement-breakpoint
CREATE TYPE "public"."origin" AS ENUM('Onboarding', 'Production', 'Testing', 'Other');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('Low', 'Medium', 'High', 'Critical');--> statement-breakpoint
CREATE TYPE "public"."reason" AS ENUM('ClientBase', 'Modelador', 'Analista', 'Engenharia', 'EmAnalise', 'Outro');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('NoPrazo', 'SLAVencida', 'Critico', 'Resolvido');--> statement-breakpoint
CREATE TABLE "error_reports" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "error_reports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"clientId" varchar(255) NOT NULL,
	"key" varchar(255) NOT NULL,
	"modules" text,
	"origin" "origin" DEFAULT 'Onboarding' NOT NULL,
	"reason" "reason" DEFAULT 'EmAnalise' NOT NULL,
	"assignedAgent" varchar(255),
	"assignedAgentId" integer,
	"records" text,
	"status" "status" DEFAULT 'NoPrazo' NOT NULL,
	"ticketUrl" varchar(500),
	"recommendedAction" varchar(255),
	"resolutionDescription" text,
	"resolutionDate" timestamp,
	"priority" "priority" DEFAULT 'Medium' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer,
	CONSTRAINT "error_reports_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"reportId" integer,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"isRead" boolean DEFAULT false NOT NULL,
	"actionUrl" varchar(500),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_comments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "report_comments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"reportId" integer NOT NULL,
	"userId" integer NOT NULL,
	"userName" varchar(255),
	"comment" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "status_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"reportId" integer NOT NULL,
	"previousStatus" "status",
	"newStatus" "status" NOT NULL,
	"changedBy" integer NOT NULL,
	"changedByName" varchar(255),
	"reason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"department" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
