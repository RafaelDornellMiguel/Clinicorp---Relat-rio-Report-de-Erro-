import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with department field for better organization.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  department: varchar("department", { length: 128 }), // Departamento do agente
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Reports de erro - tabela principal
 * Armazena todos os reports com informações completas
 */
export const errorReports = mysqlTable("error_reports", {
  id: int("id").autoincrement().primaryKey(),
  clientId: varchar("clientId", { length: 255 }).notNull(), // ID do cliente (ex: clinicaluminacb)
  key: varchar("key", { length: 255 }).notNull().unique(), // Chave/timestamp único
  modules: text("modules"), // Módulos importados (JSON array ou texto)
  origin: mysqlEnum("origin", ["Onboarding", "Production", "Testing", "Other"]).default("Onboarding").notNull(),
  reason: mysqlEnum("reason", [
    "ClientBase",
    "Modelador",
    "Analista",
    "Engenharia",
    "EmAnalise",
    "Outro",
  ]).default("EmAnalise").notNull(),
  assignedAgent: varchar("assignedAgent", { length: 255 }), // Nome do agente responsável
  assignedAgentId: int("assignedAgentId"), // ID do usuário agente
  records: text("records"), // Descrição dos registros afetados
  status: mysqlEnum("status", ["NoPrazo", "SLAVencida", "Critico", "Resolvido"]).default("NoPrazo").notNull(),
  ticketUrl: varchar("ticketUrl", { length: 500 }), // URL do ticket
  recommendedAction: varchar("recommendedAction", { length: 255 }), // Ação recomendada
  resolutionDescription: text("resolutionDescription"), // Descrição da resolução
  resolutionDate: timestamp("resolutionDate"), // Data de resolução
  priority: mysqlEnum("priority", ["Low", "Medium", "High", "Critical"]).default("Medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"), // ID do usuário que criou
});

export type ErrorReport = typeof errorReports.$inferSelect;
export type InsertErrorReport = typeof errorReports.$inferInsert;

/**
 * Histórico de mudanças de status
 * Rastreia todas as alterações de status com quem fez e quando
 */
export const statusHistory = mysqlTable("status_history", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  previousStatus: mysqlEnum("previousStatus", [
    "NoPrazo",
    "SLAVencida",
    "Critico",
    "Resolvido",
  ]),
  newStatus: mysqlEnum("newStatus", [
    "NoPrazo",
    "SLAVencida",
    "Critico",
    "Resolvido",
  ]).notNull(),
  changedBy: int("changedBy").notNull(), // ID do usuário que fez a mudança
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
export const reportComments = mysqlTable("report_comments", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }),
  comment: text("comment").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReportComment = typeof reportComments.$inferSelect;
export type InsertReportComment = typeof reportComments.$inferInsert;

/**
 * Notificações do sistema
 * Rastreia notificações enviadas aos usuários
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reportId: int("reportId"),
  type: mysqlEnum("type", [
    "critical_report",
    "sla_warning",
    "status_changed",
    "assigned_to_you",
    "system",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false).notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
