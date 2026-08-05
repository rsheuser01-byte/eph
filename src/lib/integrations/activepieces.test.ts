import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ActivepiecesConfigError,
  ActivepiecesRequestError,
  sendActivepiecesEvent,
} from "./activepieces";

const sampleEvent = {
  eventId: "connection-test-1",
  eventType: "connection.test",
  occurredAt: "2026-08-05T15:00:00.000Z",
  payload: {
    source: "eph",
    environment: "test",
    message: "unit test",
  },
};

describe("sendActivepiecesEvent", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns skipped when marketing automation is disabled", async () => {
    vi.stubEnv("MARKETING_AUTOMATION_ENABLED", "false");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_URL", "https://example.test/hook");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_SECRET", "secret");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendActivepiecesEvent(sampleEvent);
    expect(result).toEqual({
      ok: true,
      skipped: true,
      reason: "disabled",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns skipped when MARKETING_AUTOMATION_ENABLED is unset", async () => {
    vi.stubEnv("MARKETING_AUTOMATION_ENABLED", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendActivepiecesEvent(sampleEvent);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.skipped).toBe(true);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws a configuration error when enabled but URL is missing", async () => {
    vi.stubEnv("MARKETING_AUTOMATION_ENABLED", "true");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_URL", "");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_SECRET", "secret");

    await expect(sendActivepiecesEvent(sampleEvent)).rejects.toBeInstanceOf(
      ActivepiecesConfigError,
    );
    await expect(sendActivepiecesEvent(sampleEvent)).rejects.toThrow(
      /ACTIVEPIECES_WEBHOOK_URL or ACTIVEPIECES_WEBHOOK_SECRET is missing/,
    );
  });

  it("throws a configuration error when enabled but secret is missing", async () => {
    vi.stubEnv("MARKETING_AUTOMATION_ENABLED", "true");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_URL", "https://example.test/hook");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_SECRET", "");

    await expect(sendActivepiecesEvent(sampleEvent)).rejects.toBeInstanceOf(
      ActivepiecesConfigError,
    );
  });

  it("POSTs JSON with the required EPH webhook headers", async () => {
    vi.stubEnv("MARKETING_AUTOMATION_ENABLED", "true");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_URL", "https://example.test/hook");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_SECRET", "test-secret");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendActivepiecesEvent(sampleEvent);
    expect(result).toEqual({
      ok: true,
      skipped: false,
      eventId: sampleEvent.eventId,
      status: 200,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ];
    expect(url).toBe("https://example.test/hook");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["X-EPH-Webhook-Secret"]).toBe("test-secret");
    expect(init.headers["X-EPH-Event-Id"]).toBe(sampleEvent.eventId);
    expect(JSON.parse(String(init.body))).toEqual(sampleEvent);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("treats non-2xx responses as failures", async () => {
    vi.stubEnv("MARKETING_AUTOMATION_ENABLED", "true");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_URL", "https://example.test/hook");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_SECRET", "test-secret");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
      }),
    );

    await expect(sendActivepiecesEvent(sampleEvent)).rejects.toMatchObject({
      name: "ActivepiecesRequestError",
      status: 502,
      eventId: sampleEvent.eventId,
      eventType: sampleEvent.eventType,
    });
    await expect(sendActivepiecesEvent(sampleEvent)).rejects.toBeInstanceOf(
      ActivepiecesRequestError,
    );
  });

  it("surfaces network timeouts as request failures", async () => {
    vi.stubEnv("MARKETING_AUTOMATION_ENABLED", "true");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_URL", "https://example.test/hook");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_SECRET", "test-secret");

    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(abortError),
    );

    await expect(sendActivepiecesEvent(sampleEvent)).rejects.toThrow(
      /timed out/i,
    );
    await expect(sendActivepiecesEvent(sampleEvent)).rejects.toBeInstanceOf(
      ActivepiecesRequestError,
    );
  });

  it("surfaces other network failures without logging secrets", async () => {
    vi.stubEnv("MARKETING_AUTOMATION_ENABLED", "true");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_URL", "https://example.test/hook");
    vi.stubEnv("ACTIVEPIECES_WEBHOOK_SECRET", "super-secret-value");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")),
    );

    try {
      await sendActivepiecesEvent(sampleEvent);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ActivepiecesRequestError);
      const message = String(error);
      expect(message).not.toContain("super-secret-value");
      expect(message).not.toContain("example.test/hook");
      expect(message).toContain("connection.test");
    }
  });
});
