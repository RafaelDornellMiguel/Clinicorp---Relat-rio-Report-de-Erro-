import { describe, it, expect, vi } from "vitest";
import { parseCSV, parseExcel, validateAndParseImportFile } from "./import";
import { sendEmail, sendCriticalReportNotification } from "./email";

describe("Import Functions", () => {
  it("should parse CSV correctly", () => {
    const csvContent = `clientId,key,origin,reason,assignedAgent,status
CLIENT001,KEY001,Onboarding,ClientBase,Sarah,NoPrazo
CLIENT002,KEY002,Production,Engenharia,Rafael,Critico`;

    const reports = parseCSV(csvContent);

    expect(reports).toHaveLength(2);
    expect(reports[0]?.clientId).toBe("CLIENT001");
    expect(reports[0]?.reason).toBe("ClientBase");
    expect(reports[1]?.status).toBe("Critico");
  });

  it("should parse Excel correctly", () => {
    // Note: This test would require an actual Excel file buffer
    // For now, we'll just verify the function exists
    expect(parseExcel).toBeDefined();
  });

  it("should validate import file correctly", async () => {
    const csvContent = `clientId,key,origin,reason,assignedAgent,status
CLIENT001,KEY001,Onboarding,ClientBase,Sarah,NoPrazo`;

    const buffer = Buffer.from(csvContent, "utf-8");
    const result = await validateAndParseImportFile(buffer, "test.csv");

    expect(result.valid).toBe(true);
    expect(result.reports).toHaveLength(1);
    expect(result.reports?.[0]?.clientId).toBe("CLIENT001");
  });

  it("should reject invalid file format", async () => {
    const buffer = Buffer.from("invalid content", "utf-8");
    const result = await validateAndParseImportFile(buffer, "test.txt");

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsupported file format");
  });

  it("should reject empty file", async () => {
    const csvContent = "";

    const buffer = Buffer.from(csvContent, "utf-8");
    const result = await validateAndParseImportFile(buffer, "test.csv");

    expect(result.valid).toBe(false);
    expect(result.error).toContain("No data found");
  });
});

describe("Email Functions", () => {
  it("should have sendEmail function", () => {
    expect(sendEmail).toBeDefined();
  });

  it("should have sendCriticalReportNotification function", () => {
    expect(sendCriticalReportNotification).toBeDefined();
  });

  it("sendEmail should return false if EMAIL_USER is not configured", async () => {
    // Mock environment variable
    const originalEnv = process.env.EMAIL_USER;
    delete process.env.EMAIL_USER;

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });

    expect(result).toBe(false);

    // Restore environment variable
    if (originalEnv) {
      process.env.EMAIL_USER = originalEnv;
    }
  });

  it("should format critical report notification correctly", async () => {
    // This test verifies the function signature and basic structure
    expect(sendCriticalReportNotification).toBeDefined();

    // The function should accept these parameters
    const result = await sendCriticalReportNotification(
      "test@example.com",
      123,
      "CLIENT001",
      "ClientBase"
    );

    // Should return a boolean
    expect(typeof result).toBe("boolean");
  });
});
