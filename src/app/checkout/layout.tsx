import type { Metadata } from "next";
import type { ReactNode } from "react";

// Applies to /checkout and its children (including /checkout/success):
// transactional pages that should not be indexed but must stay crawlable.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children;
}
