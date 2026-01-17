import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { getDb } from "./db";
import { errorReports, InsertErrorReport } from "../drizzle/schema";

export interface ImportReport {
  clientId: string;
  key: string;
  modulesImported?: string;
  origin: string;
  reason: string;
  assignedAgent: string;
  records?: string;
  status: string;
  ticket?: string;
  recommendedAction?: string;
}

/**
 * Parse CSV file and return array of reports
 */
export function parseCSV(fileContent: string): ImportReport[] {
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((record: any) => ({
    clientId: record.clientId || record["Client ID"] || "",
    key: record.key || record["Key"] || new Date().toISOString(),
    modulesImported: record.modulesImported || record["Modules Imported"] || "",
    origin: record.origin || record["Origin"] || "Other",
    reason: record.reason || record["Reason"] || "Outro",
    assignedAgent: record.assignedAgent || record["Assigned Agent"] || "",
    records: record.records || record["Records"] || "",
    status: record.status || record["Status"] || "NoPrazo",
    ticket: record.ticket || record["Ticket"] || "",
    recommendedAction: record.recommendedAction || record["Recommended Action"] || "",
  }));
}

/**
 * Parse Excel file and return array of reports
 */
export function parseExcel(fileBuffer: Buffer): ImportReport[] {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json(worksheet);

  return records.map((record: any) => ({
    clientId: record.clientId || record["Client ID"] || "",
    key: record.key || record["Key"] || new Date().toISOString(),
    modulesImported: record.modulesImported || record["Modules Imported"] || "",
    origin: record.origin || record["Origin"] || "Other",
    reason: record.reason || record["Reason"] || "Outro",
    assignedAgent: record.assignedAgent || record["Assigned Agent"] || "",
    records: record.records || record["Records"] || "",
    status: record.status || record["Status"] || "NoPrazo",
    ticket: record.ticket || record["Ticket"] || "",
    recommendedAction: record.recommendedAction || record["Recommended Action"] || "",
  }));
}

/**
 * Import reports to database
 */
export async function importReports(
  reports: ImportReport[],
  userId: number
): Promise<{ success: number; failed: number; errors: string[] }> {
  const db = await getDb();
  if (!db) {
    return {
      success: 0,
      failed: reports.length,
      errors: ["Database not available"],
    };
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < reports.length; i++) {
    try {
      const report = reports[i];

      // Validate required fields
      if (!report.clientId || !report.key) {
        errors.push(`Row ${i + 1}: clientId and key are required`);
        failed++;
        continue;
      }

      // Map import data to database schema
      const dbReport: InsertErrorReport = {
        clientId: report.clientId,
        key: report.key,
        modules: report.modulesImported || null,
        origin: report.origin as any,
        reason: report.reason as any,
        assignedAgent: report.assignedAgent || null,
        records: report.records || null,
        status: report.status as any,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert report
      await db.insert(errorReports).values(dbReport);
      success++;
    } catch (error) {
      failed++;
      errors.push(
        `Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return { success, failed, errors };
}

/**
 * Validate import file and return parsed reports
 */
export async function validateAndParseImportFile(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ valid: boolean; reports?: ImportReport[]; error?: string }> {
  try {
    const ext = fileName.split(".").pop()?.toLowerCase();
    let reports: ImportReport[];

    if (ext === "csv") {
      const content = fileBuffer.toString("utf-8");
      reports = parseCSV(content);
    } else if (ext === "xlsx" || ext === "xls") {
      reports = parseExcel(fileBuffer);
    } else {
      return {
        valid: false,
        error: "Unsupported file format. Please use CSV or Excel (.xlsx, .xls)",
      };
    }

    if (reports.length === 0) {
      return {
        valid: false,
        error: "No data found in file",
      };
    }

    // Validate each report has minimum required fields
    const invalidReports = reports.filter(
      (r) => !r.clientId || !r.key || !r.origin || !r.reason
    );

    if (invalidReports.length > 0) {
      return {
        valid: false,
        error: `${invalidReports.length} reports are missing required fields (clientId, key, origin, reason)`,
      };
    }

    return { valid: true, reports };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Failed to parse file",
    };
  }
}
