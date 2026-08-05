import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetMemoryRateLimits } from "@/lib/security/rateLimit";
import { NewsletterWebhookConfigError } from "@/lib/newsletter/activepiecesWebhook";
import { POST } from "./route";

const sendNewsletterToActivepieces = vi.fn();

vi.mock("@/lib/newsletter/activepiecesWebhook", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/newsletter/activepiecesWebhook")
  >("@/lib/newsletter/activepiecesWebhook");
  return {
    ...actual,
    sendNewsletterToActivepieces: (...args: unknown[]) =>
      sendNewsletterToActivepieces(...args),
  };
});

describe("POST /api/newsletter", () => {
  beforeEach(() => {
    sendNewsletterToActivepieces.mockReset();
    sendNewsletterToActivepieces.mockResolvedValue({ status: 200 });
    resetMemoryRateLimits();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("forwards a valid signup to Activepieces and returns success", async () => {
    const response = await POST(
      new Request("http://localhost/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "lab@example.com", firstName: "" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: { email: "lab@example.com" },
      error: null,
    });
    expect(sendNewsletterToActivepieces).toHaveBeenCalledWith({
      email: "lab@example.com",
      firstName: "",
    });
  });

  it("rejects invalid email with 400", async () => {
    const response = await POST(
      new Request("http://localhost/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "bad" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(sendNewsletterToActivepieces).not.toHaveBeenCalled();
  });

  it("returns 503 when the webhook is not configured", async () => {
    sendNewsletterToActivepieces.mockRejectedValue(
      new NewsletterWebhookConfigError("missing"),
    );

    const response = await POST(
      new Request("http://localhost/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "lab@example.com" }),
      }),
    );

    expect(response.status).toBe(503);
    const json = (await response.json()) as { error: string };
    expect(json.error).toBeTruthy();
  });

  it("returns 502 when the webhook request fails", async () => {
    sendNewsletterToActivepieces.mockRejectedValue(new Error("boom"));

    const response = await POST(
      new Request("http://localhost/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "lab@example.com" }),
      }),
    );

    expect(response.status).toBe(502);
  });
});
