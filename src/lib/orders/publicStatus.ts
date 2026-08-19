import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { FulfillmentStatus, PaymentStatus } from "@/lib/orders/types";
import type { TrustpilotInvitation } from "@/lib/trustpilot/invitation";

export type PublicOrderStatus = {
  orderId: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  headline: string;
  message: string;
  /** True when the client should keep polling. */
  poll: boolean;
  /** Token-gated Trustpilot invite fields for the order owner after payment. */
  reviewInvitation?: TrustpilotInvitation;
};

export function generateLookupToken(): string {
  return randomBytes(32).toString("base64url");
}

export function lookupTokensEqual(
  expected: string | undefined,
  provided: string | undefined,
): boolean {
  if (!expected || !provided) {
    return false;
  }
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) {
    // Compare digests of unequal lengths to keep timing flatter.
    const ha = createHash("sha256").update(a).digest();
    const hb = createHash("sha256").update(b).digest();
    timingSafeEqual(ha, hb);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function publicStatusFromPayment(
  orderId: string,
  paymentStatus: PaymentStatus,
  fulfillmentStatus: FulfillmentStatus,
): PublicOrderStatus {
  switch (paymentStatus) {
    case "approved":
    case "partially_refunded":
    case "refunded": {
      if (paymentStatus === "approved" && fulfillmentStatus === "shipped") {
        return {
          orderId,
          paymentStatus,
          fulfillmentStatus,
          headline: "Order shipped",
          message:
            "Your order is on the way. Check your email for tracking details.",
          poll: false,
        };
      }
      if (paymentStatus === "approved" && fulfillmentStatus === "fulfilled") {
        return {
          orderId,
          paymentStatus,
          fulfillmentStatus,
          headline: "Order fulfilled",
          message: "Your order has been fulfilled.",
          poll: false,
        };
      }
      return {
        orderId,
        paymentStatus,
        fulfillmentStatus,
        headline: "Payment confirmed",
        message:
          paymentStatus === "approved"
            ? "Your payment was verified. A confirmation email will arrive shortly."
            : "Your payment was previously confirmed. Check your email for updates.",
        poll: false,
      };
    }
    case "pending":
      return {
        orderId,
        paymentStatus,
        fulfillmentStatus,
        headline: "Payment processing",
        message:
          "We have not confirmed payment yet. This page updates automatically.",
        poll: true,
      };
    case "review_required":
      return {
        orderId,
        paymentStatus,
        fulfillmentStatus,
        headline: "Order requires review",
        message:
          "Your order needs manual review. We will contact you at the email you provided.",
        poll: false,
      };
    case "declined":
    case "cancelled":
    case "expired":
      return {
        orderId,
        paymentStatus,
        fulfillmentStatus,
        headline: "Payment not completed",
        message:
          "No confirmed charge was recorded for this order. You can return to checkout and try again.",
        poll: false,
      };
    default:
      return {
        orderId,
        paymentStatus,
        fulfillmentStatus,
        headline: "Payment processing",
        message: "We are checking your payment status.",
        poll: true,
      };
  }
}
