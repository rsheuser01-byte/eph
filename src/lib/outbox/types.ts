export type OutboxStatus = "pending" | "processing" | "completed" | "failed";

export type OutboxEventRecord = {
  id: string;
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  attempts: number;
  nextAttemptAt: string;
  lastError: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type OutboxInsert = {
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
};

export const ORDER_PAID_EVENT = "order.paid";
export const ORDER_SHIPPED_EVENT = "order.shipped";
export const ORDER_REFUNDED_EVENT = "order.refunded";
export const ORDER_CANCELLED_EVENT = "order.cancelled";
export const OUTBOX_MAX_ATTEMPTS = 5;

export function outboxBackoffMinutes(attempt: number): number {
  const schedule = [1, 5, 15, 60, 180];
  const index = Math.max(0, Math.min(attempt - 1, schedule.length - 1));
  return schedule[index];
}

export type OutboxStore = {
  readonly name: string;
  enqueue(
    input: OutboxInsert,
  ): Promise<{ event: OutboxEventRecord; duplicate: boolean }>;
  claimDue(limit?: number): Promise<OutboxEventRecord[]>;
  markCompleted(id: string): Promise<void>;
  markRetry(id: string, errorMessage: string, attempts: number): Promise<void>;
  markFailed(id: string, errorMessage: string): Promise<void>;
};

export type EmailDeliveryStore = {
  readonly name: string;
  /** Returns true if this is the first delivery (caller should send). */
  claimDelivery(
    eventType: string,
    orderId: string,
    recipient: string,
  ): Promise<boolean>;
  /** Clears prior delivery claims so an intentional resend can proceed. */
  clearDeliveries?(eventType: string, orderId: string): Promise<number>;
};
