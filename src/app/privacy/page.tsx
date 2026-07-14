import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Privacy policy",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy policy">
      <p>
        {site.name} respects your privacy. This policy describes how we collect
        and use information when you browse our site or contact us.
      </p>
      <h2>Information we collect</h2>
      <p>
        We may collect contact details you submit through forms or email, as
        well as basic technical data such as browser type and pages visited.
      </p>
      <h2>How we use information</h2>
      <p>
        Information is used to respond to inquiries, fulfill research orders,
        improve the website, and meet legal obligations.
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
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="site-shell py-16">
      <h1 className="font-display text-4xl text-ink">{title}</h1>
      <div className="prose-legal mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-ink-soft [&_a]:text-accent [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink">
        {children}
      </div>
    </div>
  );
}
