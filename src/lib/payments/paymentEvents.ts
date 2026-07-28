import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type PaymentEventProcessingStatus =
  | "received"
  | "processed"
  | "ignored_duplicate"
  | "rejected"
  | "failed";

export type PaymentEventRecord = {
  id: string;
  provider: string;
  providerEventId: string | null;
  orderId: string | null;
  transactionId: string | null;
  eventType: string;
  signatureValid: boolean;
  processingStatus: PaymentEventProcessingStatus;
  payload: Record<string, string>;
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
};

export type PaymentEventInsert = {
  provider: string;
  providerEventId?: string | null;
  orderId?: string | null;
  transactionId?: string | null;
  eventType: string;
  signatureValid: boolean;
  processingStatus?: PaymentEventProcessingStatus;
  payload: Record<string, string>;
  errorMessage?: string | null;
};

export interface PaymentEventStore {
  readonly name: string;
  findByProviderEventId(
    provider: string,
    providerEventId: string,
  ): Promise<PaymentEventRecord | null>;
  insert(
    input: PaymentEventInsert,
  ): Promise<{ event: PaymentEventRecord; duplicate: boolean }>;
  markProcessed(
    id: string,
    patch: {
      processingStatus: PaymentEventProcessingStatus;
      errorMessage?: string | null;
    },
  ): Promise<void>;
}

function defaultFilePath(): string {
  return (
    process.env.PAYMENT_EVENTS_FILE ??
    join(process.cwd(), ".data", "payment_events.json")
  );
}

/** Strip card-like keys before persistence. Never store PAN/CVV. */
export function sanitizePaymentPayload(
  payload: Record<string, string>,
): Record<string, string> {
  const blocked = new Set([
    "pmt_numb",
    "pmt_key",
    "card_number",
    "cvv",
    "cvc",
    "req_password",
  ]);
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([key]) => !blocked.has(key.toLowerCase()),
    ),
  );
}

export function createFilePaymentEventStore(
  filePath = defaultFilePath(),
): PaymentEventStore {
  async function readAll(): Promise<PaymentEventRecord[]> {
    try {
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as PaymentEventRecord[]) : [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async function writeAll(rows: PaymentEventRecord[]): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");
  }

  return {
    name: "file",
    async findByProviderEventId(provider, providerEventId) {
      const rows = await readAll();
      return (
        rows.find(
          (row) =>
            row.provider === provider &&
            row.providerEventId === providerEventId,
        ) ?? null
      );
    },
    async insert(input) {
      const rows = await readAll();
      if (input.providerEventId) {
        const existing = rows.find(
          (row) =>
            row.provider === input.provider &&
            row.providerEventId === input.providerEventId,
        );
        if (existing) {
          return { event: existing, duplicate: true };
        }
      }
      const event: PaymentEventRecord = {
        id: crypto.randomUUID(),
        provider: input.provider,
        providerEventId: input.providerEventId ?? null,
        orderId: input.orderId ?? null,
        transactionId: input.transactionId ?? null,
        eventType: input.eventType,
        signatureValid: input.signatureValid,
        processingStatus: input.processingStatus ?? "received",
        payload: sanitizePaymentPayload(input.payload),
        errorMessage: input.errorMessage ?? null,
        createdAt: new Date().toISOString(),
        processedAt: null,
      };
      rows.push(event);
      await writeAll(rows);
      return { event, duplicate: false };
    },
    async markProcessed(id, patch) {
      const rows = await readAll();
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) return;
      rows[index] = {
        ...rows[index],
        processingStatus: patch.processingStatus,
        errorMessage: patch.errorMessage ?? null,
        processedAt: new Date().toISOString(),
      };
      await writeAll(rows);
    },
  };
}

type PaymentEventRow = {
  id: string;
  provider: string;
  provider_event_id: string | null;
  order_id: string | null;
  transaction_id: string | null;
  event_type: string;
  signature_valid: boolean;
  processing_status: PaymentEventProcessingStatus;
  payload: Record<string, string>;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
};

function mapRow(row: PaymentEventRow): PaymentEventRecord {
  return {
    id: row.id,
    provider: row.provider,
    providerEventId: row.provider_event_id,
    orderId: row.order_id,
    transactionId: row.transaction_id,
    eventType: row.event_type,
    signatureValid: row.signature_valid,
    processingStatus: row.processing_status,
    payload: row.payload,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    processedAt: row.processed_at,
  };
}

export function createSupabasePaymentEventStore(
  client: SupabaseClient,
): PaymentEventStore {
  return {
    name: "supabase",
    async findByProviderEventId(provider, providerEventId) {
      const { data, error } = await client
        .from("payment_events")
        .select("*")
        .eq("provider", provider)
        .eq("provider_event_id", providerEventId)
        .maybeSingle();
      if (error) {
        throw new Error(`Failed to find payment event: ${error.message}`);
      }
      return data ? mapRow(data as PaymentEventRow) : null;
    },
    async insert(input) {
      if (input.providerEventId) {
        const existing = await this.findByProviderEventId(
          input.provider,
          input.providerEventId,
        );
        if (existing) {
          return { event: existing, duplicate: true };
        }
      }

      const { data, error } = await client
        .from("payment_events")
        .insert({
          provider: input.provider,
          provider_event_id: input.providerEventId ?? null,
          order_id: input.orderId ?? null,
          transaction_id: input.transactionId ?? null,
          event_type: input.eventType,
          signature_valid: input.signatureValid,
          processing_status: input.processingStatus ?? "received",
          payload: sanitizePaymentPayload(input.payload),
          error_message: input.errorMessage ?? null,
        })
        .select("*")
        .single();

      if (error) {
        // Unique race: another worker inserted the same provider event.
        if (error.code === "23505" && input.providerEventId) {
          const existing = await this.findByProviderEventId(
            input.provider,
            input.providerEventId,
          );
          if (existing) {
            return { event: existing, duplicate: true };
          }
        }
        throw new Error(`Failed to insert payment event: ${error.message}`);
      }

      return { event: mapRow(data as PaymentEventRow), duplicate: false };
    },
    async markProcessed(id, patch) {
      const { error } = await client
        .from("payment_events")
        .update({
          processing_status: patch.processingStatus,
          error_message: patch.errorMessage ?? null,
          processed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) {
        throw new Error(`Failed to update payment event: ${error.message}`);
      }
    },
  };
}

export function getPaymentEventStore(): PaymentEventStore {
  const store = (process.env.ORDER_STORE ?? "file").toLowerCase();
  if (store === "supabase") {
    return createSupabasePaymentEventStore(getSupabaseAdmin());
  }
  return createFilePaymentEventStore();
}
