export type PromoCode = {
  /** Normalized uppercase code. */
  code: string;
  /** Percentage off merchandise subtotal (0–100). Mutually exclusive with amountOff. */
  percentOff?: number;
  /** Fixed dollar off merchandise subtotal. Mutually exclusive with percentOff. */
  amountOff?: number;
  active: boolean;
  firstOrderOnly: boolean;
  label: string;
};

export type PromoStore = {
  readonly name: string;
  getByCode(code: string): Promise<PromoCode | null>;
  /** Test/local helper — not required for production checkout. */
  upsert?(promo: PromoCode): Promise<void>;
};
