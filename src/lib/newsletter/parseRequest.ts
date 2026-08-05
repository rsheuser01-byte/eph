export type NewsletterSubscribeRequest = {
  email: string;
  /** Optional; empty string when not provided. */
  firstName: string;
};

export type ParseNewsletterSubscribeResult =
  | { ok: true; value: NewsletterSubscribeRequest }
  | { ok: false; error: string };

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates a newsletter signup payload (email required, firstName optional).
 */
export function parseNewsletterSubscribeRequest(
  input: unknown,
): ParseNewsletterSubscribeResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const record = input as Record<string, unknown>;
  const email = str(record.email).toLowerCase();
  const firstName = str(record.firstName);

  if (!email || !isValidEmail(email)) {
    return { ok: false, error: "A valid email address is required." };
  }
  return { ok: true, value: { email, firstName } };
}
