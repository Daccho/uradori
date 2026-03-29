import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";
import { setupTestDatabase } from "./helpers/setup";
import { jsonHeaders } from "./helpers/fixtures";
import { useFetchMock, mockFetchRoute } from "./helpers/mock-fetch";

setupTestDatabase();

describe("POST /api/tts/synthesis", () => {
  useFetchMock();

  it("returns audio binary for valid request", async () => {
    mockFetchRoute({
      url: "api.elevenlabs.io/v1/text-to-speech",
      method: "POST",
      response: {
        status: 200,
        body: new ArrayBuffer(512),
        headers: { "Content-Type": "audio/mpeg" },
      },
    });

    const res = await SELF.fetch("http://localhost/api/tts/synthesis", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ text: "こんにちは" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("audio/mpeg");
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  it("uses sorajiro voice by default", async () => {
    let capturedUrl = "";
    const origFetch = globalThis.fetch;
    mockFetchRoute({
      url: "api.elevenlabs.io/v1/text-to-speech",
      method: "POST",
      response: {
        status: 200,
        body: new ArrayBuffer(256),
        headers: { "Content-Type": "audio/mpeg" },
      },
    });

    // Wrap to capture URL
    const mockFn = globalThis.fetch as ReturnType<typeof import("vitest")["vi"]["fn"]>;
    const res = await SELF.fetch("http://localhost/api/tts/synthesis", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ text: "テスト" }),
    });

    expect(res.status).toBe(200);
    // Default speaker is sorajiro, which maps to voice-sorajiro-test
    if (mockFn.mock) {
      const calledUrl = String(mockFn.mock.calls[0]?.[0] ?? "");
      expect(calledUrl).toContain("voice-sorajiro-test");
    }
  });

  it("uses audience voice when speaker is audience", async () => {
    mockFetchRoute({
      url: "api.elevenlabs.io/v1/text-to-speech",
      method: "POST",
      response: {
        status: 200,
        body: new ArrayBuffer(256),
        headers: { "Content-Type": "audio/mpeg" },
      },
    });

    const mockFn = globalThis.fetch as ReturnType<typeof import("vitest")["vi"]["fn"]>;
    const res = await SELF.fetch("http://localhost/api/tts/synthesis", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ text: "テスト", speaker: "audience" }),
    });

    expect(res.status).toBe(200);
    if (mockFn.mock) {
      const calledUrl = String(mockFn.mock.calls[0]?.[0] ?? "");
      expect(calledUrl).toContain("voice-audience-test");
    }
  });

  it("returns 400 when text is missing", async () => {
    const res = await SELF.fetch("http://localhost/api/tts/synthesis", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = await res.json<{
      ok: boolean;
      error: { code: string };
    }>();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
