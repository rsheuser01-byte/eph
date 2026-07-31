import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { LastUpdated } from "@/components/LastUpdated";
import { legalPagesUpdatedOn } from "@/data/contentDates";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { breadcrumbSchema } from "@/lib/seo/structuredData";

export const metadata: Metadata = pageMetadata({
  title: "Refunds & returns",
  description:
    "Refunds and returns policy for Elevate Precision Health research products, including how to report damaged or incorrect shipments.",
  path: "/refunds",
});

export default function RefundsPage() {
  return (
    <div className="site-shell py-16">
      <JsonLd
        data={breadcrumbSchema(getSiteUrl(), [
          { name: "Home", path: "/" },
          { name: "Refunds & returns", path: "/refunds" },
        ])}
      />
      <h1 className="font-display text-4xl text-ink">Refunds & returns</h1>
      <LastUpdated date={legalPagesUpdatedOn.refunds} className="mt-4" />
      <div className="mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-ink-soft [&_a]:text-accent [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink">
        <p>
          Because research products are sensitive, return eligibility is
          limited. Contact us promptly if your shipment arrives damaged or
          incorrect.
        </p>
        <h2>Damaged or lost packages</h2>
        <p>
          Email {site.email} with your order details and photos when applicable.
          We will work with carriers to resolve eligible claims.
        </p>
        <h2>Non-returnable items</h2>
        <p>
          Opened vials and products that have left our temperature-controlled
          handling chain generally cannot be returned for resale.
        </p>
        <h2>Contact</h2>
        <p>
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </p>
      </div>
    </div>
  );
}
