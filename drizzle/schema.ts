import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * Enums (Postgres)
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);

export const originEnum = pgEnum("origin", [
  "Onboarding",
  "Production",
  "Testing",
  "Other",
]);

export const reasonEnum = pgEnum("reason", [
  "ClientBase",
  "Modelador",
  "Analista",
  "Engenharia",
  "EmAnalise",
  "Outro",
]);

export const statusEnum = pgEnum("status", [
  "NoPrazo",
  "SLAVencida",
  "Critico",
  "Resolvido",
]);

export const priorityEnum = pgEnum("priority", [
  "Low",
  "Medium",
  "High",
  "Critical",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "critical_report",
  "sla_warning",
  "status_changed",
  "assigned_to_you",
  "system",
]);

/**
 * Core user table backing auth flow.
 * Extended with department field for better organization.
 */
export const users = pgTable("users", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  department: varchar("department", { length: 128 }), // Departamento do agente
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Reports de erro - tabela principal
 * Armazena todos os reports com informações completas
 */
export const errorReports = pgTable("error_reports", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  clientId: varchar("clientId", { length: 255 }).notNull(), // ID do cliente (ex: clinicaluminacb)
  key: varchar("key", { length: 255 }).notNull().unique(), // Chave/timestamp único
  modules: text("modules"), // Módulos importados (JSON array ou texto)
  origin: originEnum("origin").default("Onboarding").notNull(),
  reason: reasonEnum("reason").default("EmAnalise").notNull(),
  assignedAgent: varchar("assignedAgent", { length: 255 }), // Nome do agente responsável
  assignedAgentId: integer("assignedAgentId"), // ID do usuário agente
  records: text("records"), // Descrição dos registros afetados
  status: statusEnum("status").default("NoPrazo").notNull(),
  ticketUrl: varchar("ticketUrl", { length: 500 }), // URL do ticket
  recommendedAction: varchar("recommendedAction", { length: 255 }), // Ação recomendada
  resolutionDescription: text("resolutionDescription"), // Descrição da resolução
  resolutionDate: timestamp("resolutionDate"), // Data de resolução
  priority: priorityEnum("priority").default("Medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  createdBy: integer("createdBy"), // ID do usuário que criou
});

export type ErrorReport = typeof errorReports.$inferSelect;
export type InsertErrorReport = typeof errorReports.$inferInsert;

/**
 * Histórico de mudanças de status
 * Rastreia todas as alterações de status com quem fez e quando
 */
export const statusHistory = pgTable("status_history", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  reportId: integer("reportId").notNull(),
  previousStatus: statusEnum("previousStatus"),
  newStatus: statusEnum("newStatus").notNull(),
  changedBy: integer("changedBy").notNull(), // ID do usuário que fez a mudança
  changedByName: varchar("changedByName", { length: 255 }), // Nome do usuário para referência
  reason: text("reason"), // Motivo da mudança
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StatusHistory = typeof statusHistory.$inferSelect;
export type InsertStatusHistory = typeof statusHistory.$inferInsert;

/**
 * Comentários e notas em reports
 * Permite que a equipe deixe notas e acompanhamento
 */
export const reportComments = pgTable("report_comments", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  reportId: integer("reportId").notNull(),
  userId: integer("userId").notNull(),
  userName: varchar("userName", { length: 255 }),
  comment: text("comment").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ReportComment = typeof reportComments.$inferSelect;
export type InsertReportComment = typeof reportComments.$inferInsert;

/**
 * Notificações do sistema
 * Rastreia notificações enviadas aos usuários
 */
export const notifications = pgTable("notifications", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  reportId: integer("reportId"),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false).notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
