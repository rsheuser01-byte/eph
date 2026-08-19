import type { PaymentStatus } from "@/lib/orders/types";

export type TrustpilotInvitation = {
  recipientEmail: string;
  recipientName: string;
  referenceId: string;
  source: "InvitationScript";
  productSkus?: string[];
};

export type TrustpilotQueue = (
  command: "register" | "createInvitation",
  payload: string | TrustpilotInvitation,
) => void;

const INVITE_STATUSES = new Set<PaymentStatus>([
  "approved",
  "partially_refunded",
]);

type InvitationOrder = {
  orderId: string;
  paymentStatus: PaymentStatus;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: readonly { sku: string }[];
};

export function buildTrustpilotInvitation(
  order: InvitationOrder,
): TrustpilotInvitation | null {
  if (!INVITE_STATUSES.has(order.paymentStatus)) {
    return null;
  }

  const recipientEmail = order.customer.email.trim();
  if (!recipientEmail.includes("@")) {
    return null;
  }

  const recipientName = `${order.customer.firstName} ${order.customer.lastName}`
    .replace(/\s+/g, " ")
    .trim();
  const productSkus = [
    ...new Set(order.items.map((item) => item.sku.trim()).filter(Boolean)),
  ];

  return {
    recipientEmail,
    recipientName,
    referenceId: order.orderId,
    source: "InvitationScript",
    ...(productSkus.length > 0 ? { productSkus } : {}),
  };
}

function storageKey(referenceId: string): string {
  return `eph-tp-invite:${referenceId}`;
}

export function createTrustpilotInvitationOnce(options: {
  tp?: TrustpilotQueue;
  invitation: TrustpilotInvitation;
  storage: Pick<Storage, "getItem" | "setItem">;
}): boolean {
  const key = storageKey(options.invitation.referenceId);
  if (options.storage.getItem(key)) {
    return false;
  }
  if (typeof options.tp !== "function") {
    return false;
  }
  options.tp("createInvitation", options.invitation);
  options.storage.setItem(key, "1");
  return true;
}
