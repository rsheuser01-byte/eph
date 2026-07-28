import { describe, expect, it } from "vitest";
import { POST as expireCron } from "./route";

describe("GET/POST /api/cron/expire-reservations", () => {
  it("rejects missing cron secret", async () => {
    const previous = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    try {
      const response = await expireCron(
        new Request("http://localhost/api/cron/expire-reservations", {
          method: "POST",
        }),
      );
      expect(response.status).toBe(401);
    } finally {
      if (previous === undefined) {
        delete process.env.CRON_SECRET;
      } else {
        process.env.CRON_SECRET = previous;
      }
    }
  });

  it("rejects wrong bearer token", async () => {
    const previous = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "expected-secret";
    try {
      const response = await expireCron(
        new Request("http://localhost/api/cron/expire-reservations", {
          method: "POST",
          headers: { Authorization: "Bearer wrong" },
        }),
      );
      expect(response.status).toBe(401);
    } finally {
      if (previous === undefined) {
        delete process.env.CRON_SECRET;
      } else {
        process.env.CRON_SECRET = previous;
      }
    }
  });
});
