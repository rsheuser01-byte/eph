import { beforeEach, describe, expect, it, vi } from "vitest";

const enqueue = vi.hoisted(() => vi.fn());
const processOutbox = vi.hoisted(() => vi.fn());

vi.mock("./store", () => ({
  getOutboxStore: () => ({ enqueue }),
}));

vi.mock("./processOutbox", () => ({
  processOutbox: (...args: unknown[]) => processOutbox(...args),
}));

import {
  enqueueOrderCancelled,
  enqueueOrderPaid,
  enqueueOrderRefunded,
  enqueueOrderShipped,
} from "./enqueue";

describe("enqueue outbox flush", () => {
  beforeEach(() => {
    enqueue.mockReset().mockResolvedValue({ duplicate: false });
    processOutbox.mockReset().mockResolvedValue({
      processed: 1,
      completed: 1,
      retried: 0,
      failed: 0,
    });
  });

  it("sends confirmation immediately after enqueueing order.paid", async () => {
    await enqueueOrderPaid("EPH-1");
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "order.paid",
        aggregateId: "EPH-1",
      }),
    );
    expect(processOutbox).toHaveBeenCalledTimes(1);
  });

  it("does not fail the caller when immediate send fails", async () => {
    processOutbox.mockRejectedValueOnce(new Error("resend down"));
    await expect(enqueueOrderPaid("EPH-1")).resolves.toBeUndefined();
    expect(enqueue).toHaveBeenCalled();
  });

  it("flushes shipped, refunded, and cancelled the same way", async () => {
    await enqueueOrderShipped("EPH-1");
    await enqueueOrderRefunded("EPH-1", 10, 10, false);
    await enqueueOrderCancelled("EPH-1");
    expect(processOutbox).toHaveBeenCalledTimes(3);
  });
});
