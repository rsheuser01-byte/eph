import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NewsletterConfigError,
  NewsletterSubscribeError,
  subscribeToNewsletter,
  type ResendNewsletterClient,
} from "./subscribe";

function createClient(overrides?: {
  createResult?: Awaited<
    ReturnType<ResendNewsletterClient["contacts"]["create"]>
  >;
  sendResult?: Awaited<ReturnType<ResendNewsletterClient["emails"]["send"]>>;
}): {
  client: ResendNewsletterClient;
  create: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
} {
  const create = vi.fn().mockResolvedValue(
    overrides?.createResult ?? {
      data: { id: "contact_1" },
      error: null,
    },
  );
  const send = vi.fn().mockResolvedValue(
    overrides?.sendResult ?? {
      data: { id: "email_1" },
      error: null,
    },
  );

  return {
    client: {
      contacts: { create },
      emails: { send },
    },
    create,
    send,
  };
}

describe("subscribeToNewsletter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws NewsletterConfigError when API key or marketing from is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("MARKETING_EMAIL_FROM", "");
    const { client } = createClient();

    await expect(
      subscribeToNewsletter("lab@example.com", { client }),
    ).rejects.toBeInstanceOf(NewsletterConfigError);
  });

  it("creates a contact and sends the welcome template", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv(
      "MARKETING_EMAIL_FROM",
      "Elevate Precision Health <updates@example.com>",
    );
    vi.stubEnv("EMAIL_REPLY_TO", "support@example.com");

    const { client, create, send } = createClient();
    const result = await subscribeToNewsletter("lab@example.com", { client });

    expect(result).toEqual({ email: "lab@example.com" });
    expect(create).toHaveBeenCalledWith({
      email: "lab@example.com",
      unsubscribed: false,
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Elevate Precision Health <updates@example.com>",
        to: ["lab@example.com"],
        reply_to: "support@example.com",
        template: { id: "eph-newsletter-welcome" },
      }),
    );
  });

  it("treats an already-existing contact as success and still sends welcome", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv(
      "MARKETING_EMAIL_FROM",
      "Elevate Precision Health <updates@example.com>",
    );

    const { client, create, send } = createClient({
      createResult: {
        data: null,
        error: {
          name: "validation_error",
          statusCode: 409,
          message: "Contact already exists",
        },
      },
    });

    await expect(
      subscribeToNewsletter("lab@example.com", { client }),
    ).resolves.toEqual({ email: "lab@example.com" });
    expect(create).toHaveBeenCalled();
    expect(send).toHaveBeenCalled();
  });

  it("throws NewsletterSubscribeError when contact create fails for other reasons", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv(
      "MARKETING_EMAIL_FROM",
      "Elevate Precision Health <updates@example.com>",
    );

    const { client } = createClient({
      createResult: {
        data: null,
        error: {
          name: "application_error",
          statusCode: 500,
          message: "boom",
        },
      },
    });

    await expect(
      subscribeToNewsletter("lab@example.com", { client }),
    ).rejects.toBeInstanceOf(NewsletterSubscribeError);
  });

  it("throws NewsletterSubscribeError when template send fails", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv(
      "MARKETING_EMAIL_FROM",
      "Elevate Precision Health <updates@example.com>",
    );

    const { client } = createClient({
      sendResult: {
        data: null,
        error: { message: "template not found" },
      },
    });

    await expect(
      subscribeToNewsletter("lab@example.com", { client }),
    ).rejects.toBeInstanceOf(NewsletterSubscribeError);
  });
});
