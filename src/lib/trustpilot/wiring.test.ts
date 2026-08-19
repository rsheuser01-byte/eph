import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relative: string): string {
  return readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("Trustpilot review invitation wiring", () => {
  it("loads the invitation bootstrap in the document head", () => {
    const layout = source("src/app/layout.tsx");
    expect(layout).toMatch(/<head>[\s\S]*TrustpilotScript[\s\S]*<\/head>/);
  });

  it("registers the issued key and loads invitejs.trustpilot.com", () => {
    const script = source("src/components/TrustpilotScript.tsx");
    expect(script).toMatch(/invitejs\.trustpilot\.com\/tp\.min\.js/);
    expect(script).toMatch(/tp\('register'/);
    expect(script).toMatch(/<script/);
    expect(script).not.toMatch(/afterInteractive/);
    expect(script).toMatch(/getTrustpilotInviteKey/);
  });

  it("creates the invitation on the paid order status page", () => {
    expect(source("src/app/checkout/success/CheckoutSuccessClient.tsx")).toMatch(
      /TrustpilotInvite/,
    );
    expect(source("src/components/TrustpilotInvite.tsx")).toMatch(
      /createTrustpilotInvitationOnce/,
    );
    expect(source("src/components/TrustpilotInvite.tsx")).toMatch(
      /localStorage/,
    );
  });

  it("returns token-gated invitation fields on public order status", () => {
    expect(source("src/lib/orders/loadPublicStatus.ts")).toMatch(
      /buildTrustpilotInvitation/,
    );
    expect(source("src/app/api/orders/[orderId]/status/route.ts")).toMatch(
      /reviewInvitation/,
    );
    expect(source("src/lib/trustpilot/invitation.ts")).toMatch(/productUrl/);
    expect(source("src/lib/trustpilot/invitation.ts")).toMatch(/productSkus/);
  });

  it("discloses Trustpilot review invitations in the privacy policy", () => {
    expect(source("src/app/privacy/page.tsx")).toMatch(/Trustpilot/);
  });

  it("allows the Trustpilot invitation script in CSP", () => {
    expect(source("next.config.ts")).toMatch(
      /script-src[^"]*https:\/\/invitejs\.trustpilot\.com/,
    );
  });
});
