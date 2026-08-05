import { afterEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/seo/siteUrl";
import {
  marketingEmailFooterText,
  RESEND_UNSUBSCRIBE_URL_PLACEHOLDER,
  wrapMarketingEmailHtml,
} from "@/lib/email/marketingEmailLayout";
import {
  buildWelcomeEmail,
  FIRST_NAME_FALLBACK,
  RESEND_FIRST_NAME_PLACEHOLDER,
  WELCOME_EMAIL_SUBJECT,
  WELCOME_PRODUCTS_CTA_URL,
  WELCOME_PROMO_CODE,
  welcomeEmailTemplateVariables,
} from "@/lib/email/marketing/welcomeEmail";
import {
  syncWelcomeTemplate,
  WELCOME_TEMPLATE_ALIAS,
  type ResendTemplatesClient,
} from "@/lib/email/marketing/syncWelcomeTemplate";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("marketingEmailLayout", () => {
  it("matches transactional shell branding and keeps unsubscribe placeholder intact", () => {
    const html = wrapMarketingEmailHtml({
      siteName: "Elevate Precision Health",
      heading: "Welcome",
      intro: "Thanks for subscribing.",
      bodyHtml: "<p>Body</p>",
    });

    expect(html).toContain(
      `src="${CANONICAL_PRODUCTION_ORIGIN}/images/logo.png"`,
    );
    expect(html).toContain(`href="${CANONICAL_PRODUCTION_ORIGIN}"`);
    expect(html).toContain("#00a0ec");
    expect(html).toContain("#f0f4f8");
    expect(html).toContain("max-width:560px");
    expect(html).toContain("display:none");
    expect(html).toContain("Thanks for subscribing.");
    expect(html).toContain("Research use only. Not for human or veterinary use.");
    expect(html).toContain(
      "You received this message because you subscribed to Elevate Precision Health news and product updates.",
    );
    expect(html).not.toContain("Questions about your order?");
    expect(html).toContain(`href="${RESEND_UNSUBSCRIBE_URL_PLACEHOLDER}"`);
    expect(html).toContain(">Unsubscribe</a>");
    expect(html).not.toContain("&lbrace;&lbrace;");
  });

  it("documents subscription context in plain-text footer", () => {
    const text = marketingEmailFooterText();
    expect(text).toContain("Elevate Precision Health");
    expect(text).toContain("subscribed to Elevate Precision Health news");
    expect(text).toContain(RESEND_UNSUBSCRIBE_URL_PLACEHOLDER);
    expect(text).not.toContain("Questions about your order?");
  });
});

describe("buildWelcomeEmail", () => {
  it("uses the welcome subject and absolute product CTA", () => {
    const email = buildWelcomeEmail({ firstName: "Robert" });
    expect(email.subject).toBe(WELCOME_EMAIL_SUBJECT);
    expect(email.html).toContain(WELCOME_PRODUCTS_CTA_URL);
    expect(WELCOME_PRODUCTS_CTA_URL).toBe(
      `${CANONICAL_PRODUCTION_ORIGIN}/products`,
    );
    expect(email.html).toContain(
      `src="${CANONICAL_PRODUCTION_ORIGIN}/images/logo.png"`,
    );
    expect(email.text).toContain(WELCOME_PRODUCTS_CTA_URL);
  });

  it("includes the first-order promo code offer", () => {
    const email = buildWelcomeEmail({ firstName: "Robert" });
    expect(email.html).toContain(WELCOME_PROMO_CODE);
    expect(email.html).toContain("20% off");
    expect(email.html).toContain("first order");
    expect(email.text).toContain(WELCOME_PROMO_CODE);
    expect(email.text).toContain("20% off");
  });

  it("personalizes with a concrete first name", () => {
    const email = buildWelcomeEmail({ firstName: "Robert" });
    expect(email.html).toContain("Hi Robert,");
    expect(email.text).toContain("Hi Robert,");
  });

  it("falls back when first name is missing", () => {
    const email = buildWelcomeEmail({});
    expect(email.html).toContain(`Hi ${FIRST_NAME_FALLBACK},`);
    expect(email.text).toContain(`Hi ${FIRST_NAME_FALLBACK},`);
  });

  it("embeds Resend placeholders for template sync without escaping them", () => {
    const email = buildWelcomeEmail({ forResendTemplate: true });
    expect(email.html).toContain(`Hi ${RESEND_FIRST_NAME_PLACEHOLDER},`);
    expect(email.html).toContain(`href="${RESEND_UNSUBSCRIBE_URL_PLACEHOLDER}"`);
    expect(email.text).toContain(RESEND_FIRST_NAME_PLACEHOLDER);
    expect(email.text).toContain(RESEND_UNSUBSCRIBE_URL_PLACEHOLDER);
    expect(email.html).toContain("What to expect");
    expect(email.text).toContain("New product and inventory announcements");
  });

  it("does not declare reserved Resend variable keys as custom variables", () => {
    const keys = welcomeEmailTemplateVariables().map((variable) => variable.key);
    expect(keys).toEqual([]);
    expect(keys).not.toContain("FIRST_NAME");
    expect(keys).not.toContain("EMAIL");
    expect(keys).not.toContain("RESEND_UNSUBSCRIBE_URL");
  });
});

describe("syncWelcomeTemplate", () => {
  function mockClient(
    overrides: Partial<ResendTemplatesClient>,
  ): ResendTemplatesClient {
    return {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      publish: vi.fn(),
      ...overrides,
    };
  }

  it("creates then publishes when the alias is missing", async () => {
    vi.stubEnv(
      "MARKETING_EMAIL_FROM",
      "Elevate Precision Health <updates@example.com>",
    );
    vi.stubEnv("EMAIL_REPLY_TO", "support@elevateprecisionhealth.com");

    const client = mockClient({
      get: vi.fn().mockResolvedValue({
        data: null,
        error: { statusCode: 404, name: "not_found", message: "not found" },
      }),
      create: vi.fn().mockResolvedValue({
        data: { id: "tmpl_new", alias: WELCOME_TEMPLATE_ALIAS },
        error: null,
      }),
      publish: vi.fn().mockResolvedValue({
        data: { id: "tmpl_new", status: "published" },
        error: null,
      }),
    });

    const result = await syncWelcomeTemplate(client);
    expect(result).toEqual({
      action: "created",
      templateId: "tmpl_new",
      alias: WELCOME_TEMPLATE_ALIAS,
      published: true,
    });
    expect(client.create).toHaveBeenCalledTimes(1);
    expect(client.update).not.toHaveBeenCalled();
    expect(client.publish).toHaveBeenCalledWith("tmpl_new");

    const createPayload = (client.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>;
    expect(createPayload.alias).toBe(WELCOME_TEMPLATE_ALIAS);
    expect(createPayload.from).toContain("updates@example.com");
    expect(createPayload.reply_to).toBe("support@elevateprecisionhealth.com");
    expect(String(createPayload.html)).toContain(
      RESEND_UNSUBSCRIBE_URL_PLACEHOLDER,
    );
  });

  it("updates then publishes when the alias already exists", async () => {
    vi.stubEnv(
      "MARKETING_EMAIL_FROM",
      "Elevate Precision Health <updates@example.com>",
    );

    const client = mockClient({
      get: vi.fn().mockResolvedValue({
        data: { id: "tmpl_existing", alias: WELCOME_TEMPLATE_ALIAS },
        error: null,
      }),
      update: vi.fn().mockResolvedValue({
        data: { id: "tmpl_existing", alias: WELCOME_TEMPLATE_ALIAS },
        error: null,
      }),
      publish: vi.fn().mockResolvedValue({
        data: { id: "tmpl_existing", status: "published" },
        error: null,
      }),
    });

    const result = await syncWelcomeTemplate(client);
    expect(result.action).toBe("updated");
    expect(result.templateId).toBe("tmpl_existing");
    expect(result.published).toBe(true);
    expect(client.create).not.toHaveBeenCalled();
    expect(client.update).toHaveBeenCalledWith(
      "tmpl_existing",
      expect.objectContaining({
        name: "EPH Newsletter Welcome",
        subject: WELCOME_EMAIL_SUBJECT,
      }),
    );
    expect(client.publish).toHaveBeenCalledWith("tmpl_existing");
  });

  it("throws on Resend API failure without exposing secrets", async () => {
    vi.stubEnv(
      "MARKETING_EMAIL_FROM",
      "Elevate Precision Health <updates@example.com>",
    );
    vi.stubEnv("RESEND_API_KEY", "re_secret_should_not_leak");

    const client = mockClient({
      get: vi.fn().mockResolvedValue({
        data: null,
        error: { statusCode: 404, message: "not found" },
      }),
      create: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "rate_limit_exceeded" },
      }),
    });

    await expect(syncWelcomeTemplate(client)).rejects.toThrow(
      /rate_limit_exceeded/,
    );
    try {
      await syncWelcomeTemplate(client);
    } catch (error) {
      expect(String(error)).not.toContain("re_secret_should_not_leak");
    }
  });
});
