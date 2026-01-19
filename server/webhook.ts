import { DealSnapshot } from "../drizzle/schema";

interface WebhookPayload {
  event: "SENT" | "APPROVED" | "REJECTED" | "VIEWED";
  dealId: string;
  dealStatus: DealSnapshot["status"];
  clientName: string;
  clientEmail?: string;
  total: number;
  currency: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Fire webhook to external URL
 * Implements retry logic for failed requests
 */
export async function fireWebhook(
  webhookUrl: string,
  payload: WebhookPayload,
  maxRetries: number = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": generateWebhookSignature(payload),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`[WEBHOOK] Successfully sent to ${webhookUrl}`);
        return true;
      }

      console.warn(
        `[WEBHOOK] Failed attempt ${attempt}/${maxRetries}: ${response.status} ${response.statusText}`
      );

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return false;
      }
    } catch (error) {
      console.error(`[WEBHOOK] Attempt ${attempt}/${maxRetries} failed:`, error);

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
        );
      }
    }
  }

  console.error(`[WEBHOOK] All ${maxRetries} attempts failed for ${webhookUrl}`);
  return false;
}

/**
 * Generate HMAC signature for webhook (for future security)
 */
function generateWebhookSignature(payload: WebhookPayload): string {
  // TODO: Implement HMAC-SHA256 signature using a shared secret
  // For now, return a placeholder
  return "signature-placeholder";
}

/**
 * Create webhook payload from deal data
 */
export function createWebhookPayload(
  event: "SENT" | "APPROVED" | "REJECTED" | "VIEWED",
  deal: DealSnapshot,
  metadata?: Record<string, any>
): WebhookPayload {
  return {
    event,
    dealId: deal.id,
    dealStatus: deal.status,
    clientName: deal.clientName,
    clientEmail: deal.clientEmail || undefined,
    total: deal.total,
    currency: deal.currency,
    timestamp: new Date().toISOString(),
    metadata,
  };
}
