import type { Metadata } from "next";
import type { ReactNode } from "react";

// Transactional page: keep it out of the index while remaining crawlable.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }: { children: ReactNode }) {
  return children;
}
