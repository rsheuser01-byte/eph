import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { SavedCart, SavedCartStore } from "./types";
import { normalizeEmail } from "./email";

function defaultPath(): string {
  return (
    process.env.SAVED_CART_STORE_FILE ??
    join(process.cwd(), ".data", "saved-carts.json")
  );
}

async function readAll(filePath: string): Promise<SavedCart[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as SavedCart[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeAll(filePath: string, carts: SavedCart[]): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(carts, null, 2), "utf8");
}

function newestFirst(a: SavedCart, b: SavedCart): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function createFileSavedCartStore(
  filePath = defaultPath(),
): SavedCartStore {
  return {
    name: "file",

    async save(cart: SavedCart): Promise<void> {
      const carts = await readAll(filePath);
      const index = carts.findIndex((row) => row.id === cart.id);
      if (index >= 0) {
        carts[index] = cart;
      } else {
        carts.push(cart);
      }
      await writeAll(filePath, carts);
    },

    async getById(id: string): Promise<SavedCart | null> {
      const carts = await readAll(filePath);
      return carts.find((cart) => cart.id === id) ?? null;
    },

    async getByPublicId(publicId: string): Promise<SavedCart | null> {
      const carts = await readAll(filePath);
      return carts.find((cart) => cart.publicId === publicId) ?? null;
    },

    async getBySessionHash(hash: string): Promise<SavedCart | null> {
      const carts = await readAll(filePath);
      const nowMs = Date.now();
      const matches = carts.filter(
        (cart) =>
          cart.sessionIdHash === hash &&
          cart.status === "active" &&
          Date.parse(cart.expiresAt) > nowMs,
      );
      matches.sort(newestFirst);
      return matches[0] ?? null;
    },

    async getByRestoreToken(token: string): Promise<SavedCart | null> {
      const carts = await readAll(filePath);
      return carts.find((cart) => cart.restoreToken === token) ?? null;
    },

    async getByOrderId(orderId: string): Promise<SavedCart | null> {
      const carts = await readAll(filePath);
      return carts.find((cart) => cart.orderId === orderId) ?? null;
    },

    async findActiveByEmail(email: string): Promise<SavedCart | null> {
      const normalized = normalizeEmail(email);
      if (!normalized) {
        return null;
      }
      const carts = await readAll(filePath);
      const matches = carts.filter(
        (cart) =>
          cart.status === "active" &&
          cart.email !== null &&
          normalizeEmail(cart.email) === normalized,
      );
      matches.sort(newestFirst);
      return matches[0] ?? null;
    },

    async listRecent(limit = 100): Promise<SavedCart[]> {
      const carts = await readAll(filePath);
      return [...carts].sort(newestFirst).slice(0, limit);
    },

    async claimIdentifiedEvent(id: string, at: string): Promise<boolean> {
      const carts = await readAll(filePath);
      const cart = carts.find((row) => row.id === id);
      if (!cart || cart.identifiedEventSentAt) {
        return false;
      }
      cart.identifiedEventSentAt = at;
      cart.lastRecoveryEventAt = at;
      await writeAll(filePath, carts);
      return true;
    },

    async claimConvertedEvent(id: string, at: string): Promise<boolean> {
      const carts = await readAll(filePath);
      const cart = carts.find((row) => row.id === id);
      if (!cart || cart.convertedEventSentAt) {
        return false;
      }
      cart.convertedEventSentAt = at;
      cart.lastRecoveryEventAt = at;
      await writeAll(filePath, carts);
      return true;
    },
  };
}

export function newSavedCartId(): string {
  return randomUUID();
}
