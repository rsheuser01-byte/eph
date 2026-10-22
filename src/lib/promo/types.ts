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
  /** Inclusive start. Omitted means the code can be used as soon as it is active. */
  startsAt?: string;
  /** Exclusive end is not used: a code expires once this instant has passed. */
  endsAt?: string;
};

export type PromoStore = {
  readonly name: string;
  getByCode(code: string): Promise<PromoCode | null>;
  list(): Promise<PromoCode[]>;
  upsert(promo: PromoCode): Promise<void>;
};
