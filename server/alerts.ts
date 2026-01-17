import { getDb } from "./db";
import { errorReports, notifications, users } from "../drizzle/schema";
import { eq, and, lt, gte } from "drizzle-orm";

/**
 * Verifica reports críticos e cria notificações para todos os admins
 */
export async function checkCriticalReports() {
  const db = await getDb();
  if (!db) return;

  try {
    // Find critical reports without notifications
    const criticalReports = await db
      .select()
      .from(errorReports)
      .where(eq(errorReports.priority, "Critical" as any));

    // Get all admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));

    for (const report of criticalReports) {
      // Create notification for each admin
      for (const admin of adminUsers) {
        // Check if notification already exists
        const existingNotification = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.reportId, report.id),
              eq(notifications.userId, admin.id),
              eq(notifications.type, "critical_report" as any)
            )
          )
          .limit(1);

        if (existingNotification.length === 0) {
          // Create notification
          await db.insert(notifications).values({
            reportId: report.id,
            userId: admin.id,
            type: "critical_report" as any,
            title: `Report Crítico: ${report.clientId}`,
            message: `O report ${report.key} foi marcado como crítico e requer atenção imediata.`,
            isRead: false,
            actionUrl: `/reports/${report.id}`,
            createdAt: new Date(),
          });
        }
      }
    }

    console.log(`[Alerts] Verificado ${criticalReports.length} reports críticos`);
  } catch (error) {
    console.error("[Alerts] Erro ao verificar reports críticos:", error);
  }
}

/**
 * Verifica SLAs próximos do vencimento (reports no prazo criados há mais de 3 dias)
 */
export async function checkSLAAlerts() {
  const db = await getDb();
  if (!db) return;

  try {
    // Get current time and 3 days ago
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    // Find reports with SLA expiring soon (created 3-4 days ago)
    const slaAlertReports = await db
      .select()
      .from(errorReports)
      .where(
        and(
          eq(errorReports.status, "NoPrazo" as any),
          gte(errorReports.createdAt, fourDaysAgo),
          lt(errorReports.createdAt, threeDaysAgo)
        )
      );

    // Get all admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));

    for (const report of slaAlertReports) {
      for (const admin of adminUsers) {
        // Check if notification already exists (within last 24 hours)
        const existingNotification = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.reportId, report.id),
              eq(notifications.userId, admin.id),
              eq(notifications.type, "sla_warning" as any)
            )
          )
          .limit(1);

        if (existingNotification.length === 0) {
          // Create notification
          await db.insert(notifications).values({
            reportId: report.id,
            userId: admin.id,
            type: "sla_warning" as any,
            title: `SLA Próximo do Vencimento: ${report.clientId}`,
            message: `O report ${report.key} tem SLA vencendo em menos de 24 horas.`,
            isRead: false,
            actionUrl: `/reports/${report.id}`,
            createdAt: new Date(),
          });
        }
      }
    }

    console.log(`[Alerts] Verificado ${slaAlertReports.length} reports com SLA próximo do vencimento`);
  } catch (error) {
    console.error("[Alerts] Erro ao verificar SLA:", error);
  }
}

/**
 * Verifica SLAs vencidos
 */
export async function checkExpiredSLAs() {
  const db = await getDb();
  if (!db) return;

  try {
    const now = new Date();
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    // Find reports with expired SLA (created more than 4 days ago and still NoPrazo)
    const expiredSLAReports = await db
      .select()
      .from(errorReports)
      .where(
        and(
          eq(errorReports.status, "NoPrazo" as any),
          lt(errorReports.createdAt, fourDaysAgo)
        )
      );

    // Get all admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));

    // Update their status to SLAVencida
    for (const report of expiredSLAReports) {
      await db
        .update(errorReports)
        .set({
          status: "SLAVencida" as any,
          updatedAt: new Date(),
        })
        .where(eq(errorReports.id, report.id));

      // Create notification for each admin
      for (const admin of adminUsers) {
        await db.insert(notifications).values({
          reportId: report.id,
          userId: admin.id,
          type: "sla_warning" as any,
          title: `SLA Vencido: ${report.clientId}`,
          message: `O report ${report.key} ultrapassou o prazo SLA.`,
          isRead: false,
          actionUrl: `/reports/${report.id}`,
          createdAt: new Date(),
        });
      }
    }

    console.log(`[Alerts] ${expiredSLAReports.length} reports tiveram SLA vencido`);
  } catch (error) {
    console.error("[Alerts] Erro ao verificar SLA vencido:", error);
  }
}

/**
 * Executa todas as verificações de alerta
 */
export async function runAllAlerts() {
  console.log("[Alerts] Iniciando verificação de alertas...");
  await checkCriticalReports();
  await checkSLAAlerts();
  await checkExpiredSLAs();
  console.log("[Alerts] Verificação de alertas concluída");
}

/**
 * Inicia job de alertas que roda a cada 5 minutos
 */
export function startAlertScheduler() {
  // Run immediately on startup
  runAllAlerts();

  // Run every 5 minutes
  setInterval(() => {
    runAllAlerts();
  }, 5 * 60 * 1000);

  console.log("[Alerts] Alert scheduler iniciado (intervalo: 5 minutos)");
}
