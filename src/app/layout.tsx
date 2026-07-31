import type { Metadata } from "next";
import { Sora, Syne } from "next/font/google";
import Script from "next/script";
import { AgeGate } from "@/components/AgeGate";
import { CartDrawer } from "@/components/CartDrawer";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/data/site";
import {
  canEmitReviewSchema,
  testimonials,
} from "@/data/testimonials";
import { CartProvider } from "@/lib/cart/CartContext";
import { ogImage } from "@/lib/seo/pageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import {
  organizationReviewSchema,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo/structuredData";
import "./globals.css";

const siteUrl = getSiteUrl();

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.name,
    description: site.description,
    url: siteUrl,
    locale: "en_US",
    images: [{ ...ogImage, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: [ogImage.url],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${syne.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col antialiased">
        <Script
          id="js-ready"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js');`,
          }}
        />
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important;}`}</style>
        </noscript>
        <JsonLd
          data={[
            organizationSchema(siteUrl),
            websiteSchema(siteUrl),
            ...(canEmitReviewSchema(testimonials)
              ? [organizationReviewSchema(siteUrl, testimonials)!]
              : []),
          ]}
        />
        <CartProvider>
          <AgeGate />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
