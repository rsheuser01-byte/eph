import { describe, expect, it } from "vitest";
import {
  availableQty,
  commitReservation,
  releaseReservation,
  tryReserve,
  type Ledger,
} from "./memoryLedger";
import { reservationExpiresAt, reservationMinutes } from "./reservations";

describe("memoryLedger concurrent final unit", () => {
  it("allows only one of two concurrent reservations for the last unit", () => {
    let ledger: Ledger = { "SKU-1": { onHand: 1, reserved: 0 } };

    const first = tryReserve(ledger, "SKU-1", 1);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    ledger = first.ledger;

    const second = tryReserve(ledger, "SKU-1", 1);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.reason).toBe("insufficient_stock");
    expect(availableQty(ledger["SKU-1"])).toBe(0);
  });

  it("commits stock once then release restores availability after decline path", () => {
    let ledger: Ledger = { "SKU-1": { onHand: 2, reserved: 0 } };
    const reserved = tryReserve(ledger, "SKU-1", 1);
    expect(reserved.ok).toBe(true);
    if (!reserved.ok) return;
    ledger = reserved.ledger;

    ledger = commitReservation(ledger, "SKU-1", 1);
    expect(ledger["SKU-1"]).toEqual({ onHand: 1, reserved: 0 });

    const again = tryReserve(ledger, "SKU-1", 1);
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    ledger = again.ledger;
    ledger = releaseReservation(ledger, "SKU-1", 1);
    expect(availableQty(ledger["SKU-1"])).toBe(1);
  });
});

describe("reservationExpiresAt", () => {
  it("defaults to 30 minutes", () => {
    expect(reservationMinutes()).toBe(30);
    const now = new Date("2026-01-01T00:00:00.000Z");
    expect(reservationExpiresAt(now).toISOString()).toBe(
      "2026-01-01T00:30:00.000Z",
    );
  });
});
