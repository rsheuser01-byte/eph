import { verifyBankfulTransaction } from "@/lib/payments/bankful";
import type { OrderStore } from "@/lib/orders/types";
import { enqueueOrderPaid } from "@/lib/outbox/enqueue";
import {
  commitReservations,
  expireReservations,
  listExpiredReservationOrderIds,
} from "./reservations";

export type ExpireReservationsResult = {
  expired: number;
  committed: number;
  skipped: number;
  failed: number;
  orderIds: string[];
};

export type ExpireReservationsDeps = {
  orderStore: OrderStore;
  listExpiredOrderIds?: (limit: number) => Promise<string[]>;
  commit?: (orderId: string) => Promise<void>;
  expire?: (orderId: string) => Promise<void>;
  release?: (orderId: string) => Promise<void>;
  enqueuePaid?: (orderId: string) => Promise<void>;
  verifyPayment?: typeof verifyBankfulTransaction;
  log?: (message: string, detail?: Record<string, unknown>) => void;
  batchSize?: number;
};

/**
 * Expire stale checkout reservations.
 * Fail closed: if a pending order has a transaction id and STATUS lookup is
 * not configured, skip expiration rather than risk releasing a paid order.
 */
export async function processExpiredReservations(
  deps: ExpireReservationsDeps,
): Promise<ExpireReservationsResult> {
  const list = deps.listExpiredOrderIds ?? listExpiredReservationOrderIds;
  const commit = deps.commit ?? commitReservations;
  const expire = deps.expire ?? expireReservations;
  const enqueuePaid = deps.enqueuePaid ?? enqueueOrderPaid;
  const verify = deps.verifyPayment ?? verifyBankfulTransaction;
  const log = deps.log ?? ((message, detail) => console.error(message, detail));
  const batchSize = deps.batchSize ?? 50;

  const result: ExpireReservationsResult = {
    expired: 0,
    committed: 0,
    skipped: 0,
    failed: 0,
    orderIds: [],
  };

  let orderIds: string[];
  try {
    orderIds = await list(batchSize);
  } catch (error) {
    log("expire_reservations_list_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    result.failed += 1;
    return result;
  }

  for (const orderId of orderIds) {
    result.orderIds.push(orderId);
    try {
      const order = await deps.orderStore.get(orderId);

      if (!order) {
        await expire(orderId);
        result.expired += 1;
        continue;
      }

      if (order.paymentStatus === "approved") {
        await commit(orderId);
        await enqueuePaid(orderId).catch((error) => {
          log("expire_reservations_outbox_failed", {
            orderId,
            message: error instanceof Error ? error.message : "unknown",
          });
        });
        result.committed += 1;
        continue;
      }

      if (
        order.paymentStatus === "declined" ||
        order.paymentStatus === "cancelled" ||
        order.paymentStatus === "expired"
      ) {
        // Terminal non-paid: drop any leftover active rows.
        await expire(orderId);
        result.expired += 1;
        continue;
      }

      if (order.paymentStatus === "pending") {
        if (order.transactionId) {
          const statusType =
            process.env.BANKFUL_STATUS_TRANSACTION_TYPE?.trim() ?? "";
          if (!statusType) {
            log("expire_reservations_skipped_no_status_api", { orderId });
            result.skipped += 1;
            continue;
          }

          const verified = await verify({
            orderId,
            transactionId: order.transactionId,
          });

          if (verified.verified && verified.status === "approved") {
            if (deps.orderStore.updateStatus) {
              await deps.orderStore.updateStatus(orderId, {
                paymentStatus: "approved",
                transactionId: order.transactionId,
              });
            }
            await commit(orderId);
            await enqueuePaid(orderId).catch((error) => {
              log("expire_reservations_outbox_failed", {
                orderId,
                message: error instanceof Error ? error.message : "unknown",
              });
            });
            result.committed += 1;
            continue;
          }
        }

        if (deps.orderStore.updateStatus) {
          await deps.orderStore.updateStatus(orderId, {
            paymentStatus: "expired",
          });
        }
        await expire(orderId);
        result.expired += 1;
        continue;
      }

      // review_required / refunded / etc. — do not auto-expire stock.
      result.skipped += 1;
    } catch (error) {
      log("expire_reservations_order_failed", {
        orderId,
        message: error instanceof Error ? error.message : "unknown",
      });
      result.failed += 1;
    }
  }

  return result;
}
