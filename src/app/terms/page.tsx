import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { researchDisclaimer, site } from "@/data/site";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { breadcrumbSchema } from "@/lib/seo/structuredData";

export const metadata: Metadata = pageMetadata({
  title: "Terms & conditions",
  description:
    "Terms and conditions for using Elevate Precision Health, including the research-use-only requirements that apply to all products.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="site-shell py-16">
      <JsonLd
        data={breadcrumbSchema(getSiteUrl(), [
          { name: "Home", path: "/" },
          { name: "Terms & conditions", path: "/terms" },
        ])}
      />
      <h1 className="font-display text-4xl text-ink">Terms & conditions</h1>
      <div className="mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-ink-soft [&_a]:text-accent [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink">
        <p>
          By accessing {site.name}, you agree to these terms and confirm that
          you are at least {site.ageMinimum} years of age.
        </p>
        <h2>Research use only</h2>
        <p>{researchDisclaimer}</p>
        <h2>Orders</h2>
        <p>
          Product availability, pricing, and fulfillment details may change.
          We reserve the right to refuse or cancel orders that appear incomplete
          or non-compliant with research-use requirements.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about these terms:{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </div>
    </div>
  );
}
