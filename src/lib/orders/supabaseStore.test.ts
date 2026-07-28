import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseOrderStore } from "./supabaseStore";
import type { OrderRecord } from "./types";

function makeOrder(orderId: string, createdAt: string): OrderRecord {
  return {
    orderId,
    createdAt,
    provider: "mock",
    transactionId: "tx_1",
    status: "approved",
    paymentStatus: "approved",
    fulfillmentStatus: "unfulfilled",
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
    refundedAmount: 0,
  };
}

type TableState = {
  orders: Array<Record<string, unknown>>;
  order_items: Array<Record<string, unknown>>;
};

function createMockClient(state: TableState) {
  return {
    from(table: "orders" | "order_items") {
      const api = {
        upsert: vi.fn(async (row: Record<string, unknown>) => {
          if (table === "orders") {
            const id = String(row.id);
            const index = state.orders.findIndex((item) => item.id === id);
            if (index >= 0) {
              state.orders[index] = row;
            } else {
              state.orders.push(row);
            }
          }
          return { error: null };
        }),
        insert: vi.fn(async (rows: Record<string, unknown> | Record<string, unknown>[]) => {
          const list = Array.isArray(rows) ? rows : [rows];
          if (table === "order_items") {
            state.order_items.push(...list);
          }
          return { error: null };
        }),
        delete: vi.fn(() => ({
          eq: vi.fn(async (_column: string, value: string) => {
            if (table === "order_items") {
              state.order_items = state.order_items.filter(
                (item) => item.order_id !== value,
              );
            }
            return { error: null };
          }),
        })),
        select: vi.fn(() => {
          const chain = {
            order: vi.fn(async () => ({
              data:
                table === "orders"
                  ? [...state.orders].sort((a, b) =>
                      String(b.created_at).localeCompare(String(a.created_at)),
                    )
                  : state.order_items,
              error: null,
            })),
            eq: vi.fn((column: string, value: string) => ({
              maybeSingle: vi.fn(async () => {
                const row = state.orders.find((item) => item[column] === value);
                return { data: row ?? null, error: null };
              }),
              then: undefined as unknown,
            })),
            in: vi.fn(async (_column: string, values: string[]) => ({
              data: state.order_items.filter((item) =>
                values.includes(String(item.order_id)),
              ),
              error: null,
            })),
            update: undefined as unknown,
          };

          // Support .select().eq(). for get items
          (chain.eq as ReturnType<typeof vi.fn>).mockImplementation(
            (column: string, value: string) => {
              const filtered =
                table === "orders"
                  ? state.orders.filter((item) => item[column] === value)
                  : state.order_items.filter((item) => item[column] === value);
              return {
                maybeSingle: async () => ({
                  data: filtered[0] ?? null,
                  error: null,
                }),
                // await select().eq() for items
                then: (
                  resolve: (value: { data: unknown; error: null }) => void,
                ) => resolve({ data: filtered, error: null }),
              };
            },
          );

          return chain;
        }),
        update: vi.fn((patch: Record<string, unknown>) => ({
          eq: vi.fn(async (column: string, value: string) => {
            const index = state.orders.findIndex((item) => item[column] === value);
            if (index >= 0) {
              state.orders[index] = { ...state.orders[index], ...patch };
            }
            return { error: null };
          }),
        })),
      };
      return api;
    },
  };
}

describe("supabase order store", () => {
  let state: TableState;

  beforeEach(() => {
    state = { orders: [], order_items: [] };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves and retrieves an order with items", async () => {
    const store = createSupabaseOrderStore(
      createMockClient(state) as never,
    );
    await store.save(makeOrder("EPH-1", "2026-01-01T00:00:00.000Z"));
    const saved = await store.get("EPH-1");
    expect(saved?.total).toBe(81.99);
    expect(saved?.items[0]?.sku).toBe("GLP-3-15MG");
    expect(saved?.paymentStatus).toBe("approved");
  });

  it("lists newest first", async () => {
    const store = createSupabaseOrderStore(
      createMockClient(state) as never,
    );
    await store.save(makeOrder("EPH-1", "2026-01-01T00:00:00.000Z"));
    await store.save(makeOrder("EPH-2", "2026-02-01T00:00:00.000Z"));
    const ids = (await store.list()).map((order) => order.orderId);
    expect(ids).toEqual(["EPH-2", "EPH-1"]);
  });

  it("updates payment and fulfillment status", async () => {
    const store = createSupabaseOrderStore(
      createMockClient(state) as never,
    );
    await store.save(makeOrder("EPH-1", "2026-01-01T00:00:00.000Z"));
    const updated = await store.updateStatus?.("EPH-1", {
      fulfillmentStatus: "fulfilled",
      paymentStatus: "refunded",
      refundedAmount: 81.99,
    });
    expect(updated?.fulfillmentStatus).toBe("fulfilled");
    expect(updated?.paymentStatus).toBe("refunded");
    expect(updated?.refundedAmount).toBe(81.99);
  });
});
