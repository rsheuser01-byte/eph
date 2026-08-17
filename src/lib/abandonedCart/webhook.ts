/**
 * Server-only Activepieces webhook for abandoned-cart recovery.
 * Uses ACTIVEPIECES_ABANDONED_CART_WEBHOOK_URL — never import into client code.
 */

const REQUEST_TIMEOUT_MS = 5_000;

export class AbandonedCartWebhookRequestError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AbandonedCartWebhookRequestError";
    this.status = status;
  }
}

export function abandonedCartWebhookConfigured(): boolean {
  return Boolean(process.env.ACTIVEPIECES_ABANDONED_CART_WEBHOOK_URL?.trim());
}

/**
 * POST a payload to the abandoned-cart Activepieces webhook.
 * Returns skipped when the URL is unset so shopping is never blocked.
 */
export async function sendAbandonedCartWebhook(
  payload: Record<string, unknown>,
): Promise<{ ok: true; skipped: boolean; status?: number }> {
  const url = process.env.ACTIVEPIECES_ABANDONED_CART_WEBHOOK_URL?.trim() ?? "";
  if (!url) {
    return { ok: true, skipped: true };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted =
      (error instanceof Error && error.name === "AbortError") ||
      controller.signal.aborted;
    throw new AbandonedCartWebhookRequestError(
      aborted
        ? `Abandoned-cart webhook timed out after ${REQUEST_TIMEOUT_MS}ms.`
        : "Abandoned-cart webhook request failed.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new AbandonedCartWebhookRequestError(
      `Abandoned-cart webhook returned HTTP ${response.status}.`,
      response.status,
    );
  }

  return { ok: true, skipped: false, status: response.status };
}

export async function sendAbandonedCartWebhookSafe(
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await sendAbandonedCartWebhook(payload);
  } catch (error) {
    console.error("[abandoned-cart] webhook failed", {
      event: payload.event,
      cartId: payload.cartId,
      error: error instanceof Error ? error.name : "unknown",
    });
  }
}
