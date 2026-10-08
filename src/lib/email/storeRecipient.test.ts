import { afterEach, describe, expect, it, vi } from "vitest";
import {
  storeNotificationEmail,
  storeNotificationRecipients,
} from "./storeRecipient";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("storeNotificationRecipients", () => {
  it("always includes both required addresses", () => {
    const recipients = storeNotificationRecipients();
    expect(recipients).toContain("rsheuser01@gmail.com");
    expect(recipients).toContain("support@elevateprecisionhealth.com");
    expect(recipients).toHaveLength(2);
  });

  it("includes STORE_NOTIFICATION_EMAIL when set to a different address", () => {
    vi.stubEnv("STORE_NOTIFICATION_EMAIL", "extra@example.com");
    const recipients = storeNotificationRecipients();
    expect(recipients).toContain("rsheuser01@gmail.com");
    expect(recipients).toContain("support@elevateprecisionhealth.com");
    expect(recipients).toContain("extra@example.com");
    expect(recipients).toHaveLength(3);
  });

  it("deduplicates when STORE_NOTIFICATION_EMAIL matches a required address", () => {
    vi.stubEnv("STORE_NOTIFICATION_EMAIL", "rsheuser01@gmail.com");
    const recipients = storeNotificationRecipients();
    expect(recipients).toContain("rsheuser01@gmail.com");
    expect(recipients).toContain("support@elevateprecisionhealth.com");
    expect(recipients).toHaveLength(2);
  });

  it("deduplicates case-insensitively via normalization", () => {
    vi.stubEnv("STORE_NOTIFICATION_EMAIL", "RSHEUSER01@GMAIL.COM");
    const recipients = storeNotificationRecipients();
    expect(recipients).toContain("rsheuser01@gmail.com");
    expect(recipients).toContain("support@elevateprecisionhealth.com");
    expect(recipients).toHaveLength(2);
  });

  it("ignores empty STORE_NOTIFICATION_EMAIL", () => {
    vi.stubEnv("STORE_NOTIFICATION_EMAIL", "   ");
    const recipients = storeNotificationRecipients();
    expect(recipients).toHaveLength(2);
  });
});

describe("storeNotificationEmail (single address)", () => {
  it("returns STORE_NOTIFICATION_EMAIL when set", () => {
    vi.stubEnv("STORE_NOTIFICATION_EMAIL", "custom@example.com");
    expect(storeNotificationEmail()).toBe("custom@example.com");
  });

  it("falls back to site.email when STORE_NOTIFICATION_EMAIL is not set", () => {
    expect(storeNotificationEmail()).toBe("support@elevateprecisionhealth.com");
  });

  it("falls back when STORE_NOTIFICATION_EMAIL is empty", () => {
    vi.stubEnv("STORE_NOTIFICATION_EMAIL", "  ");
    expect(storeNotificationEmail()).toBe("support@elevateprecisionhealth.com");
  });
});
