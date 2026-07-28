import type { OrderStore } from "@/lib/orders/types";
import { verifyBankfulTransaction } from "@/lib/payments/bankful";
import {
  verifyBankfulCallback,
  type VerifiedBankfulCallback,
} from "@/lib/payments/bankfulCallback";
import { toCents } from "@/lib/payments/money";
import type { PaymentEventStore } from "@/lib/payments/paymentEvents";
import {
  commitReservations,
  releaseReservations,
} from "@/lib/inventory/reservations";

export type IpnProcessResult = {
  status: number;
  body: Record<string, unknown>;
};

export type IpnDependencies = {
  getPassword: () => string;
  orderStore: OrderStore;
  paymentEvents: PaymentEventStore;
  enqueuePaid: (orderId: string) => Promise<void>;
  logSecurityEvent: (event: string, detail: Record<string, unknown>) => void;
  verifyTransaction?: typeof verifyBankfulTransaction;
  commitStock?: (orderId: string) => Promise<void>;
  releaseStock?: (orderId: string) => Promise<void>;
};

/**
 * Authenticated Bankful HPP IPN processing.
 * Never logs full payloads or secrets.
 */
export async function processBankfulIpn(
  fields: Record<string, string>,
  deps: IpnDependencies,
): Promise<IpnProcessResult> {
  const password = deps.getPassword();
  const verify = await Promise.resolve(
    verifyBankfulCallback(fields, password),
  );

  if (!verify.ok) {
    deps.logSecurityEvent("bankful_ipn_signature_rejected", {
      reason: verify.reason,
      orderIdHint: fields.XTL_ORDER_ID || fields.xtl_order_id || null,
    });

    try {
      await deps.paymentEvents.insert({
        provider: "bankful",
        providerEventId: null,
        orderId: fields.XTL_ORDER_ID || fields.xtl_order_id || null,
        eventType: "ipn",
        signatureValid: false,
        processingStatus: "rejected",
        payload: fields,
        errorMessage: verify.reason,
      });
    } catch (error) {
      deps.logSecurityEvent("bankful_ipn_event_persist_failed", {
        stage: "reject",
        message: error instanceof Error ? error.message : "unknown",
      });
    }

    const status =
      verify.reason === "missing_password" ? 503 : 401;
    return {
      status,
      body: { error: "Unauthorized callback." },
    };
  }

  const callback = verify.callback;
  const { event, duplicate } = await deps.paymentEvents.insert({
    provider: "bankful",
    providerEventId: callback.providerEventId,
    orderId: callback.orderId,
    transactionId: callback.transactionId,
    eventType: `ipn.${callback.status}`,
    signatureValid: true,
    processingStatus: "received",
    payload: fields,
  });

  if (
    duplicate ||
    event.processingStatus === "processed" ||
    event.processingStatus === "ignored_duplicate"
  ) {
    return {
      status: 200,
      body: { ok: true, duplicate: true },
    };
  }

  const existing = await deps.orderStore.get(callback.orderId);
  if (!existing) {
    await deps.paymentEvents.markProcessed(event.id, {
      processingStatus: "rejected",
      errorMessage: "unknown_order",
    });
    deps.logSecurityEvent("bankful_ipn_unknown_order", {
      orderId: callback.orderId,
      transactionId: callback.transactionId,
    });
    return { status: 404, body: { error: "Unknown order." } };
  }

  if (existing.paymentStatus === "approved") {
    if (callback.status === "approved") {
      await deps.paymentEvents.markProcessed(event.id, {
        processingStatus: "ignored_duplicate",
      });
      return { status: 200, body: { ok: true, duplicate: true } };
    }

    // Decline (or other) after approve: do not downgrade; flag for review.
    deps.logSecurityEvent("bankful_ipn_illegal_transition", {
      orderId: callback.orderId,
      from: existing.paymentStatus,
      callbackStatus: callback.status,
    });
    if (deps.orderStore.updateStatus) {
      await deps.orderStore.updateStatus(callback.orderId, {
        paymentStatus: "review_required",
      });
    }
    await deps.paymentEvents.markProcessed(event.id, {
      processingStatus: "processed",
      errorMessage: "decline_after_approve_flagged",
    });
    return {
      status: 200,
      body: { ok: true, reviewRequired: true },
    };
  }

  if (existing.paymentStatus === "declined" && callback.status === "declined") {
    await deps.paymentEvents.markProcessed(event.id, {
      processingStatus: "ignored_duplicate",
    });
    return { status: 200, body: { ok: true, duplicate: true } };
  }

  const verifyTxn =
    deps.verifyTransaction ?? verifyBankfulTransaction;
  const reconciliation = await verifyTxn({
    orderId: callback.orderId,
    transactionId: callback.transactionId,
    authenticatedCallback: callback,
  });

  if (!reconciliation.verified) {
    deps.logSecurityEvent("bankful_ipn_reconciliation_failed", {
      orderId: callback.orderId,
      message: reconciliation.message ?? "unverified",
    });
    if (deps.orderStore.updateStatus) {
      await deps.orderStore.updateStatus(callback.orderId, {
        paymentStatus: "review_required",
      });
    }
    await deps.paymentEvents.markProcessed(event.id, {
      processingStatus: "rejected",
      errorMessage: reconciliation.message ?? "reconciliation_failed",
    });
    return {
      status: 422,
      body: { error: "Payment could not be verified." },
    };
  }

  const expectedCents = toCents(existing.total);
  const actualCents = reconciliation.amountCents ?? callback.amountCents;
  const actualCurrency = (
    reconciliation.currency ?? callback.currency
  ).toUpperCase();

  if (actualCents !== expectedCents) {
    deps.logSecurityEvent("bankful_ipn_amount_mismatch", {
      orderId: callback.orderId,
      expectedCents,
      actualCents,
    });
    if (deps.orderStore.updateStatus) {
      await deps.orderStore.updateStatus(callback.orderId, {
        paymentStatus: "review_required",
      });
    }
    await deps.paymentEvents.markProcessed(event.id, {
      processingStatus: "rejected",
      errorMessage: "amount_mismatch",
    });
    return {
      status: 422,
      body: { error: "Payment amount mismatch." },
    };
  }

  if (actualCurrency !== existing.currency.toUpperCase()) {
    deps.logSecurityEvent("bankful_ipn_currency_mismatch", {
      orderId: callback.orderId,
      expected: existing.currency,
      actual: actualCurrency,
    });
    if (deps.orderStore.updateStatus) {
      await deps.orderStore.updateStatus(callback.orderId, {
        paymentStatus: "review_required",
      });
    }
    await deps.paymentEvents.markProcessed(event.id, {
      processingStatus: "rejected",
      errorMessage: "currency_mismatch",
    });
    return {
      status: 422,
      body: { error: "Payment currency mismatch." },
    };
  }

  const reconciledStatus = reconciliation.status;
  const commitStock = deps.commitStock ?? commitReservations;
  const releaseStock = deps.releaseStock ?? releaseReservations;

  if (reconciledStatus === "approved") {
    try {
      await commitStock(callback.orderId);
    } catch (error) {
      deps.logSecurityEvent("bankful_ipn_commit_stock_failed", {
        orderId: callback.orderId,
        message: error instanceof Error ? error.message : "unknown",
      });
      if (deps.orderStore.updateStatus) {
        await deps.orderStore.updateStatus(callback.orderId, {
          paymentStatus: "review_required",
          transactionId: callback.transactionId,
        });
      }
      await deps.paymentEvents.markProcessed(event.id, {
        processingStatus: "failed",
        errorMessage: "commit_stock_failed",
      });
      return {
        status: 409,
        body: { error: "Payment verified but inventory commit failed." },
      };
    }

    if (deps.orderStore.updateStatus) {
      await deps.orderStore.updateStatus(callback.orderId, {
        paymentStatus: "approved",
        transactionId: callback.transactionId,
      });
    }
    try {
      await deps.enqueuePaid(callback.orderId);
    } catch (error) {
      deps.logSecurityEvent("bankful_ipn_outbox_enqueue_failed", {
        orderId: callback.orderId,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
    await deps.paymentEvents.markProcessed(event.id, {
      processingStatus: "processed",
    });
    return { status: 200, body: { ok: true, approved: true } };
  }

  if (
    reconciledStatus === "declined" ||
    reconciledStatus === "cancelled"
  ) {
    await releaseStock(callback.orderId).catch((error) => {
      deps.logSecurityEvent("bankful_ipn_release_stock_failed", {
        orderId: callback.orderId,
        message: error instanceof Error ? error.message : "unknown",
      });
    });
    if (deps.orderStore.updateStatus) {
      await deps.orderStore.updateStatus(callback.orderId, {
        paymentStatus:
          reconciledStatus === "cancelled" ? "cancelled" : "declined",
        transactionId: callback.transactionId,
      });
    }
    await deps.paymentEvents.markProcessed(event.id, {
      processingStatus: "processed",
    });
    return { status: 200, body: { ok: true, approved: false } };
  }

  // Pending / unknown — acknowledge without side effects beyond event row.
  await deps.paymentEvents.markProcessed(event.id, {
    processingStatus: "processed",
    errorMessage: `status_${reconciledStatus}`,
  });
  return {
    status: 200,
    body: { ok: true, approved: false, pending: reconciledStatus === "pending" },
  };
}

/** Safe security logger — never include secrets or raw card data. */
export function logIpnSecurityEvent(
  event: string,
  detail: Record<string, unknown>,
): void {
  console.error(`[security] ${event}`, detail);
  if (
    event === "bankful_ipn_signature_rejected" ||
    event === "bankful_ipn_amount_mismatch"
  ) {
    void import("@/lib/security/alerts").then(({ alertCritical }) =>
      alertCritical(
        event === "bankful_ipn_signature_rejected"
          ? "ipn.signature_failure"
          : "ipn.amount_mismatch",
        detail ?? {},
      ),
    );
  }
}

export type { VerifiedBankfulCallback };
