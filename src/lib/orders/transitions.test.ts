import { describe, expect, it } from "vitest";
import {
  canTransitionFulfillment,
  canTransitionPayment,
} from "./transitions";

describe("canTransitionPayment", () => {
  it("allows pending to approved/declined/expired", () => {
    expect(canTransitionPayment("pending", "approved")).toBe(true);
    expect(canTransitionPayment("pending", "declined")).toBe(true);
    expect(canTransitionPayment("pending", "expired")).toBe(true);
  });

  it("blocks silently downgrading approved to declined", () => {
    expect(canTransitionPayment("approved", "declined")).toBe(false);
    expect(canTransitionPayment("approved", "review_required")).toBe(true);
  });

  it("allows refund progression from approved", () => {
    expect(canTransitionPayment("approved", "partially_refunded")).toBe(true);
    expect(canTransitionPayment("partially_refunded", "refunded")).toBe(true);
  });
});

describe("canTransitionFulfillment", () => {
  it("allows unfulfilled to shipped/fulfilled/cancelled", () => {
    expect(canTransitionFulfillment("unfulfilled", "shipped")).toBe(true);
    expect(canTransitionFulfillment("unfulfilled", "fulfilled")).toBe(true);
    expect(canTransitionFulfillment("unfulfilled", "cancelled")).toBe(true);
  });

  it("does not reopen fulfilled or cancelled orders", () => {
    expect(canTransitionFulfillment("fulfilled", "unfulfilled")).toBe(false);
    expect(canTransitionFulfillment("cancelled", "shipped")).toBe(false);
  });
});
