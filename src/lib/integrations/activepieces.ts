/**
 * Server-side Activepieces webhook client.
 * Not wired to checkout/orders yet — call explicitly from approved paths only.
 */

const REQUEST_TIMEOUT_MS = 10_000;

export type ActivepiecesEventInput = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

export type ActivepiecesSendResult =
  | {
      ok: true;
      skipped: true;
      reason: "disabled";
    }
  | {
      ok: true;
      skipped: false;
      eventId: string;
      status: number;
    };

export class ActivepiecesConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActivepiecesConfigError";
  }
}

export class ActivepiecesRequestError extends Error {
  readonly status?: number;
  readonly eventId: string;
  readonly eventType: string;

  constructor(
    message: string,
    options: { eventId: string; eventType: string; status?: number },
  ) {
    super(message);
    this.name = "ActivepiecesRequestError";
    this.eventId = options.eventId;
    this.eventType = options.eventType;
    this.status = options.status;
  }
}

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function isAutomationEnabled(): boolean {
  return readEnv("MARKETING_AUTOMATION_ENABLED") === "true";
}

function requireAutomationConfig(): { url: string; secret: string } {
  const url = readEnv("ACTIVEPIECES_WEBHOOK_URL");
  const secret = readEnv("ACTIVEPIECES_WEBHOOK_SECRET");
  if (!url || !secret) {
    throw new ActivepiecesConfigError(
      "MARKETING_AUTOMATION_ENABLED is true but ACTIVEPIECES_WEBHOOK_URL or ACTIVEPIECES_WEBHOOK_SECRET is missing.",
    );
  }
  return { url, secret };
}

/**
 * Sends a structured event to Activepieces when marketing automation is enabled.
 * Returns a typed success result (including a no-op when automation is disabled).
 * Throws ActivepiecesConfigError / ActivepiecesRequestError on failure.
 */
export async function sendActivepiecesEvent(
  input: ActivepiecesEventInput,
): Promise<ActivepiecesSendResult> {
  if (!isAutomationEnabled()) {
    return { ok: true, skipped: true, reason: "disabled" };
  }

  const { url, secret } = requireAutomationConfig();
  const body = {
    eventId: input.eventId,
    eventType: input.eventType,
    occurredAt: input.occurredAt,
    payload: input.payload,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-EPH-Webhook-Secret": secret,
        "X-EPH-Event-Id": input.eventId,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted =
      (error instanceof Error && error.name === "AbortError") ||
      controller.signal.aborted;
    throw new ActivepiecesRequestError(
      aborted
        ? `Activepieces request timed out after ${REQUEST_TIMEOUT_MS}ms (eventType=${input.eventType}).`
        : `Activepieces request failed (eventType=${input.eventType}).`,
      { eventId: input.eventId, eventType: input.eventType },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new ActivepiecesRequestError(
      `Activepieces webhook returned HTTP ${response.status} (eventType=${input.eventType}).`,
      {
        eventId: input.eventId,
        eventType: input.eventType,
        status: response.status,
      },
    );
  }

  return {
    ok: true,
    skipped: false,
    eventId: input.eventId,
    status: response.status,
  };
}
