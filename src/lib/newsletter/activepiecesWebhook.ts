/**
 * Server-only Activepieces newsletter webhook.
 * Uses ACTIVEPIECES_NEWSLETTER_WEBHOOK — never import this into client components.
 */

const REQUEST_TIMEOUT_MS = 10_000;
export const NEWSLETTER_SOURCE = "website_newsletter";

export class NewsletterWebhookConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewsletterWebhookConfigError";
  }
}

export class NewsletterWebhookRequestError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "NewsletterWebhookRequestError";
    this.status = status;
  }
}

export type NewsletterActivepiecesPayload = {
  email: string;
  firstName: string;
  source: typeof NEWSLETTER_SOURCE;
};

/**
 * Forwards a validated signup to the Activepieces newsletter webhook.
 */
export async function sendNewsletterToActivepieces(input: {
  email: string;
  firstName: string;
}): Promise<{ status: number }> {
  const url = process.env.ACTIVEPIECES_NEWSLETTER_WEBHOOK?.trim() ?? "";
  if (!url) {
    throw new NewsletterWebhookConfigError(
      "ACTIVEPIECES_NEWSLETTER_WEBHOOK is not configured.",
    );
  }

  const body: NewsletterActivepiecesPayload = {
    email: input.email,
    firstName: input.firstName,
    source: NEWSLETTER_SOURCE,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted =
      (error instanceof Error && error.name === "AbortError") ||
      controller.signal.aborted;
    throw new NewsletterWebhookRequestError(
      aborted
        ? `Activepieces newsletter webhook timed out after ${REQUEST_TIMEOUT_MS}ms.`
        : "Activepieces newsletter webhook request failed.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new NewsletterWebhookRequestError(
      `Activepieces newsletter webhook returned HTTP ${response.status}.`,
      response.status,
    );
  }

  return { status: response.status };
}
