import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { OrderRecord, OrderStatusUpdate, OrderStore } from "./types";

function defaultPath(): string {
  return process.env.ORDER_STORE_FILE ?? join(process.cwd(), ".data", "orders.json");
}

function normalize(record: OrderRecord): OrderRecord {
  const paymentStatus =
    record.paymentStatus ??
    (record.status === "approved" ? "approved" : (record.status as OrderRecord["paymentStatus"]));
  return {
    ...record,
    paymentStatus,
    fulfillmentStatus: record.fulfillmentStatus ?? "unfulfilled",
    refundedAmount: record.refundedAmount ?? 0,
    tax: record.tax ?? 0,
    status: paymentStatus,
  };
}

async function readAll(filePath: string): Promise<OrderRecord[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return (parsed as OrderRecord[]).map(normalize);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeAll(filePath: string, orders: OrderRecord[]): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(orders, null, 2), "utf8");
}

// JSON-file store: durable for local/dev and single-instance use. Prefer
// ORDER_STORE=supabase in production (ephemeral filesystem on serverless).
export function createFileOrderStore(filePath = defaultPath()): OrderStore {
  return {
    name: "file",
    async save(record: OrderRecord): Promise<void> {
      const orders = await readAll(filePath);
      const next = normalize(record);
      const index = orders.findIndex((order) => order.orderId === next.orderId);
      if (index >= 0) {
        orders[index] = next;
      } else {
        orders.push(next);
      }
      await writeAll(filePath, orders);
    },
    async list(): Promise<OrderRecord[]> {
      const orders = await readAll(filePath);
      return [...orders].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
    },
    async get(orderId: string): Promise<OrderRecord | null> {
      const orders = await readAll(filePath);
      return orders.find((order) => order.orderId === orderId) ?? null;
    },
    async updateStatus(
      orderId: string,
      patch: OrderStatusUpdate,
    ): Promise<OrderRecord | null> {
      const orders = await readAll(filePath);
      const index = orders.findIndex((order) => order.orderId === orderId);
      if (index < 0) {
        return null;
      }
      const current = orders[index];
      const paymentStatus = patch.paymentStatus ?? current.paymentStatus;
      const updated = normalize({
        ...current,
        paymentStatus,
        fulfillmentStatus:
          patch.fulfillmentStatus ?? current.fulfillmentStatus,
        transactionId: patch.transactionId ?? current.transactionId,
        refundedAmount: patch.refundedAmount ?? current.refundedAmount,
        reservationExpiresAt:
          patch.reservationExpiresAt ?? current.reservationExpiresAt,
        carrier:
          patch.carrier === null
            ? undefined
            : (patch.carrier ?? current.carrier),
        trackingNumber:
          patch.trackingNumber === null
            ? undefined
            : (patch.trackingNumber ?? current.trackingNumber),
        trackingUrl:
          patch.trackingUrl === null
            ? undefined
            : (patch.trackingUrl ?? current.trackingUrl),
        shippedAt:
          patch.shippedAt === null
            ? undefined
            : (patch.shippedAt ?? current.shippedAt),
        fulfilledAt:
          patch.fulfilledAt === null
            ? undefined
            : (patch.fulfilledAt ?? current.fulfilledAt),
        fulfillmentNotes:
          patch.fulfillmentNotes === null
            ? undefined
            : (patch.fulfillmentNotes ?? current.fulfillmentNotes),
        status: paymentStatus,
      });
      orders[index] = updated;
      await writeAll(filePath, orders);
      return updated;
    },
  };
}
