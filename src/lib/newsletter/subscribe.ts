import { Resend } from "resend";
import { getSupportEmail } from "@/lib/email/emailLayout";
import { WELCOME_TEMPLATE_ALIAS } from "@/lib/email/marketing/syncWelcomeTemplate";

export type ResendContactError = {
  name?: string;
  statusCode?: number;
  message?: string;
};

export type ResendNewsletterClient = {
  contacts: {
    create: (params: {
      email: string;
      unsubscribed?: boolean;
    }) => Promise<{ data: unknown; error: ResendContactError | null }>;
  };
  emails: {
    send: (params: Record<string, unknown>) => Promise<{
      data: unknown;
      error: { message?: string } | null;
    }>;
  };
};

export class NewsletterConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewsletterConfigError";
  }
}

export class NewsletterSubscribeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewsletterSubscribeError";
  }
}

function readMarketingConfig(): { apiKey: string; from: string } {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.MARKETING_EMAIL_FROM?.trim() ?? "";
  if (!apiKey || !from) {
    throw new NewsletterConfigError(
      "Newsletter signup is not configured. Set RESEND_API_KEY and MARKETING_EMAIL_FROM.",
    );
  }
  return { apiKey, from };
}

function isExistingContactError(error: ResendContactError | null): boolean {
  if (!error) {
    return false;
  }
  const message = (error.message ?? "").toLowerCase();
  return (
    error.statusCode === 409 ||
    message.includes("already exists") ||
    message.includes("already been added")
  );
}

function createDefaultClient(apiKey: string): ResendNewsletterClient {
  const resend = new Resend(apiKey);
  return resend as unknown as ResendNewsletterClient;
}

/**
 * Creates a Resend contact (idempotent if already present) and sends the
 * published welcome template `eph-newsletter-welcome`.
 */
export async function subscribeToNewsletter(
  email: string,
  options?: { client?: ResendNewsletterClient },
): Promise<{ email: string }> {
  const { apiKey, from } = readMarketingConfig();
  const client = options?.client ?? createDefaultClient(apiKey);

  const createResult = await client.contacts.create({
    email,
    unsubscribed: false,
  });

  if (createResult.error && !isExistingContactError(createResult.error)) {
    throw new NewsletterSubscribeError(
      createResult.error.message ?? "Could not create newsletter contact.",
    );
  }

  const sendResult = await client.emails.send({
    from,
    to: [email],
    reply_to: getSupportEmail(),
    template: { id: WELCOME_TEMPLATE_ALIAS },
  });

  if (sendResult.error) {
    throw new NewsletterSubscribeError(
      sendResult.error.message ?? "Could not send welcome email.",
    );
  }

  return { email };
}
