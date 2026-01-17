import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";

export interface PreviewResult {
  rows: Record<string, string>[];
  columns: string[];
}

/**
 * Preview CSV file
 */
export function previewCSV(fileContent: string, maxRows: number = 10): PreviewResult {
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, unknown>[];

  const columns = records.length > 0 ? Object.keys(records[0]) : [];
  const rows = records.slice(0, maxRows).map((r) => {
    const row: Record<string, string> = {};
    Object.keys(r).forEach((key) => {
      row[key] = String(r[key] || "");
    });
    return row;
  });

  return { rows, columns };
}

/**
 * Preview Excel file
 */
export function previewExcel(fileBuffer: Buffer, maxRows: number = 10): PreviewResult {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

  const columns = records.length > 0 ? Object.keys(records[0]) : [];
  const rows = records.slice(0, maxRows).map((r) => {
    const row: Record<string, string> = {};
    Object.keys(r).forEach((key) => {
      row[key] = String(r[key] || "");
    });
    return row;
  });

  return { rows, columns };
}

/**
 * Get preview of import file
 */
export async function getImportPreview(
  fileBuffer: Buffer,
  fileName: string,
  maxRows: number = 10
): Promise<{ valid: boolean; preview?: PreviewResult; error?: string }> {
  try {
    const ext = fileName.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      const content = fileBuffer.toString("utf-8");
      const preview = previewCSV(content, maxRows);
      return { valid: true, preview };
    } else if (ext === "xlsx" || ext === "xls") {
      const preview = previewExcel(fileBuffer, maxRows);
      return { valid: true, preview };
    } else {
      return {
        valid: false,
        error: "Unsupported file format. Please use CSV or Excel (.xlsx, .xls)",
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Failed to preview file",
    };
  }
}
