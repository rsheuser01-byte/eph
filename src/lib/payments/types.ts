export type BillingInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  /** Optional research organization / laboratory / company. */
  organization?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type CardInput = {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
};

export type OrderItem = {
  sku: string;
  name: string;
  size: string;
  qty: number;
  unitPrice: number;
};

export type ChargeInput = {
  orderId: string;
  amount: number;
  currency: string;
  billing: BillingInfo;
  /** Optional for HPP providers that collect cards off-site. */
  card?: CardInput;
  items: OrderItem[];
  /** Opaque token included in HPP return URLs for status lookup. */
  lookupToken?: string;
};

export type RefundInput = {
  orderId: string;
  transactionId: string;
  amount: number;
  currency: string;
};

export type RefundOutcome = {
  ok: boolean;
  transactionId?: string;
  message?: string;
};

export type PaymentVerificationStatus =
  | "approved"
  | "declined"
  | "cancelled"
  | "pending"
  | "unknown";

export type PaymentVerification = {
  verified: boolean;
  status: PaymentVerificationStatus;
  amountCents?: number;
  currency?: string;
  message?: string;
  /** Fail closed: do not expire this reservation (payment may still succeed). */
  skipExpire?: boolean;
};

// Direct/mock providers settle synchronously and return a `result`. A hosted
// provider (Stripe Checkout / Bankful HPP) returns a `redirect` URL instead.
// Both satisfy the same checkout contract so the API route never has to change.
export type CheckoutOutcome =
  | {
      kind: "result";
      approved: boolean;
      orderId: string;
      transactionId?: string;
      message?: string;
    }
  | { kind: "redirect"; url: string; transactionId?: string };

export interface PaymentProvider {
  readonly name: string;
  beginCheckout(input: ChargeInput): Promise<CheckoutOutcome>;
  refund?(input: RefundInput): Promise<RefundOutcome>;
  cancel?(input: {
    orderId: string;
    transactionId: string;
  }): Promise<RefundOutcome>;
}
