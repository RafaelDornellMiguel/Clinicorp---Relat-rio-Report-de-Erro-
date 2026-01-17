import { getErrorReportById, getStatusHistoryByReportId, getReportCommentsByReportId } from "./db";
import * as XLSX from "xlsx";
import { PDFDocument, rgb } from "pdf-lib";

/**
 * Gera um relatório em Excel com informações completas do report
 */
export async function generateReportExcel(reportId: number) {
  const report = await getErrorReportById(reportId);
  if (!report) {
    throw new Error("Report not found");
  }

  const history = await getStatusHistoryByReportId(reportId);
  const comments = await getReportCommentsByReportId(reportId);

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Report Details
  const reportData = [
    ["N0 Error Tracker - Relatório de Report"],
    [],
    ["ID do Cliente", report.clientId],
    ["Chave", report.key],
    ["Status", report.status],
    ["Prioridade", report.priority],
    ["Motivo", report.reason],
    ["Origem", report.origin],
    ["Agente Responsável", report.assignedAgent || "-"],
    ["Data de Criação", new Date(report.createdAt).toLocaleString("pt-BR")],
    ["Última Atualização", new Date(report.updatedAt).toLocaleString("pt-BR")],
    [],
    ["Módulos Importados"],
    [report.modules || "-"],
    [],
    ["Registros Afetados"],
    [report.records || "-"],
    [],
    ["Descrição da Resolução"],
    [report.resolutionDescription || "-"],
    [],
    ["URL do Ticket", report.ticketUrl || "-"],
    ["Ação Recomendada", report.recommendedAction || "-"],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(reportData);
  ws1["!cols"] = [{ wch: 25 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Report");

  // Sheet 2: Status History
  if (history.length > 0) {
    const historyData = [
      ["Histórico de Status"],
      ["Data", "Status Anterior", "Novo Status", "Alterado Por", "Motivo"],
      ...history.map((h) => [
        new Date(h.createdAt).toLocaleString("pt-BR"),
        h.previousStatus,
        h.newStatus,
        h.changedByName,
        h.reason || "-",
      ]),
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(historyData);
    ws2["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Histórico");
  }

  // Sheet 3: Comments
  if (comments.length > 0) {
    const commentsData = [
      ["Comentários"],
      ["Data", "Usuário", "Comentário"],
      ...comments.map((c) => [
        new Date(c.createdAt).toLocaleString("pt-BR"),
        c.userName,
        c.comment,
      ]),
    ];

    const ws3 = XLSX.utils.aoa_to_sheet(commentsData);
    ws3["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Comentários");
  }

  // Generate buffer
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  return buffer;
}

/**
 * Gera um relatório em PDF com informações completas do report
 */
export async function generateReportPDF(reportId: number) {
  const report = await getErrorReportById(reportId);
  if (!report) {
    throw new Error("Report not found");
  }

  const history = await getStatusHistoryByReportId(reportId);
  const comments = await getReportCommentsByReportId(reportId);

  // Create PDF
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]); // Letter size
  const { height } = page.getSize();
  let yPosition = height - 50;

  const fontSize = 12;
  const titleFontSize = 16;
  const headingFontSize = 14;

  // Helper function to add text
  const addText = (text: string, size: number = fontSize, bold = false) => {
    if (yPosition < 50) {
      page = pdfDoc.addPage([612, 792]);
      yPosition = height - 50;
    }

    page.drawText(text, {
      x: 50,
      y: yPosition,
      size,
      color: rgb(0, 0, 0),
    });

    yPosition -= size + 5;
  };

  // Title
  addText("N0 Error Tracker - Relatório de Report", titleFontSize, true);
  yPosition -= 10;

  // Report Details
  addText("Informações do Report", headingFontSize, true);
  addText(`ID do Cliente: ${report.clientId}`);
  addText(`Chave: ${report.key}`);
  addText(`Status: ${report.status}`);
  addText(`Prioridade: ${report.priority}`);
  addText(`Motivo: ${report.reason}`);
  addText(`Origem: ${report.origin}`);
  addText(`Agente Responsável: ${report.assignedAgent || "-"}`);
  addText(`Data de Criação: ${new Date(report.createdAt).toLocaleString("pt-BR")}`);
  addText(`Última Atualização: ${new Date(report.updatedAt).toLocaleString("pt-BR")}`);

  yPosition -= 10;
  addText("Módulos Importados", headingFontSize, true);
  addText(report.modules || "-");

  yPosition -= 10;
  addText("Registros Afetados", headingFontSize, true);
  addText(report.records || "-");

  yPosition -= 10;
  addText("Descrição da Resolução", headingFontSize, true);
  addText(report.resolutionDescription || "-");

  if (history.length > 0) {
    yPosition -= 10;
    addText("Histórico de Status", headingFontSize, true);
    history.forEach((h) => {
      addText(
        `${new Date(h.createdAt).toLocaleString("pt-BR")} - ${h.previousStatus} → ${h.newStatus} (${h.changedByName})`
      );
      if (h.reason) {
        addText(`Motivo: ${h.reason}`);
      }
    });
  }

  if (comments.length > 0) {
    yPosition -= 10;
    addText("Comentários", headingFontSize, true);
    comments.forEach((c) => {
      addText(`${new Date(c.createdAt).toLocaleString("pt-BR")} - ${c.userName}`);
      addText(c.comment);
      yPosition -= 5;
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
