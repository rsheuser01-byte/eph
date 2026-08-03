import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetMemoryRateLimits } from "@/lib/security/rateLimit";

const getLiveAvailabilityMap = vi.fn();
const getAvailabilityMap = vi.fn();

vi.mock("@/lib/inventory/availability", () => ({
  getLiveAvailabilityMap: (...args: unknown[]) =>
    getLiveAvailabilityMap(...args),
  getAvailabilityMap: (...args: unknown[]) => getAvailabilityMap(...args),
}));

describe("GET /api/availability", () => {
  beforeEach(() => {
    getLiveAvailabilityMap.mockReset();
    getAvailabilityMap.mockReset();
    resetMemoryRateLimits();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns live (uncached) availability for requested SKUs", async () => {
    getLiveAvailabilityMap.mockResolvedValue({
      "BAC-10ML": 0,
      "BAC-30ML": 4,
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/availability?skus=BAC-10ML,BAC-30ML"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toMatch(/no-store/);
    const json = (await response.json()) as {
      success: boolean;
      data: Record<string, number | null>;
      error: string | null;
    };
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ "BAC-10ML": 0, "BAC-30ML": 4 });
    expect(json.error).toBeNull();
    expect(getLiveAvailabilityMap).toHaveBeenCalledWith([
      "BAC-10ML",
      "BAC-30ML",
    ]);
    expect(getAvailabilityMap).not.toHaveBeenCalled();
  });

  it("rejects empty SKU lists", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/availability"),
    );
    expect(response.status).toBe(400);
  });
});
