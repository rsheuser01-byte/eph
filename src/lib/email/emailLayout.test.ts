import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EMAIL_LOGO_PATH,
  getEmailLogoUrl,
  wrapTransactionalEmailHtml,
} from "./emailLayout";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getEmailLogoUrl", () => {
  it("builds an absolute URL to logo.png from the site origin", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SITE_URL",
      "https://www.elevateprecisionhealth.com",
    );
    expect(getEmailLogoUrl()).toBe(
      `https://www.elevateprecisionhealth.com${EMAIL_LOGO_PATH}`,
    );
    expect(EMAIL_LOGO_PATH).toBe("/images/logo.png");
  });
});

describe("wrapTransactionalEmailHtml", () => {
  it("includes the logo, brand accent, and escaped heading", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const html = wrapTransactionalEmailHtml({
      siteName: "Elevate Precision Health",
      heading: "Order confirmed — <EPH>",
      intro: "Thanks for your order.",
      bodyHtml: "<p>Body</p>",
    });

    expect(html).toContain('src="https://example.com/images/logo.png"');
    expect(html).toContain('alt="Elevate Precision Health"');
    expect(html).toContain("Order confirmed — &lt;EPH&gt;");
    expect(html).toContain("Thanks for your order.");
    expect(html).toContain("<p>Body</p>");
    expect(html).toContain("Research use only");
    expect(html).toContain("#00a0ec");
  });
});
