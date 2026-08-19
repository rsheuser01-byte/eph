import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { LastUpdated } from "@/components/LastUpdated";
import { legalPagesUpdatedOn } from "@/data/contentDates";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { breadcrumbSchema } from "@/lib/seo/structuredData";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description:
    "Privacy policy for Elevate Precision Health, covering contact details, order and restock notices, email and SMS preferences, and how information is used.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy policy" updatedOn={legalPagesUpdatedOn.privacy}>
      <JsonLd
        data={breadcrumbSchema(getSiteUrl(), [
          { name: "Home", path: "/" },
          { name: "Privacy policy", path: "/privacy" },
        ])}
      />
      <p>
        {site.name} respects your privacy. This policy describes how we collect
        and use information when you browse our site or contact us.
      </p>
      <h2>Information we collect</h2>
      <p>
        We may collect contact details you submit through forms or email —
        including name, email address, phone number, shipping address, and
        messages you send us — as well as basic technical data such as browser
        type and pages visited. Checkout and restock-notification forms may
        collect the product and size you are asking about.
      </p>
      <h2>How we use information</h2>
      <p>
        Information is used to respond to inquiries, fulfill research orders,
        send transactional notices (such as order, shipping, restock, or
        saved-cart reminder emails), improve the website, and meet legal
        obligations. If you
        provide a mobile number and expressly consent to SMS/text messages, we
        may use that number for the message types described in our{" "}
        <a href="/terms#electronic-communications">Terms</a> (for example order
        updates or requested alerts). We do not require SMS consent as a
        condition of purchase.
      </p>
      <h2>Email and text preferences</h2>
      <p>
        You may unsubscribe from promotional email using the link in those
        messages or by contacting{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>. For marketing SMS,
        you may reply STOP or email us with your number and a stop request.
        Transactional messages about orders, incomplete checkout, or requests
        you initiated may still be sent by email when needed to complete the
        transaction or support request. Saved-cart reminder emails include an
        unsubscribe link. See the Terms section on electronic communications
        for more detail.
      </p>
      <h2>Reviews</h2>
      <p>
        After a paid order, we may share your name, email address, order
        reference, and product SKUs with Trustpilot so Trustpilot can email
        you an optional invitation to review our ordering and support. We do
        not invent reviews. Trustpilot processes that invitation under its own
        terms and{" "}
        <a href="https://legal.trustpilot.com/end-user-privacy-terms">
          privacy terms
        </a>
        .
      </p>
      <h2>Cookies</h2>
      <p>
        We use a small number of first-party cookies that are required for the
        site to work. The shopping-cart session cookie (
        <code>eph_cart_sid</code>) stores an opaque identifier so we can save
        your cart if you leave checkout. It does not contain your email, name,
        or other contact details. An admin session cookie is used only after
        staff sign in. We do not use advertising cookies. After a paid order,
        the checkout confirmation page loads Trustpilot’s invitation script,
        which may set its own cookies to send the review invite.
      </p>
      <h2>Contact</h2>
      <p>
        Privacy questions can be sent to{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </LegalLayout>
  );
}

function LegalLayout({
  title,
  updatedOn,
  children,
}: {
  title: string;
  updatedOn: string;
  children: ReactNode;
}) {
  return (
    <div className="site-shell py-16">
      <h1 className="font-display text-4xl text-ink">{title}</h1>
      <LastUpdated date={updatedOn} className="mt-4" />
      <div className="prose-legal mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-ink-soft [&_a]:text-accent [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink">
        {children}
      </div>
    </div>
  );
}
