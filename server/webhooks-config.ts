import { getDb } from "./db";
import { errorReports } from "../drizzle/schema";
import { createErrorReport } from "./db";

/**
 * Process webhook from HubSpot
 * Expected data structure:
 * {
 *   contact_id: string,
 *   contact_name: string,
 *   company_name: string,
 *   issue_description: string,
 *   issue_type: string,
 *   created_at: string
 * }
 */
export async function processHubSpotWebhook(data: Record<string, unknown>): Promise<boolean> {
  try {
    const report = await createErrorReport({
      clientId: String(data.company_name || data.contact_id || "HubSpot"),
      key: `HS-${Date.now()}`,
      modules: String(data.issue_type || ""),
      origin: "Onboarding",
      reason: "ClientBase",
      assignedAgent: null,
      records: String(data.issue_description || ""),
      status: "NoPrazo",
      createdBy: 0, // System user
    });

    console.log("[HubSpot Webhook] Report created successfully");
    return true;
  } catch (error) {
    console.error("[HubSpot Webhook] Error processing webhook:", error);
    return false;
  }
}

/**
 * Process webhook from N8n
 * Expected data structure:
 * {
 *   clientId: string,
 *   key: string,
 *   modules: string,
 *   origin: string,
 *   reason: string,
 *   assignedAgent: string,
 *   records: string,
 *   status: string
 * }
 */
export async function processN8nWebhook(data: Record<string, unknown>): Promise<boolean> {
  try {
    const report = await createErrorReport({
      clientId: String(data.clientId || "N8n"),
      key: String(data.key || `N8N-${Date.now()}`),
      modules: data.modules ? String(data.modules) : null,
      origin: String(data.origin || "Other") as any,
      reason: String(data.reason || "Outro") as any,
      assignedAgent: data.assignedAgent ? String(data.assignedAgent) : null,
      records: data.records ? String(data.records) : null,
      status: String(data.status || "NoPrazo") as any,
      createdBy: 0, // System user
    });

    console.log("[N8n Webhook] Report created successfully");
    return true;
  } catch (error) {
    console.error("[N8n Webhook] Error processing webhook:", error);
    return false;
  }
}

/**
 * Get webhook URL for N8n configuration
 */
export function getN8nWebhookUrl(baseUrl: string): string {
  return `${baseUrl}/api/trpc/webhooks.receive`;
}

/**
 * Get webhook URL for HubSpot configuration
 */
export function getHubSpotWebhookUrl(baseUrl: string): string {
  return `${baseUrl}/api/trpc/webhooks.receive`;
}

/**
 * Generate N8n webhook payload example
 */
export function getN8nPayloadExample(): Record<string, unknown> {
  return {
    source: "n8n",
    data: {
      clientId: "CLIENT001",
      key: "KEY-2024-001",
      modules: "Module1,Module2",
      origin: "Onboarding",
      reason: "ClientBase",
      assignedAgent: "Sarah",
      records: "Record1,Record2",
      status: "NoPrazo",
    },
    timestamp: new Date(),
  };
}

/**
 * Generate HubSpot webhook payload example
 */
export function getHubSpotPayloadExample(): Record<string, unknown> {
  return {
    source: "hubspot",
    data: {
      contact_id: "12345",
      contact_name: "John Doe",
      company_name: "Acme Corp",
      issue_description: "Error in module X",
      issue_type: "Bug",
      created_at: new Date().toISOString(),
    },
    timestamp: new Date(),
  };
}
