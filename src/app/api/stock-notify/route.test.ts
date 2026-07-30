import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetMemoryRateLimits } from "@/lib/security/rateLimit";
import { POST } from "./route";

const send = vi.fn();

vi.mock("@/lib/email", () => ({
  getEmailProvider: () => ({
    name: "mock",
    send,
  }),
}));

describe("POST /api/stock-notify", () => {
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue(undefined);
    resetMemoryRateLimits();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.elevateprecisionhealth.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a valid request and emails the store", async () => {
    const response = await POST(
      new Request("http://localhost/api/stock-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "lab@example.com",
          productSlug: "mt-2",
          sku: "MT2-10MG",
          size: "10mg",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      success: boolean;
      data: { email: string };
    };
    expect(json.success).toBe(true);
    expect(json.data.email).toBe("lab@example.com");
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      subject: expect.stringContaining("MT-2"),
      text: expect.stringContaining("lab@example.com"),
    });
  });

  it("rejects invalid payloads with 400", async () => {
    const response = await POST(
      new Request("http://localhost/api/stock-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "bad",
          productSlug: "mt-2",
          sku: "MT2-10MG",
          size: "10mg",
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
});
