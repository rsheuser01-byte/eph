import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { breadcrumbSchema } from "@/lib/seo/structuredData";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Contact Elevate Precision Health with questions about research-only products, lot documentation, and multi-lot planning.",
  path: "/contact",
});

export default function ContactLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema(getSiteUrl(), [
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      {children}
    </>
  );
}
