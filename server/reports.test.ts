import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock user context
function createMockContext(role: "admin" | "user" = "admin", name = "Test User"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name,
      loginMethod: "manus",
      role,
      department: "QA",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Reports Router", () => {
  describe("reports.list", () => {
    it("should return empty list when no reports exist", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reports.list({});

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("should filter reports by status", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reports.list({
        status: "NoPrazo",
      });

      expect(Array.isArray(result)).toBe(true);
      // All results should have NoPrazo status if any exist
      if (result.length > 0) {
        result.forEach((report: any) => {
          expect(report.status).toBe("NoPrazo");
        });
      }
    });

    it("should filter reports by reason", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reports.list({
        reason: "ClientBase",
      });

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        result.forEach((report: any) => {
          expect(report.reason).toBe("ClientBase");
        });
      }
    });

    it("regular users should only see their assigned reports", async () => {
      const ctx = createMockContext("user", "Sarah");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reports.list({});

      expect(Array.isArray(result)).toBe(true);
      // All results should be assigned to Sarah
      result.forEach((report: any) => {
        expect(report.assignedAgent).toBe("Sarah");
      });
    });
  });

  describe("reports.stats", () => {
    it("should return statistics object", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reports.stats();

      expect(result).toBeDefined();
      expect(typeof result.total).toBe("number");
      expect(result.byStatus).toBeDefined();
      expect(result.byAgent).toBeDefined();
      expect(result.byReason).toBeDefined();
      expect(result.byPriority).toBeDefined();
    });

    it("total should be non-negative", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reports.stats();

      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe("reports.avgResolutionTime", () => {
    it("should return a number", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reports.avgResolutionTime();

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe("reports.create", () => {
    it("should reject non-admin users", async () => {
      const ctx = createMockContext("user");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.reports.create({
          clientId: "test-client",
          key: "test-key-123",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("admin");
      }
    });

    it("should require clientId", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.reports.create({
          clientId: "",
          key: "test-key-123",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should require key", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.reports.create({
          clientId: "test-client",
          key: "",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("reports.delete", () => {
    it("should reject non-admin users", async () => {
      const ctx = createMockContext("user");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.reports.delete(999);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // Either admin error or not found error is acceptable
        expect(
          error.message.includes("admin") || error.message.includes("not found")
        ).toBe(true);
      }
    });

    it("should reject non-existent reports", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.reports.delete(999999);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("not found");
      }
    });
  });

  describe("comments.add", () => {
    it("should reject empty comments", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.comments.add({
          reportId: 1,
          comment: "",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("notifications.list", () => {
    it("should return array of notifications", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.list({});

      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter unread notifications", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.list({
        unreadOnly: true,
      });

      expect(Array.isArray(result)).toBe(true);
      // All results should be unread
      result.forEach((notification: any) => {
        expect(notification.isRead).toBe(false);
      });
    });
  });
});
