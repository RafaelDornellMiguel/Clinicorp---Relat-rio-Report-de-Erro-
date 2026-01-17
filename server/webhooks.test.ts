import { describe, it, expect } from "vitest";
import {
  getN8nWebhookUrl,
  getHubSpotWebhookUrl,
  getN8nPayloadExample,
  getHubSpotPayloadExample,
} from "./webhooks-config";

describe("Webhooks Configuration", () => {
  it("should generate N8n webhook URL", () => {
    const url = getN8nWebhookUrl("https://example.com");
    expect(url).toContain("webhooks.receive");
    expect(url).toContain("https://example.com");
  });

  it("should generate HubSpot webhook URL", () => {
    const url = getHubSpotWebhookUrl("https://example.com");
    expect(url).toContain("webhooks.receive");
    expect(url).toContain("https://example.com");
  });

  it("should provide N8n payload example", () => {
    const payload = getN8nPayloadExample();
    expect(payload.source).toBe("n8n");
    expect(payload.data).toBeDefined();
    expect((payload.data as Record<string, unknown>).clientId).toBe("CLIENT001");
  });

  it("should provide HubSpot payload example", () => {
    const payload = getHubSpotPayloadExample();
    expect(payload.source).toBe("hubspot");
    expect(payload.data).toBeDefined();
    expect((payload.data as Record<string, unknown>).contact_id).toBe("12345");
  });

  it("should have timestamp in payload examples", () => {
    const n8nPayload = getN8nPayloadExample();
    const hubspotPayload = getHubSpotPayloadExample();

    expect(n8nPayload.timestamp).toBeInstanceOf(Date);
    expect(hubspotPayload.timestamp).toBeInstanceOf(Date);
  });
});
