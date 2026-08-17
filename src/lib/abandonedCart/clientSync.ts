"use client";

import { isValidEmail } from "@/lib/abandonedCart/email";
import type { CartLineInput } from "@/lib/abandonedCart/types";

const SYNC_DEBOUNCE_MS = 400;
const IDENTIFY_DEBOUNCE_MS = 750;

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let identifyTimer: ReturnType<typeof setTimeout> | null = null;

function postJson(url: string, body: unknown): void {
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

export function scheduleAbandonedCartSync(items: CartLineInput[]): void {
  if (typeof window === "undefined") {
    return;
  }
  if (syncTimer) {
    clearTimeout(syncTimer);
  }
  syncTimer = setTimeout(() => {
    syncTimer = null;
    postJson("/api/abandoned-cart", { items });
  }, SYNC_DEBOUNCE_MS);
}

export function scheduleAbandonedCartIdentify(
  email: string,
  firstName: string,
  items: CartLineInput[],
): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!isValidEmail(email)) {
    return;
  }
  if (identifyTimer) {
    clearTimeout(identifyTimer);
  }
  identifyTimer = setTimeout(() => {
    identifyTimer = null;
    postJson("/api/abandoned-cart/identify", {
      email,
      firstName,
      items,
    });
  }, IDENTIFY_DEBOUNCE_MS);
}

export function identifyAbandonedCartNow(
  email: string,
  firstName: string,
  items: CartLineInput[],
): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!isValidEmail(email)) {
    return;
  }
  if (identifyTimer) {
    clearTimeout(identifyTimer);
    identifyTimer = null;
  }
  postJson("/api/abandoned-cart/identify", { email, firstName, items });
}
