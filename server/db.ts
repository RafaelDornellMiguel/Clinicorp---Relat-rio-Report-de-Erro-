import { eq, and, like, gte, lte, inArray, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, errorReports, statusHistory, reportComments, notifications, ErrorReport, StatusHistory, ReportComment, Notification } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "department"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Error Reports Queries ============

export async function createErrorReport(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(errorReports).values(data);
  return result;
}

export async function getErrorReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(errorReports).where(eq(errorReports.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getErrorReportByKey(key: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(errorReports).where(eq(errorReports.key, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export interface GetErrorReportsFilter {
  search?: string;
  status?: string;
  reason?: string;
  origin?: string;
  assignedAgent?: string;
  priority?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export async function getErrorReports(filters: GetErrorReportsFilter = {}) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];

  if (filters.search) {
    conditions.push(
      like(errorReports.clientId, `%${filters.search}%`)
    );
  }

  if (filters.status) {
    conditions.push(eq(errorReports.status, filters.status as any));
  }

  if (filters.reason) {
    conditions.push(eq(errorReports.reason, filters.reason as any));
  }

  if (filters.origin) {
    conditions.push(eq(errorReports.origin, filters.origin as any));
  }

  if (filters.assignedAgent) {
    conditions.push(eq(errorReports.assignedAgent, filters.assignedAgent));
  }

  if (filters.priority) {
    conditions.push(eq(errorReports.priority, filters.priority as any));
  }

  if (filters.startDate) {
    conditions.push(gte(errorReports.createdAt, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(errorReports.createdAt, filters.endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const query = db.select().from(errorReports);
  const filteredQuery = whereClause ? query.where(whereClause) : query;

  const result = await filteredQuery
    .orderBy(desc(errorReports.createdAt))
    .limit(filters.limit || 100)
    .offset(filters.offset || 0);

  return result;
}

export async function updateErrorReport(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.update(errorReports).set(data).where(eq(errorReports.id, id));
  return result;
}

export async function deleteErrorReport(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.delete(errorReports).where(eq(errorReports.id, id));
  return result;
}

// ============ Status History Queries ============

export async function createStatusHistory(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(statusHistory).values(data);
  return result;
}

export async function getStatusHistoryByReportId(reportId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(statusHistory)
    .where(eq(statusHistory.reportId, reportId))
    .orderBy(desc(statusHistory.createdAt));

  return result;
}

// ============ Report Comments Queries ============

export async function createReportComment(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reportComments).values(data);
  return result;
}

export async function getReportCommentsByReportId(reportId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(reportComments)
    .where(eq(reportComments.reportId, reportId))
    .orderBy(desc(reportComments.createdAt));

  return result;
}

// ============ Notifications Queries ============

export async function createNotification(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values(data);
  return result;
}

export async function getNotificationsByUserId(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];

  let query: any = db.select().from(notifications).where(eq(notifications.userId, userId));
  
  if (unreadOnly) {
    query = query.where(eq(notifications.isRead, false));
  }

  const result = await query.orderBy(desc(notifications.createdAt));
  return result;
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  return result;
}

// ============ Analytics Queries ============

export async function getErrorReportsStats() {
  const db = await getDb();
  if (!db) return null;

  // Total reports
  const total = await db.select().from(errorReports);

  // By status
  const byStatus = total.reduce((acc: any, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1;
    return acc;
  }, {});

  // By agent
  const byAgent = total.reduce((acc: any, report) => {
    if (report.assignedAgent) {
      acc[report.assignedAgent] = (acc[report.assignedAgent] || 0) + 1;
    }
    return acc;
  }, {});

  // By reason
  const byReason = total.reduce((acc: any, report) => {
    acc[report.reason] = (acc[report.reason] || 0) + 1;
    return acc;
  }, {});

  // By priority
  const byPriority = total.reduce((acc: any, report) => {
    acc[report.priority] = (acc[report.priority] || 0) + 1;
    return acc;
  }, {});

  return {
    total: total.length,
    byStatus,
    byAgent,
    byReason,
    byPriority,
  };
}

export async function getAverageResolutionTime() {
  const db = await getDb();
  if (!db) return 0;

  const resolved = await db
    .select()
    .from(errorReports)
    .where(eq(errorReports.status, "Resolvido"));

  if (resolved.length === 0) return 0;

  const totalTime = resolved.reduce((sum, report) => {
    if (report.resolutionDate && report.createdAt) {
      const diff = new Date(report.resolutionDate).getTime() - new Date(report.createdAt).getTime();
      return sum + diff;
    }
    return sum;
  }, 0);

  return Math.round(totalTime / resolved.length / (1000 * 60 * 60)); // Convert to hours
}
