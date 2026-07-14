import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Reach out",
  description:
    "Contact Elevate Precision Health for product questions, assay files, and multi-lot planning.",
};

export default function ContactLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
