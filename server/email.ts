import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

// Configurar transporter de email
// Para produção, use variáveis de ambiente com credenciais reais
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Enviar email para um destinatário
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.EMAIL_USER) {
      console.warn("[Email] EMAIL_USER não configurado. Email não será enviado.");
      return false;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`[Email] Email enviado para ${options.to}`);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar email:", error);
    return false;
  }
}

/**
 * Enviar email de notificação de report crítico
 */
export async function sendCriticalReportNotification(
  email: string,
  reportId: number,
  clientId: string,
  reason: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #ff6b35; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">⚠️ Report Crítico Detectado</h1>
      </div>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
        <p>Um novo report crítico foi registrado no sistema N0 Error Tracker.</p>
        
        <div style="background-color: white; padding: 15px; border-left: 4px solid #ff6b35; margin: 15px 0;">
          <p><strong>ID do Report:</strong> #${reportId}</p>
          <p><strong>Cliente:</strong> ${clientId}</p>
          <p><strong>Motivo:</strong> ${reason}</p>
          <p><strong>Prioridade:</strong> <span style="color: #d63031; font-weight: bold;">CRÍTICA</span></p>
        </div>

        <p style="color: #636e72; font-size: 14px;">
          Acesse o sistema para mais detalhes e atualizações.
        </p>

        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.APP_URL || "https://n0-error-tracker.manus.space"}/reports/${reportId}" 
             style="background-color: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver Report
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #dfe6e9; margin: 20px 0;">
        <p style="color: #636e72; font-size: 12px; text-align: center;">
          N0 Error Tracker - Clinicorp<br>
          Este é um email automático. Por favor, não responda.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `[CRÍTICO] Report de Erro #${reportId} - Ação Imediata Necessária`,
    html,
  });
}

/**
 * Enviar email de notificação de SLA próximo do vencimento
 */
export async function sendSLAWarningNotification(
  email: string,
  reportId: number,
  clientId: string,
  hoursRemaining: number
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #fdcb6e; color: #2d3436; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">⏰ Alerta de SLA</h1>
      </div>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
        <p>O SLA de um report está próximo do vencimento.</p>
        
        <div style="background-color: white; padding: 15px; border-left: 4px solid #fdcb6e; margin: 15px 0;">
          <p><strong>ID do Report:</strong> #${reportId}</p>
          <p><strong>Cliente:</strong> ${clientId}</p>
          <p><strong>Tempo Restante:</strong> <span style="color: #d63031; font-weight: bold;">${hoursRemaining} horas</span></p>
        </div>

        <p style="color: #636e72; font-size: 14px;">
          Por favor, atualize o status do report o mais breve possível para evitar vencimento do SLA.
        </p>

        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.APP_URL || "https://n0-error-tracker.manus.space"}/reports/${reportId}" 
             style="background-color: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Atualizar Report
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #dfe6e9; margin: 20px 0;">
        <p style="color: #636e72; font-size: 12px; text-align: center;">
          N0 Error Tracker - Clinicorp<br>
          Este é um email automático. Por favor, não responda.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `[ALERTA] SLA do Report #${reportId} vence em ${hoursRemaining}h`,
    html,
  });
}

/**
 * Enviar email de notificação de status atualizado
 */
export async function sendStatusUpdateNotification(
  email: string,
  reportId: number,
  clientId: string,
  newStatus: string,
  updatedBy: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #00b894; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">✓ Report Atualizado</h1>
      </div>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
        <p>O status de um report foi atualizado.</p>
        
        <div style="background-color: white; padding: 15px; border-left: 4px solid #00b894; margin: 15px 0;">
          <p><strong>ID do Report:</strong> #${reportId}</p>
          <p><strong>Cliente:</strong> ${clientId}</p>
          <p><strong>Novo Status:</strong> <span style="color: #00b894; font-weight: bold;">${newStatus}</span></p>
          <p><strong>Atualizado por:</strong> ${updatedBy}</p>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.APP_URL || "https://n0-error-tracker.manus.space"}/reports/${reportId}" 
             style="background-color: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver Detalhes
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #dfe6e9; margin: 20px 0;">
        <p style="color: #636e72; font-size: 12px; text-align: center;">
          N0 Error Tracker - Clinicorp<br>
          Este é um email automático. Por favor, não responda.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Report #${reportId} - Status Atualizado para: ${newStatus}`,
    html,
  });
}
