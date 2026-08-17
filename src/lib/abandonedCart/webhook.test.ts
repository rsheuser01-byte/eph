import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  abandonedCartWebhookConfigured,
  sendAbandonedCartWebhook,
} from "./webhook";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("abandoned cart webhook", () => {
  beforeEach(() => {
    vi.stubEnv("ACTIVEPIECES_ABANDONED_CART_WEBHOOK_URL", "");
  });

  it("skips when the webhook URL is unset", async () => {
    expect(abandonedCartWebhookConfigured()).toBe(false);
    await expect(
      sendAbandonedCartWebhook({ event: "checkout_identified" }),
    ).resolves.toEqual({ ok: true, skipped: true });
  });

  it("POSTs JSON to the configured URL", async () => {
    vi.stubEnv(
      "ACTIVEPIECES_ABANDONED_CART_WEBHOOK_URL",
      "https://hooks.example.test/abandoned",
    );
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sendAbandonedCartWebhook({ event: "checkout_identified", cartId: "pub" }),
    ).resolves.toEqual({ ok: true, skipped: false, status: 200 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://hooks.example.test/abandoned");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      event: "checkout_identified",
      cartId: "pub",
    });
  });
});
