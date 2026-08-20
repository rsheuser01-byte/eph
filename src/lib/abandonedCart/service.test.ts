import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFileSavedCartStore } from "./fileStore";
import {
  convertSavedCartForOrder,
  getAbandonedCartEmailData,
  getAbandonedCartStatus,
  identifySavedCart,
  restoreSavedCart,
  upsertSavedCart,
} from "./service";
import { hashToken } from "./token";
import { SAVED_CART_TTL_MS } from "./constants";
import type { SavedCartStore } from "./types";

let dir: string;
let store: SavedCartStore;
const sendWebhook = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "saved-carts-"));
  store = createFileSavedCartStore(join(dir, "saved-carts.json"));
  sendWebhook.mockClear();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.elevateprecisionhealth.com");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

const glpLine = { slug: "glp-3", size: "15mg" as const, qty: 1 };

describe("saved cart upsert", () => {
  it("creates a server-side cart when the first product is added", async () => {
    const result = await upsertSavedCart(undefined, [glpLine], {
      store,
      sendWebhook,
    });
    expect(result.cart.items).toHaveLength(1);
    expect(result.cart.items[0].slug).toBe("glp-3");
    expect(result.cart.status).toBe("active");
    expect(result.sessionToken.length).toBeGreaterThan(20);
    expect(result.cart.sessionIdHash).toBe(hashToken(result.sessionToken));
    expect(result.webhookSent).toBe(false);
  });

  it("updates quantity on the same saved cart", async () => {
    const first = await upsertSavedCart(undefined, [glpLine], {
      store,
      sendWebhook,
    });
    const second = await upsertSavedCart(
      first.sessionToken,
      [{ ...glpLine, qty: 3 }],
      { store, sendWebhook },
    );
    expect(second.cart.id).toBe(first.cart.id);
    expect(second.cart.items[0].quantity).toBe(3);
  });

  it("updates the cart when products are removed", async () => {
    const first = await upsertSavedCart(
      undefined,
      [glpLine, { slug: "nad", size: "100mg", qty: 1 }],
      { store, sendWebhook },
    );
    const second = await upsertSavedCart(first.sessionToken, [glpLine], {
      store,
      sendWebhook,
    });
    expect(second.cart.items).toHaveLength(1);
    expect(second.cart.items[0].slug).toBe("glp-3");
  });
});

describe("email identification", () => {
  it("does not identify the cart for an invalid email (caller must validate)", async () => {
    const created = await upsertSavedCart(undefined, [glpLine], {
      store,
      sendWebhook,
    });
    expect(created.cart.email).toBeNull();
    expect(sendWebhook).not.toHaveBeenCalled();
  });

  it("identifies a cart with a valid email and fires the webhook once", async () => {
    const created = await upsertSavedCart(undefined, [glpLine], {
      store,
      sendWebhook,
    });
    const identified = await identifySavedCart(
      created.sessionToken,
      "ada@example.com",
      "Ada",
      [glpLine],
      { store, sendWebhook },
    );
    expect(identified.cart.email).toBe("ada@example.com");
    expect(identified.cart.firstName).toBe("Ada");
    expect(identified.cart.identifiedAt).toBeTruthy();
    expect(identified.webhookSent).toBe(true);
    expect(sendWebhook).toHaveBeenCalledTimes(1);
    expect(sendWebhook.mock.calls[0][0]).toMatchObject({
      event: "checkout_identified",
      email: "ada@example.com",
      idempotencyKey: `abandoned-cart:${identified.cart.publicId}`,
    });

    const again = await identifySavedCart(
      created.sessionToken,
      "ada@example.com",
      "Ada",
      [{ ...glpLine, qty: 2 }],
      { store, sendWebhook },
    );
    expect(again.webhookSent).toBe(false);
    expect(sendWebhook).toHaveBeenCalledTimes(1);
    expect(again.cart.items[0].quantity).toBe(2);
  });
});

describe("restore", () => {
  it("restores a valid token to current catalog lines", async () => {
    const created = await upsertSavedCart(undefined, [glpLine], {
      store,
      sendWebhook,
    });
    const result = await restoreSavedCart(created.cart.restoreToken, { store });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lines).toEqual([glpLine]);
      expect(result.droppedCount).toBe(0);
    }
  });

  it("rejects an invalid token", async () => {
    const result = await restoreSavedCart("not-a-real-token", { store });
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects an expired token", async () => {
    const created = await upsertSavedCart(undefined, [glpLine], {
      store,
      sendWebhook,
      nowMs: Date.now() - SAVED_CART_TTL_MS - 1_000,
    });
    const result = await restoreSavedCart(created.cart.restoreToken, {
      store,
      nowMs: Date.now(),
    });
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("drops unavailable products while restoring the rest", async () => {
    const created = await upsertSavedCart(undefined, [glpLine], {
      store,
      sendWebhook,
    });
    const cart = (await store.getById(created.cart.id))!;
    await store.save({
      ...cart,
      items: [
        ...cart.items,
        {
          slug: "retired-peptide",
          size: "10mg",
          sku: "RETIRED",
          name: "Retired",
          quantity: 1,
          unitPrice: 10,
          imageUrl: "",
        },
      ],
    });
    const result = await restoreSavedCart(created.cart.restoreToken, { store });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lines).toEqual([glpLine]);
      expect(result.droppedCount).toBe(1);
    }
  });
});

describe("conversion", () => {
  it("marks the associated cart converted and is safe to call twice", async () => {
    const created = await upsertSavedCart(undefined, [glpLine], {
      store,
      sendWebhook,
    });
    await identifySavedCart(
      created.sessionToken,
      "ada@example.com",
      "Ada",
      [glpLine],
      { store, sendWebhook },
    );
    sendWebhook.mockClear();

    const converted = await convertSavedCartForOrder("EPH-1", "ada@example.com", {
      store,
      sendWebhook,
    });
    expect(converted?.status).toBe("converted");
    expect(converted?.orderId).toBe("EPH-1");
    expect(sendWebhook).toHaveBeenCalledWith(
      expect.objectContaining({ event: "cart_converted", orderId: "EPH-1" }),
    );

    const again = await convertSavedCartForOrder("EPH-1", "ada@example.com", {
      store,
      sendWebhook,
    });
    expect(again?.status).toBe("converted");
    expect(sendWebhook).toHaveBeenCalledTimes(1);

    const status = await getAbandonedCartStatus(created.cart.publicId, { store });
    expect(status).toEqual({
      status: "converted",
      converted: true,
      expired: false,
      canEmail: false,
    });
  });
});

describe("email data", () => {
  it("returns current cart fields for Activepieces", async () => {
    const created = await upsertSavedCart(undefined, [glpLine], {
      store,
      sendWebhook,
    });
    await identifySavedCart(
      created.sessionToken,
      "ada@example.com",
      "Ada",
      [glpLine],
      { store, sendWebhook },
    );
    const data = await getAbandonedCartEmailData(created.cart.publicId, {
      store,
    });
    expect(data?.email).toBe("ada@example.com");
    expect(data?.restoreUrl).toContain("/cart/restore/");
    expect(data?.restoreUrl).not.toContain("ada@example.com");
    expect(data?.items[0].name).toBe("GLP-3 (Retatrutide)");
  });
});
