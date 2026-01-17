import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createErrorReport,
  getErrorReportById,
  getErrorReports,
  updateErrorReport,
  deleteErrorReport,
  createStatusHistory,
  getStatusHistoryByReportId,
  createReportComment,
  getReportCommentsByReportId,
  createNotification,
  getNotificationsByUserId,
  markNotificationAsRead,
  getErrorReportsStats,
  getAverageResolutionTime,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ Error Reports Procedures ============
  reports: router({
    // List all reports with filters
    list: protectedProcedure
      .input(
        z.object({
          search: z.string().optional(),
          status: z.string().optional(),
          reason: z.string().optional(),
          origin: z.string().optional(),
          assignedAgent: z.string().optional(),
          priority: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        // Regular users only see their assigned reports
        const filters = { ...input };
        if (ctx.user.role !== "admin") {
          filters.assignedAgent = ctx.user.name || undefined;
        }
        
        return await getErrorReports(filters);
      }),

    // Get single report by ID
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const report = await getErrorReportById(input);
        
        if (!report) {
          throw new Error("Report not found");
        }

        // Check access: admin can see all, users can only see their assigned
        if (ctx.user.role !== "admin" && report.assignedAgent !== ctx.user.name) {
          throw new Error("Access denied");
        }

        // Get related data
        const history = await getStatusHistoryByReportId(input);
        const comments = await getReportCommentsByReportId(input);

        return {
          ...report,
          history,
          comments,
        };
      }),

    // Create new report
    create: protectedProcedure
      .input(
        z.object({
          clientId: z.string(),
          key: z.string(),
          modules: z.string().optional(),
          origin: z.string().default("Onboarding"),
          reason: z.string().default("EmAnalise"),
          assignedAgent: z.string().optional(),
          records: z.string().optional(),
          status: z.string().default("NoPrazo"),
          ticketUrl: z.string().optional(),
          recommendedAction: z.string().optional(),
          priority: z.string().default("Medium"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Only admins can create reports
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can create reports");
        }

        const result = await createErrorReport({
          ...input,
          createdBy: ctx.user.id,
        });

        return result;
      }),

    // Update report
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          clientId: z.string().optional(),
          modules: z.string().optional(),
          origin: z.string().optional(),
          reason: z.string().optional(),
          assignedAgent: z.string().optional(),
          records: z.string().optional(),
          status: z.string().optional(),
          ticketUrl: z.string().optional(),
          recommendedAction: z.string().optional(),
          resolutionDescription: z.string().optional(),
          priority: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const report = await getErrorReportById(id);

        if (!report) {
          throw new Error("Report not found");
        }

        // Check access
        if (ctx.user.role !== "admin" && report.assignedAgent !== ctx.user.name) {
          throw new Error("Access denied");
        }

        // Track status change
        if (data.status && data.status !== report.status) {
          await createStatusHistory({
            reportId: id,
            previousStatus: report.status,
            newStatus: data.status,
            changedBy: ctx.user.id,
            changedByName: ctx.user.name,
            reason: data.resolutionDescription,
          });

          // If status is "Resolvido", set resolution date
          if (data.status === "Resolvido") {
            (data as any).resolutionDate = new Date();
          }

          // Create notification for status change
          await createNotification({
            userId: ctx.user.id,
            reportId: id,
            type: "status_changed",
            title: `Report ${report.clientId} status changed to ${data.status}`,
            message: `The status of report ${report.clientId} has been updated.`,
            actionUrl: `/reports/${id}`,
          });
        }

        await updateErrorReport(id, data);
        return await getErrorReportById(id);
      }),

    // Delete report
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const report = await getErrorReportById(input);

        if (!report) {
          throw new Error("Report not found");
        }

        // Only admins can delete
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete reports");
        }

        await deleteErrorReport(input);
        return { success: true };
      }),

    // Get statistics
stats: protectedProcedure.query(async () => {
  const result = await getErrorReportsStats();

  return {
    total: Number(result?.total ?? 0),
    byStatus: result?.byStatus ?? {},
    byAgent: result?.byAgent ?? {},
    byReason: result?.byReason ?? {},
    byPriority: result?.byPriority ?? {},
  };
}),



    // Get average resolution time
    avgResolutionTime: protectedProcedure.query(async () => {
      return await getAverageResolutionTime();
    }),
  }),

  // ============ Comments Procedures ============
  comments: router({
    // Add comment to report
    add: protectedProcedure
      .input(
        z.object({
          reportId: z.number(),
          comment: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const report = await getErrorReportById(input.reportId);

        if (!report) {
          throw new Error("Report not found");
        }

        // Check access
        if (ctx.user.role !== "admin" && report.assignedAgent !== ctx.user.name) {
          throw new Error("Access denied");
        }

        const result = await createReportComment({
          reportId: input.reportId,
          userId: ctx.user.id,
          userName: ctx.user.name,
          comment: input.comment,
        });

        return result;
      }),

    // Get comments for report
    getByReportId: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const report = await getErrorReportById(input);

        if (!report) {
          throw new Error("Report not found");
        }

        // Check access
        if (ctx.user.role !== "admin" && report.assignedAgent !== ctx.user.name) {
          throw new Error("Access denied");
        }

        return await getReportCommentsByReportId(input);
      }),
  }),

  // ============ Export Procedures ============
  export: router({
    // Export report to PDF
    pdf: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const report = await getErrorReportById(input);

        if (!report) {
          throw new Error("Report not found");
        }

        // Check access
        if (ctx.user.role !== "admin" && report.assignedAgent !== ctx.user.name) {
          throw new Error("Access denied");
        }

        const { generateReportPDF } = await import("./reports-export");
        const buffer = await generateReportPDF(input);

        return {
          filename: `report-${report.clientId}-${report.key}.pdf`,
          buffer: buffer.toString("base64"),
        };
      }),

    // Export report to Excel
    excel: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const report = await getErrorReportById(input);

        if (!report) {
          throw new Error("Report not found");
        }

        // Check access
        if (ctx.user.role !== "admin" && report.assignedAgent !== ctx.user.name) {
          throw new Error("Access denied");
        }

        const { generateReportExcel } = await import("./reports-export");
        const buffer = await generateReportExcel(input);

        return {
          filename: `report-${report.clientId}-${report.key}.xlsx`,
          buffer: buffer.toString("base64"),
        };
      }),
  }),

  // ============ Notifications Procedures ============
  notifications: router({
    // Get user notifications
    list: protectedProcedure
      .input(
        z.object({
          unreadOnly: z.boolean().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        return await getNotificationsByUserId(ctx.user.id, input.unreadOnly);
      }),

    // Mark notification as read
    markAsRead: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        await markNotificationAsRead(input);
        return { success: true };
      }),
  }),

  // ============ Import Procedures ============
  import: router({
    // Import reports from CSV/Excel
    uploadReports: protectedProcedure
      .input(
        z.object({
          fileContent: z.string(),
          fileName: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Only admins can import
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can import reports");
        }

        const { validateAndParseImportFile, importReports } = await import(
          "./import"
        );

        // Validate and parse file
        const buffer = Buffer.from(input.fileContent, "base64");
        const validation = await validateAndParseImportFile(
          buffer,
          input.fileName
        );

        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Import reports
        const result = await importReports(validation.reports!, ctx.user.id);
        return result;
      }),
  }),

  // ============ Email Procedures ============
  email: router({
    // Send test email
    sendTest: protectedProcedure
      .input(
        z.object({
          to: z.string().email(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Only admins can send test emails
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can send test emails");
        }

        const { sendEmail } = await import("./email");

        const success = await sendEmail({
          to: input.to,
          subject: "[Test] N0 Error Tracker - Email Configuration Test",
          html: "<p>Test email from N0 Error Tracker</p>",
        });

        return { success };
      }),
  }),

  webhooks: router({
    receive: publicProcedure
      .input(
        z.object({
          source: z.string(),
          data: z.record(z.string(), z.any()),
          timestamp: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        console.log(`[Webhook] Received from ${input.source}`);
        return { success: true, message: "Webhook received" };
      }),
  }),
});

export type AppRouter = typeof appRouter;
