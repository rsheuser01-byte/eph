import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { LastUpdated } from "@/components/LastUpdated";
import { legalPagesUpdatedOn } from "@/data/contentDates";
import {
  termsIntro,
  termsSections,
  type TermsTextPart,
} from "@/data/termsContent";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { breadcrumbSchema } from "@/lib/seo/structuredData";

export const metadata: Metadata = pageMetadata({
  title: "Terms & conditions",
  description:
    "Terms of sale and use for Elevate Precision Health LLC: research-use-only rules, email and SMS communications, orders, payment, shipping, liability, and Kentucky governing law.",
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
      <LastUpdated date={legalPagesUpdatedOn.terms} className="mt-4" />
      <div className="prose-legal mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-ink-soft [&_a]:text-accent [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {termsIntro.map((paragraph, index) => (
          <p key={`intro-${index}`}>
            <TermsRichText parts={paragraph} />
          </p>
        ))}

        {termsSections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
            <h2 id={`${section.id}-heading`}>{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={`${section.id}-p-${index}`}>
                <TermsRichText parts={paragraph} />
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 ? (
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}

function TermsRichText({ parts }: { parts: TermsTextPart[] }) {
  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === "string") {
          return <span key={`t-${index}`}>{part}</span>;
        }
        if (part.href.startsWith("mailto:")) {
          return (
            <a key={`t-${index}`} href={part.href}>
              {part.label}
            </a>
          );
        }
        return (
          <Link key={`t-${index}`} href={part.href}>
            {part.label}
          </Link>
        );
      })}
    </>
  );
}
