export type NewsletterSubscribeRequest = {
  email: string;
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
 * Validates a homepage newsletter signup payload (email only).
 */
export function parseNewsletterSubscribeRequest(
  input: unknown,
): ParseNewsletterSubscribeResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const email = str((input as Record<string, unknown>).email).toLowerCase();
  if (!email || !isValidEmail(email)) {
    return { ok: false, error: "A valid email address is required." };
  }
  return { ok: true, value: { email } };
}
