import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { clientIpFromRequest } from "./rateLimit";

export type AuditEntry = {
  actor: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipHash?: string | null;
};

export type AuditStore = {
  readonly name: string;
  write(entry: AuditEntry): Promise<void>;
};

export function hashIpForAudit(
  ip: string,
  secret = process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_TOKEN?.trim() ||
    "eph-audit",
): string {
  return createHash("sha256")
    .update(`eph-audit-ip-v1:${secret}:${ip}`)
    .digest("hex");
}

export function ipHashFromRequest(request: Request): string {
  return hashIpForAudit(clientIpFromRequest(request));
}

type FileRow = AuditEntry & { id: string; createdAt: string };

function defaultAuditPath(): string {
  return (
    process.env.ADMIN_AUDIT_FILE ??
    `${process.cwd()}/.data/admin_audit_log.json`
  );
}

export function createFileAuditStore(
  filePath = defaultAuditPath(),
): AuditStore {
  return {
    name: "file",
    async write(entry) {
      const { mkdir, readFile, writeFile } = await import("node:fs/promises");
      const { dirname } = await import("node:path");
      let rows: FileRow[] = [];
      try {
        const raw = await readFile(filePath, "utf8");
        const parsed = JSON.parse(raw);
        rows = Array.isArray(parsed) ? (parsed as FileRow[]) : [];
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          throw error;
        }
      }
      rows.push({
        ...entry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");
    },
  };
}

export function createSupabaseAuditStore(client: SupabaseClient): AuditStore {
  return {
    name: "supabase",
    async write(entry) {
      const { error } = await client.from("admin_audit_log").insert({
        actor: entry.actor,
        action: entry.action,
        entity_type: entry.entityType ?? null,
        entity_id: entry.entityId ?? null,
        metadata: entry.metadata ?? {},
        ip_hash: entry.ipHash ?? null,
      });
      if (error) {
        throw new Error(`Failed to write audit log: ${error.message}`);
      }
    },
  };
}

export function getAuditStore(): AuditStore {
  const store = (process.env.ORDER_STORE ?? "file").toLowerCase();
  if (store === "supabase") {
    return createSupabaseAuditStore(getSupabaseAdmin());
  }
  return createFileAuditStore();
}

/**
 * Best-effort audit write — never throws into the request path.
 */
export async function writeAuditLog(
  entry: AuditEntry,
  request?: Request,
): Promise<void> {
  try {
    const store = getAuditStore();
    await store.write({
      ...entry,
      ipHash:
        entry.ipHash ??
        (request ? ipHashFromRequest(request) : entry.ipHash ?? null),
    });
  } catch (error) {
    console.error("[audit] write failed", error);
  }
}
