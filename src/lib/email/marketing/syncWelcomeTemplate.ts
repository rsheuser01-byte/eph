import {
  buildWelcomeEmail,
  welcomeEmailTemplateVariables,
  WELCOME_EMAIL_SUBJECT,
} from "@/lib/email/marketing/welcomeEmail";

export const WELCOME_TEMPLATE_ALIAS = "eph-newsletter-welcome";
export const WELCOME_TEMPLATE_NAME = "EPH Newsletter Welcome";

export type ResendTemplateRecord = {
  id: string;
  alias?: string | null;
  status?: string | null;
};

export type ResendTemplatesClient = {
  get: (
    idOrAlias: string,
  ) => Promise<{ data: ResendTemplateRecord | null; error: unknown }>;
  create: (params: Record<string, unknown>) => Promise<{
    data: ResendTemplateRecord | null;
    error: unknown;
  }>;
  update: (
    idOrAlias: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: ResendTemplateRecord | null; error: unknown }>;
  publish: (
    idOrAlias: string,
  ) => Promise<{ data: ResendTemplateRecord | null; error: unknown }>;
};

export type SyncWelcomeTemplateResult = {
  action: "created" | "updated";
  templateId: string;
  alias: string;
  published: boolean;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function formatResendError(error: unknown): string {
  if (!error) {
    return "Unknown Resend error";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return "Resend API request failed";
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as { statusCode?: number; name?: string; message?: string };
  if (record.statusCode === 404) {
    return true;
  }
  const haystack = `${record.name ?? ""} ${record.message ?? ""}`.toLowerCase();
  return haystack.includes("not_found") || haystack.includes("not found");
}

export function getMarketingSenderFromEnv(): {
  from: string;
  replyTo?: string;
} {
  const from = readRequiredEnv("MARKETING_EMAIL_FROM");
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  return replyTo ? { from, replyTo } : { from };
}

export function buildWelcomeTemplatePayload(from: string, replyTo?: string) {
  const content = buildWelcomeEmail({ forResendTemplate: true });
  const payload: {
    name: string;
    alias: string;
    from: string;
    subject: string;
    html: string;
    text: string;
    reply_to?: string;
    variables: ReturnType<typeof welcomeEmailTemplateVariables>;
  } = {
    name: WELCOME_TEMPLATE_NAME,
    alias: WELCOME_TEMPLATE_ALIAS,
    from,
    subject: content.subject || WELCOME_EMAIL_SUBJECT,
    html: content.html,
    text: content.text,
    variables: welcomeEmailTemplateVariables(),
  };
  if (replyTo) {
    payload.reply_to = replyTo;
  }
  return payload;
}

/**
 * Idempotent create-or-update + publish for the newsletter welcome template.
 * Accepts a narrow Resend templates client so unit tests can mock the API.
 */
export async function syncWelcomeTemplate(
  templates: ResendTemplatesClient,
): Promise<SyncWelcomeTemplateResult> {
  const { from, replyTo } = getMarketingSenderFromEnv();
  const payload = buildWelcomeTemplatePayload(from, replyTo);

  const existing = await templates.get(WELCOME_TEMPLATE_ALIAS);
  let action: "created" | "updated";
  let templateId: string;

  if (existing.data?.id) {
    const updated = await templates.update(existing.data.id, {
      name: payload.name,
      from: payload.from,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: payload.reply_to,
      variables: payload.variables,
    });
    if (updated.error || !updated.data?.id) {
      throw new Error(formatResendError(updated.error));
    }
    action = "updated";
    templateId = updated.data.id;
  } else if (existing.error && !isNotFoundError(existing.error)) {
    throw new Error(formatResendError(existing.error));
  } else {
    const created = await templates.create(payload);
    if (created.error || !created.data?.id) {
      throw new Error(formatResendError(created.error));
    }
    action = "created";
    templateId = created.data.id;
  }

  const published = await templates.publish(templateId);
  if (published.error) {
    throw new Error(formatResendError(published.error));
  }

  const status = published.data?.status?.toLowerCase();
  return {
    action,
    templateId,
    alias: WELCOME_TEMPLATE_ALIAS,
    published: status ? status === "published" : true,
  };
}
