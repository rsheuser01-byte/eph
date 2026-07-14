import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { OrderRecord, OrderStore } from "./types";

function defaultPath(): string {
  return process.env.ORDER_STORE_FILE ?? join(process.cwd(), ".data", "orders.json");
}

async function readAll(filePath: string): Promise<OrderRecord[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OrderRecord[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

// JSON-file store: durable for local/dev and single-instance use. On serverless
// hosts the filesystem is ephemeral — see TODO.md for the production DB task.
export function createFileOrderStore(filePath = defaultPath()): OrderStore {
  return {
    name: "file",
    async save(record: OrderRecord): Promise<void> {
      await mkdir(dirname(filePath), { recursive: true });
      const orders = await readAll(filePath);
      orders.push(record);
      await writeFile(filePath, JSON.stringify(orders, null, 2), "utf8");
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
  };
}
