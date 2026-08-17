import { afterEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/seo/siteUrl";
import { RESEND_UNSUBSCRIBE_URL_PLACEHOLDER } from "@/lib/email/marketingEmailLayout";
import {
  ABANDONED_CART_EMAIL_HEADING,
  ABANDONED_CART_EMAIL_SUBJECT,
  buildAbandonedCartEmail,
} from "./abandonedCartEmail";
import type { AbandonedCartEmailPayload } from "@/lib/abandonedCart/types";

afterEach(() => {
  vi.unstubAllEnvs();
});

const data: AbandonedCartEmailPayload = {
  cartId: "pub_abc",
  email: "ada@example.com",
  firstName: "Ada",
  currency: "USD",
  subtotal: 139.98,
  items: [
    {
      productId: "glp-3",
      name: "GLP-3",
      option: "15mg",
      quantity: 2,
      unitPrice: 69.99,
      imageUrl: `${CANONICAL_PRODUCTION_ORIGIN}/products/glp-3-15mg.png`,
    },
  ],
  restoreUrl: `${CANONICAL_PRODUCTION_ORIGIN}/cart/restore/opaque-token`,
  converted: false,
  canEmail: true,
};

describe("buildAbandonedCartEmail", () => {
  it("renders branding, cart lines, restore CTA, and unsubscribe placeholder", () => {
    const message = buildAbandonedCartEmail(data);
    expect(message.to).toBe("ada@example.com");
    expect(message.subject).toBe(ABANDONED_CART_EMAIL_SUBJECT);
    expect(message.html).toContain(ABANDONED_CART_EMAIL_HEADING);
    expect(message.html).toContain("GLP-3");
    expect(message.html).toContain("15mg");
    expect(message.html).toContain("Return to your cart");
    expect(message.html).toContain("/cart/restore/opaque-token");
    expect(message.html).toContain(RESEND_UNSUBSCRIBE_URL_PLACEHOLDER);
    expect(message.html).not.toContain("localhost");
    expect(message.text).toContain("$139.98");
    expect(message.html.toLowerCase()).not.toContain("limited time");
    expect(message.html.toLowerCase()).not.toContain("treat");
  });

  it("escapes untrusted names", () => {
    const message = buildAbandonedCartEmail({
      ...data,
      firstName: "<script>alert(1)</script>",
      items: [
        {
          ...data.items[0],
          name: "<img src=x>",
        },
      ],
    });
    expect(message.html).not.toContain("<script>");
    expect(message.html).not.toContain("<img src=x>");
  });
});
