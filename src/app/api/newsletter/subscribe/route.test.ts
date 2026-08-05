import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetMemoryRateLimits } from "@/lib/security/rateLimit";
import { NewsletterConfigError } from "@/lib/newsletter/subscribe";
import { POST } from "./route";

const subscribeToNewsletter = vi.fn();

vi.mock("@/lib/newsletter/subscribe", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/newsletter/subscribe")
  >("@/lib/newsletter/subscribe");
  return {
    ...actual,
    subscribeToNewsletter: (...args: unknown[]) =>
      subscribeToNewsletter(...args),
  };
});

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    subscribeToNewsletter.mockReset();
    subscribeToNewsletter.mockResolvedValue({ email: "lab@example.com" });
    resetMemoryRateLimits();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a valid email and returns success envelope", async () => {
    const response = await POST(
      new Request("http://localhost/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "lab@example.com" }),
      }),
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      success: boolean;
      data: { email: string };
      error: null;
    };
    expect(json).toEqual({
      success: true,
      data: { email: "lab@example.com" },
      error: null,
    });
    expect(subscribeToNewsletter).toHaveBeenCalledWith("lab@example.com");
  });

  it("rejects invalid payloads with 400", async () => {
    const response = await POST(
      new Request("http://localhost/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "bad" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(subscribeToNewsletter).not.toHaveBeenCalled();
  });

  it("returns 503 when newsletter is not configured", async () => {
    subscribeToNewsletter.mockRejectedValue(
      new NewsletterConfigError("not configured"),
    );

    const response = await POST(
      new Request("http://localhost/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "lab@example.com" }),
      }),
    );

    expect(response.status).toBe(503);
    const json = (await response.json()) as { error: string };
    expect(json.error).toMatch(/not available|try again|support/i);
  });

  it("returns 502 when Resend subscribe fails", async () => {
    subscribeToNewsletter.mockRejectedValue(new Error("send failed"));

    const response = await POST(
      new Request("http://localhost/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "lab@example.com" }),
      }),
    );

    expect(response.status).toBe(502);
  });
});
