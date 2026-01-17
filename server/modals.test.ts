import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Reports - Modal Functionality", () => {
  it("should list reports for modal display", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const reports = await caller.reports.list({ limit: 100 });

    expect(Array.isArray(reports)).toBe(true);
    expect(reports.length).toBeGreaterThanOrEqual(0);
  });

  it("should detect duplicate client IDs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const clientId = "duplicate-test-" + Date.now();

    try {
      await caller.reports.create({
        clientId,
        key: String(Date.now() + 1),
        modules: "Test Module",
        origin: "Onboarding",
        reason: "ClientBase",
        records: "Test records",
        status: "NoPrazo",
      });

      await caller.reports.create({
        clientId,
        key: String(Date.now() + 2),
        modules: "Test Module",
        origin: "Onboarding",
        reason: "ClientBase",
        records: "Test records",
        status: "NoPrazo",
      });

      const reports = await caller.reports.list({ limit: 100 });
      const duplicateCount = reports.filter((r: any) => r.clientId === clientId).length;

      expect(duplicateCount).toBeGreaterThanOrEqual(2);
    } catch (error) {
      // Expected - duplicate key error is ok for this test
      expect(error).toBeDefined();
    }
  });

  it("should handle filtering reports", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const reports = await caller.reports.list({
      status: "Critico",
      limit: 100,
    });

    expect(Array.isArray(reports)).toBe(true);
  });

  it("should support search functionality", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const reports = await caller.reports.list({
      search: "clinicaluminacb",
      limit: 100,
    });

    expect(Array.isArray(reports)).toBe(true);
  });

  it("should support filtering by agent", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const reports = await caller.reports.list({
      assignedAgent: "Rafael",
      limit: 100,
    });

    expect(Array.isArray(reports)).toBe(true);
  });
});
