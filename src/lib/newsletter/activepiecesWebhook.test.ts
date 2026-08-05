import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NewsletterWebhookConfigError,
  NewsletterWebhookRequestError,
  sendNewsletterToActivepieces,
} from "./activepiecesWebhook";

describe("sendNewsletterToActivepieces", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("throws when ACTIVEPIECES_NEWSLETTER_WEBHOOK is missing", async () => {
    vi.stubEnv("ACTIVEPIECES_NEWSLETTER_WEBHOOK", "");
    await expect(
      sendNewsletterToActivepieces({
        email: "lab@example.com",
        firstName: "",
      }),
    ).rejects.toBeInstanceOf(NewsletterWebhookConfigError);
  });

  it("POSTs the newsletter payload to the webhook URL", async () => {
    vi.stubEnv(
      "ACTIVEPIECES_NEWSLETTER_WEBHOOK",
      "https://hooks.example.test/newsletter",
    );
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    await sendNewsletterToActivepieces({
      email: "lab@example.com",
      firstName: "Alex",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://hooks.example.test/newsletter",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "lab@example.com",
          firstName: "Alex",
          source: "website_newsletter",
        }),
      }),
    );
  });

  it("throws NewsletterWebhookRequestError when the webhook returns non-OK", async () => {
    vi.stubEnv(
      "ACTIVEPIECES_NEWSLETTER_WEBHOOK",
      "https://hooks.example.test/newsletter",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502 }),
    );

    await expect(
      sendNewsletterToActivepieces({
        email: "lab@example.com",
        firstName: "",
      }),
    ).rejects.toBeInstanceOf(NewsletterWebhookRequestError);
  });
});
