import { afterEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/seo/siteUrl";
import {
  EMAIL_LOGO_PATH,
  emailSupportFooterText,
  getEmailLogoUrl,
  getEmailPublicSiteUrl,
  wrapTransactionalEmailHtml,
} from "./emailLayout";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getEmailPublicSiteUrl", () => {
  it("always returns the live storefront, not localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    expect(getEmailPublicSiteUrl()).toBe(CANONICAL_PRODUCTION_ORIGIN);
    expect(getEmailLogoUrl()).toBe(
      `${CANONICAL_PRODUCTION_ORIGIN}${EMAIL_LOGO_PATH}`,
    );
    expect(EMAIL_LOGO_PATH).toBe("/images/logo.png");
  });
});

describe("wrapTransactionalEmailHtml", () => {
  it("includes the logo, brand accent, and escaped heading", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    const html = wrapTransactionalEmailHtml({
      siteName: "Elevate Precision Health",
      heading: "Order confirmed — <EPH>",
      intro: "Thanks for your order.",
      bodyHtml: "<p>Body</p>",
    });

    expect(html).toContain(
      `src="${CANONICAL_PRODUCTION_ORIGIN}/images/logo.png"`,
    );
    expect(html).toContain('alt="Elevate Precision Health"');
    expect(html).toContain("Order confirmed — &lt;EPH&gt;");
    expect(html).toContain("Thanks for your order.");
    expect(html).toContain("<p>Body</p>");
    expect(html).toContain("Research use only");
    expect(html).toContain("#00a0ec");
  });

  it("includes support email and production website links in the footer", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    const html = wrapTransactionalEmailHtml({
      siteName: "Elevate Precision Health",
      heading: "Order confirmed",
      intro: "Thanks.",
      bodyHtml: "<p>Body</p>",
    });

    expect(html).toContain("mailto:support@elevateprecisionhealth.com");
    expect(html).toContain("support@elevateprecisionhealth.com");
    expect(html).toContain(`href="${CANONICAL_PRODUCTION_ORIGIN}"`);
    expect(html).toContain("www.elevateprecisionhealth.com");
    expect(html).not.toContain("localhost");
    expect(html).toContain("Questions about your order?");
  });
});

describe("emailSupportFooterText", () => {
  it("lists support email and live website for plain-text emails", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    const text = emailSupportFooterText();
    expect(text).toContain("Questions about your order?");
    expect(text).toContain("support@elevateprecisionhealth.com");
    expect(text).toContain(CANONICAL_PRODUCTION_ORIGIN);
    expect(text).not.toContain("localhost");
  });
});
