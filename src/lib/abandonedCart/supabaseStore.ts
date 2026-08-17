import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "./email";
import type { SavedCart, SavedCartItem, SavedCartStore, SavedCartStatus } from "./types";

type SavedCartRow = {
  id: string;
  public_id: string;
  session_id_hash: string;
  restore_token: string;
  email: string | null;
  first_name: string | null;
  subtotal: number | string;
  currency: string;
  status: SavedCartStatus;
  created_at: string;
  updated_at: string;
  identified_at: string | null;
  checkout_started_at: string | null;
  converted_at: string | null;
  order_id: string | null;
  last_recovery_event_at: string | null;
  identified_event_sent_at: string | null;
  converted_event_sent_at: string | null;
  expires_at: string;
  cart_recovery_consent: boolean;
};

type SavedCartItemRow = {
  saved_cart_id: string;
  slug: string;
  size: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number | string;
  image_url: string | null;
};

function asNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function mapItems(rows: SavedCartItemRow[]): SavedCartItem[] {
  return rows.map((row) => ({
    slug: row.slug,
    size: row.size,
    sku: row.sku,
    name: row.name,
    quantity: row.quantity,
    unitPrice: asNumber(row.unit_price),
    imageUrl: row.image_url ?? "",
  }));
}

function mapRow(row: SavedCartRow, items: SavedCartItem[]): SavedCart {
  return {
    id: row.id,
    publicId: row.public_id,
    sessionIdHash: row.session_id_hash,
    restoreToken: row.restore_token,
    email: row.email,
    firstName: row.first_name,
    items,
    subtotal: asNumber(row.subtotal),
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    identifiedAt: row.identified_at,
    checkoutStartedAt: row.checkout_started_at,
    convertedAt: row.converted_at,
    orderId: row.order_id,
    lastRecoveryEventAt: row.last_recovery_event_at,
    identifiedEventSentAt: row.identified_event_sent_at,
    convertedEventSentAt: row.converted_event_sent_at,
    expiresAt: row.expires_at,
    cartRecoveryConsent: row.cart_recovery_consent,
  };
}

function cartToRow(cart: SavedCart) {
  return {
    id: cart.id,
    public_id: cart.publicId,
    session_id_hash: cart.sessionIdHash,
    restore_token: cart.restoreToken,
    email: cart.email,
    first_name: cart.firstName,
    subtotal: cart.subtotal,
    currency: cart.currency,
    status: cart.status,
    created_at: cart.createdAt,
    updated_at: cart.updatedAt,
    identified_at: cart.identifiedAt,
    checkout_started_at: cart.checkoutStartedAt,
    converted_at: cart.convertedAt,
    order_id: cart.orderId,
    last_recovery_event_at: cart.lastRecoveryEventAt,
    identified_event_sent_at: cart.identifiedEventSentAt,
    converted_event_sent_at: cart.convertedEventSentAt,
    expires_at: cart.expiresAt,
    cart_recovery_consent: cart.cartRecoveryConsent,
  };
}

export function createSupabaseSavedCartStore(
  client: SupabaseClient,
): SavedCartStore {
  async function loadItems(cartId: string): Promise<SavedCartItem[]> {
    const { data, error } = await client
      .from("saved_cart_items")
      .select("*")
      .eq("saved_cart_id", cartId);
    if (error) {
      throw new Error(`Failed to load saved cart items: ${error.message}`);
    }
    return mapItems((data ?? []) as SavedCartItemRow[]);
  }

  async function replaceItems(
    cartId: string,
    items: SavedCartItem[],
  ): Promise<void> {
    const { error: deleteError } = await client
      .from("saved_cart_items")
      .delete()
      .eq("saved_cart_id", cartId);
    if (deleteError) {
      throw new Error(
        `Failed to replace saved cart items: ${deleteError.message}`,
      );
    }
    if (items.length === 0) {
      return;
    }
    const { error: insertError } = await client.from("saved_cart_items").insert(
      items.map((item) => ({
        saved_cart_id: cartId,
        slug: item.slug,
        size: item.size,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        image_url: item.imageUrl || null,
      })),
    );
    if (insertError) {
      throw new Error(`Failed to save saved cart items: ${insertError.message}`);
    }
  }

  async function hydrate(row: SavedCartRow): Promise<SavedCart> {
    return mapRow(row, await loadItems(row.id));
  }

  return {
    name: "supabase",

    async save(cart: SavedCart): Promise<void> {
      const { error } = await client
        .from("saved_carts")
        .upsert(cartToRow(cart), { onConflict: "id" });
      if (error) {
        throw new Error(`Failed to save saved cart: ${error.message}`);
      }
      await replaceItems(cart.id, cart.items);
    },

    async getById(id: string): Promise<SavedCart | null> {
      const { data, error } = await client
        .from("saved_carts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        throw new Error(`Failed to load saved cart: ${error.message}`);
      }
      if (!data) {
        return null;
      }
      return hydrate(data as SavedCartRow);
    },

    async getByPublicId(publicId: string): Promise<SavedCart | null> {
      const { data, error } = await client
        .from("saved_carts")
        .select("*")
        .eq("public_id", publicId)
        .maybeSingle();
      if (error) {
        throw new Error(`Failed to load saved cart: ${error.message}`);
      }
      if (!data) {
        return null;
      }
      return hydrate(data as SavedCartRow);
    },

    async getBySessionHash(hash: string): Promise<SavedCart | null> {
      const { data, error } = await client
        .from("saved_carts")
        .select("*")
        .eq("session_id_hash", hash)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        throw new Error(`Failed to load saved cart: ${error.message}`);
      }
      if (!data) {
        return null;
      }
      return hydrate(data as SavedCartRow);
    },

    async getByRestoreToken(token: string): Promise<SavedCart | null> {
      const { data, error } = await client
        .from("saved_carts")
        .select("*")
        .eq("restore_token", token)
        .maybeSingle();
      if (error) {
        throw new Error(`Failed to load saved cart: ${error.message}`);
      }
      if (!data) {
        return null;
      }
      return hydrate(data as SavedCartRow);
    },

    async getByOrderId(orderId: string): Promise<SavedCart | null> {
      const { data, error } = await client
        .from("saved_carts")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();
      if (error) {
        throw new Error(`Failed to load saved cart: ${error.message}`);
      }
      if (!data) {
        return null;
      }
      return hydrate(data as SavedCartRow);
    },

    async findActiveByEmail(email: string): Promise<SavedCart | null> {
      const normalized = normalizeEmail(email);
      if (!normalized) {
        return null;
      }
      const { data, error } = await client
        .from("saved_carts")
        .select("*")
        .eq("status", "active")
        .ilike("email", normalized)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        throw new Error(`Failed to find saved cart by email: ${error.message}`);
      }
      if (!data) {
        return null;
      }
      return hydrate(data as SavedCartRow);
    },

    async listRecent(limit = 100): Promise<SavedCart[]> {
      const { data, error } = await client
        .from("saved_carts")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) {
        throw new Error(`Failed to list saved carts: ${error.message}`);
      }
      const rows = (data ?? []) as SavedCartRow[];
      return Promise.all(rows.map((row) => hydrate(row)));
    },

    async claimIdentifiedEvent(id: string, at: string): Promise<boolean> {
      const { data, error } = await client
        .from("saved_carts")
        .update({
          identified_event_sent_at: at,
          last_recovery_event_at: at,
        })
        .eq("id", id)
        .is("identified_event_sent_at", null)
        .select("id");
      if (error) {
        throw new Error(
          `Failed to claim identified event: ${error.message}`,
        );
      }
      return (data ?? []).length > 0;
    },

    async claimConvertedEvent(id: string, at: string): Promise<boolean> {
      const { data, error } = await client
        .from("saved_carts")
        .update({
          converted_event_sent_at: at,
          last_recovery_event_at: at,
        })
        .eq("id", id)
        .is("converted_event_sent_at", null)
        .select("id");
      if (error) {
        throw new Error(`Failed to claim converted event: ${error.message}`);
      }
      return (data ?? []).length > 0;
    },
  };
}
