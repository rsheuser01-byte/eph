/**
 * Pure in-memory inventory ledger for concurrent reservation semantics tests.
 * Mirrors production rule: available = on_hand − active reservations.
 */

export type LedgerSku = {
  onHand: number;
  reserved: number;
};

export type Ledger = Record<string, LedgerSku>;

export function availableQty(sku: LedgerSku): number {
  return Math.max(0, sku.onHand - sku.reserved);
}

export function tryReserve(
  ledger: Ledger,
  sku: string,
  qty: number,
): { ok: true; ledger: Ledger } | { ok: false; reason: string } {
  if (qty <= 0) {
    return { ok: false, reason: "invalid_qty" };
  }
  const current = ledger[sku] ?? { onHand: 0, reserved: 0 };
  if (availableQty(current) < qty) {
    return { ok: false, reason: "insufficient_stock" };
  }
  return {
    ok: true,
    ledger: {
      ...ledger,
      [sku]: {
        onHand: current.onHand,
        reserved: current.reserved + qty,
      },
    },
  };
}

export function commitReservation(
  ledger: Ledger,
  sku: string,
  qty: number,
): Ledger {
  const current = ledger[sku] ?? { onHand: 0, reserved: 0 };
  return {
    ...ledger,
    [sku]: {
      onHand: Math.max(0, current.onHand - qty),
      reserved: Math.max(0, current.reserved - qty),
    },
  };
}

export function releaseReservation(
  ledger: Ledger,
  sku: string,
  qty: number,
): Ledger {
  const current = ledger[sku] ?? { onHand: 0, reserved: 0 };
  return {
    ...ledger,
    [sku]: {
      onHand: current.onHand,
      reserved: Math.max(0, current.reserved - qty),
    },
  };
}
