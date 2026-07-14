import { createFileOrderStore } from "./fileStore";
import type { OrderStore } from "./types";

export function getOrderStore(): OrderStore {
  const store = (process.env.ORDER_STORE ?? "file").toLowerCase();
  switch (store) {
    case "file":
      return createFileOrderStore();
    default:
      throw new Error(`Unknown ORDER_STORE: ${store}`);
  }
}

export type { OrderRecord, OrderStore } from "./types";
