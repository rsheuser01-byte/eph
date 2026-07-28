import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  outboxBackoffMinutes,
  type EmailDeliveryStore,
  type OutboxEventRecord,
  type OutboxInsert,
  type OutboxStore,
  type OutboxStatus,
} from "./types";

function defaultOutboxPath(): string {
  return (
    process.env.OUTBOX_EVENTS_FILE ??
    join(process.cwd(), ".data", "outbox_events.json")
  );
}

function defaultEmailPath(): string {
  return (
    process.env.EMAIL_DELIVERIES_FILE ??
    join(process.cwd(), ".data", "email_deliveries.json")
  );
}

type OutboxRow = {
  id: string;
  event_type: string;
  aggregate_id: string;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  attempts: number;
  next_attempt_at: string;
  last_error: string | null;
  created_at: string;
  completed_at: string | null;
};

function mapOutbox(row: OutboxRow): OutboxEventRecord {
  return {
    id: row.id,
    eventType: row.event_type,
    aggregateId: row.aggregate_id,
    payload: row.payload,
    status: row.status,
    attempts: row.attempts,
    nextAttemptAt: row.next_attempt_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeJsonArray<T>(filePath: string, rows: T[]): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");
}

export function createFileOutboxStore(
  filePath = defaultOutboxPath(),
): OutboxStore {
  return {
    name: "file",
    async enqueue(input) {
      const rows = await readJsonArray<OutboxEventRecord>(filePath);
      const existing = rows.find(
        (row) =>
          row.eventType === input.eventType &&
          row.aggregateId === input.aggregateId,
      );
      if (existing) {
        return { event: existing, duplicate: true };
      }
      const event: OutboxEventRecord = {
        id: crypto.randomUUID(),
        eventType: input.eventType,
        aggregateId: input.aggregateId,
        payload: input.payload,
        status: "pending",
        attempts: 0,
        nextAttemptAt: new Date().toISOString(),
        lastError: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
      };
      rows.push(event);
      await writeJsonArray(filePath, rows);
      return { event, duplicate: false };
    },
    async claimDue(limit = 20) {
      const rows = await readJsonArray<OutboxEventRecord>(filePath);
      const now = Date.now();
      const claimed: OutboxEventRecord[] = [];
      for (const row of rows) {
        if (claimed.length >= limit) break;
        if (
          row.status === "pending" &&
          new Date(row.nextAttemptAt).getTime() <= now
        ) {
          row.status = "processing";
          row.attempts += 1;
          claimed.push({ ...row });
        }
      }
      await writeJsonArray(filePath, rows);
      return claimed;
    },
    async markCompleted(id) {
      const rows = await readJsonArray<OutboxEventRecord>(filePath);
      const row = rows.find((item) => item.id === id);
      if (!row) return;
      row.status = "completed";
      row.completedAt = new Date().toISOString();
      row.lastError = null;
      await writeJsonArray(filePath, rows);
    },
    async markRetry(id, errorMessage, attempts) {
      const rows = await readJsonArray<OutboxEventRecord>(filePath);
      const row = rows.find((item) => item.id === id);
      if (!row) return;
      row.status = "pending";
      row.lastError = errorMessage;
      row.nextAttemptAt = new Date(
        Date.now() + outboxBackoffMinutes(attempts) * 60_000,
      ).toISOString();
      await writeJsonArray(filePath, rows);
    },
    async markFailed(id, errorMessage) {
      const rows = await readJsonArray<OutboxEventRecord>(filePath);
      const row = rows.find((item) => item.id === id);
      if (!row) return;
      row.status = "failed";
      row.lastError = errorMessage;
      row.completedAt = new Date().toISOString();
      await writeJsonArray(filePath, rows);
    },
  };
}

export function createSupabaseOutboxStore(client: SupabaseClient): OutboxStore {
  return {
    name: "supabase",
    async enqueue(input) {
      const { data, error } = await client
        .from("outbox_events")
        .insert({
          event_type: input.eventType,
          aggregate_id: input.aggregateId,
          payload: input.payload,
          status: "pending",
        })
        .select("*")
        .single();

      if (error) {
        if (error.code === "23505") {
          const { data: existing, error: findError } = await client
            .from("outbox_events")
            .select("*")
            .eq("event_type", input.eventType)
            .eq("aggregate_id", input.aggregateId)
            .maybeSingle();
          if (findError || !existing) {
            throw new Error(
              `Failed to enqueue outbox event: ${error.message}`,
            );
          }
          return { event: mapOutbox(existing as OutboxRow), duplicate: true };
        }
        throw new Error(`Failed to enqueue outbox event: ${error.message}`);
      }

      return { event: mapOutbox(data as OutboxRow), duplicate: false };
    },
    async claimDue(limit = 20) {
      const { data, error } = await client.rpc("claim_outbox_events", {
        p_limit: limit,
      });
      if (error) {
        throw new Error(`Failed to claim outbox events: ${error.message}`);
      }
      return ((data ?? []) as OutboxRow[]).map(mapOutbox);
    },
    async markCompleted(id) {
      const { error } = await client
        .from("outbox_events")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", id);
      if (error) {
        throw new Error(`Failed to complete outbox event: ${error.message}`);
      }
    },
    async markRetry(id, errorMessage, attempts) {
      const next = new Date(
        Date.now() + outboxBackoffMinutes(attempts) * 60_000,
      ).toISOString();
      const { error } = await client
        .from("outbox_events")
        .update({
          status: "pending",
          last_error: errorMessage,
          next_attempt_at: next,
        })
        .eq("id", id);
      if (error) {
        throw new Error(`Failed to retry outbox event: ${error.message}`);
      }
    },
    async markFailed(id, errorMessage) {
      const { error } = await client
        .from("outbox_events")
        .update({
          status: "failed",
          last_error: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) {
        throw new Error(`Failed to fail outbox event: ${error.message}`);
      }
    },
  };
}

export function createFileEmailDeliveryStore(
  filePath = defaultEmailPath(),
): EmailDeliveryStore {
  type Row = { eventType: string; orderId: string; recipient: string };
  return {
    name: "file",
    async claimDelivery(eventType, orderId, recipient) {
      const rows = await readJsonArray<Row>(filePath);
      const exists = rows.some(
        (row) =>
          row.eventType === eventType &&
          row.orderId === orderId &&
          row.recipient === recipient,
      );
      if (exists) {
        return false;
      }
      rows.push({ eventType, orderId, recipient });
      await writeJsonArray(filePath, rows);
      return true;
    },
  };
}

export function createSupabaseEmailDeliveryStore(
  client: SupabaseClient,
): EmailDeliveryStore {
  return {
    name: "supabase",
    async claimDelivery(eventType, orderId, recipient) {
      const { error } = await client.from("email_deliveries").insert({
        event_type: eventType,
        order_id: orderId,
        recipient,
      });
      if (error) {
        if (error.code === "23505") {
          return false;
        }
        throw new Error(`Failed to claim email delivery: ${error.message}`);
      }
      return true;
    },
  };
}

export function getOutboxStore(): OutboxStore {
  const store = (process.env.ORDER_STORE ?? "file").toLowerCase();
  if (store === "supabase") {
    return createSupabaseOutboxStore(getSupabaseAdmin());
  }
  return createFileOutboxStore();
}

export function getEmailDeliveryStore(): EmailDeliveryStore {
  const store = (process.env.ORDER_STORE ?? "file").toLowerCase();
  if (store === "supabase") {
    return createSupabaseEmailDeliveryStore(getSupabaseAdmin());
  }
  return createFileEmailDeliveryStore();
}
