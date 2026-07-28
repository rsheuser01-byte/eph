import type { Metadata } from "next";
import { CheckoutSuccessClient } from "./CheckoutSuccessClient";
import { loadPublicOrderStatus } from "@/lib/orders/loadPublicStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order status",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ order?: string; token?: string; pending?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderId = params.order?.trim() ?? "";
  const token = params.token?.trim() ?? "";
  const initial =
    orderId && token ? await loadPublicOrderStatus(orderId, token) : null;

  return (
    <CheckoutSuccessClient
      orderId={orderId}
      token={token}
      initial={initial}
    />
  );
}
