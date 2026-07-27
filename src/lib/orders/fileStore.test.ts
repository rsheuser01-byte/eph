import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFileOrderStore } from "./fileStore";
import type { OrderRecord } from "./types";

function makeOrder(orderId: string, createdAt: string): OrderRecord {
  return {
    orderId,
    createdAt,
    provider: "mock",
    transactionId: "tx_1",
    status: "approved",
    items: [
      { sku: "GLP-3-15MG", name: "GLP-3", size: "15mg", qty: 1, unitPrice: 69.99 },
    ],
    subtotal: 69.99,
    shipping: 12,
    total: 81.99,
    currency: "USD",
    customer: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "[email protected]",
      address1: "1 Lab St",
      city: "Denver",
      state: "CO",
      zip: "80014",
      country: "US",
    },
  };
}

let dir: string;
let filePath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "orders-"));
  filePath = join(dir, "orders.json");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("file order store", () => {
  it("returns an empty list before any orders are saved", async () => {
    const store = createFileOrderStore(filePath);
    expect(await store.list()).toEqual([]);
  });

  it("saves and retrieves an order by id", async () => {
    const store = createFileOrderStore(filePath);
    await store.save(makeOrder("EPH-1", "2026-01-01T00:00:00.000Z"));
    expect((await store.get("EPH-1"))?.total).toBe(81.99);
    expect(await store.get("missing")).toBeNull();
  });

  it("lists orders newest first", async () => {
    const store = createFileOrderStore(filePath);
    await store.save(makeOrder("EPH-1", "2026-01-01T00:00:00.000Z"));
    await store.save(makeOrder("EPH-2", "2026-02-01T00:00:00.000Z"));
    const ids = (await store.list()).map((order) => order.orderId);
    expect(ids).toEqual(["EPH-2", "EPH-1"]);
  });

  it("does not persist card data (records carry no card field)", async () => {
    const store = createFileOrderStore(filePath);
    const record = makeOrder("EPH-1", "2026-01-01T00:00:00.000Z");
    await store.save(record);
    const saved = await store.get("EPH-1");
    expect(saved).not.toHaveProperty("card");
  });
});
