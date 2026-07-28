import type { FulfillmentStatus, PaymentStatus } from "./types";

/**
 * Whether a payment status transition is allowed.
 * Illegal transitions should be flagged review_required rather than applied silently.
 */
export function canTransitionPayment(
  from: PaymentStatus,
  to: PaymentStatus,
): boolean {
  if (from === to) {
    return true;
  }

  switch (from) {
    case "pending":
      return (
        to === "approved" ||
        to === "declined" ||
        to === "cancelled" ||
        to === "expired" ||
        to === "review_required"
      );
    case "approved":
      return (
        to === "refunded" ||
        to === "partially_refunded" ||
        to === "review_required"
      );
    case "partially_refunded":
      return to === "refunded" || to === "partially_refunded" || to === "review_required";
    case "declined":
    case "cancelled":
    case "expired":
    case "refunded":
      return to === "review_required";
    case "review_required":
      return (
        to === "approved" ||
        to === "declined" ||
        to === "cancelled" ||
        to === "refunded"
      );
    default:
      return false;
  }
}

/** Shipping/fulfillment transitions for admin actions. */
export function canTransitionFulfillment(
  from: FulfillmentStatus,
  to: FulfillmentStatus,
): boolean {
  if (from === to) {
    return true;
  }
  switch (from) {
    case "unfulfilled":
      return (
        to === "processing" ||
        to === "shipped" ||
        to === "fulfilled" ||
        to === "cancelled"
      );
    case "processing":
      return to === "shipped" || to === "fulfilled" || to === "cancelled";
    case "shipped":
      return to === "fulfilled";
    case "fulfilled":
    case "cancelled":
      return false;
    default:
      return false;
  }
}
