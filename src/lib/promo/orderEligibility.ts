import type { OrderStore } from "@/lib/orders/types";

export async function hasApprovedOrderForEmail(
  store: OrderStore,
  email: string,
): Promise<boolean> {
  if (!store.hasApprovedOrderForEmail) {
    throw new Error(
      "Order store does not support first-order promo eligibility checks.",
    );
  }
  return store.hasApprovedOrderForEmail(email);
}
