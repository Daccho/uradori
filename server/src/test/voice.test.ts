import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";
import { setupTestDatabase } from "./helpers/setup";
import { jsonHeaders, seedTopic } from "./helpers/fixtures";

setupTestDatabase();

describe("POST /api/voice", () => {
  it("submits a voice successfully", async () => {
    const topicId = await seedTopic({ id: "topic-for-voice" });

    const res = await SELF.fetch("http://localhost/api/voice", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        topic_id: topicId,
        text: "この問題についてもっと議論してほしい",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json<{ ok: boolean; id: string }>();
    expect(body.ok).toBe(true);
    expect(typeof body.id).toBe("string");
  });

  it("returns 400 for non-existent topic_id", async () => {
    const res = await SELF.fetch("http://localhost/api/voice", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        topic_id: "non-existent-topic",
        text: "テスト",
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json<{
      ok: boolean;
      error: { code: string; message: string };
    }>();
    expect(body.ok).toBe(false);
    expect(body.error.message).toContain("Topic not found");
  });

  it("returns 400 when text exceeds 500 characters", async () => {
    const topicId = await seedTopic({ id: "topic-for-long-voice" });
    const longText = "あ".repeat(501);

    const res = await SELF.fetch("http://localhost/api/voice", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        topic_id: topicId,
        text: longText,
      }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 when topic_id is missing", async () => {
    const res = await SELF.fetch("http://localhost/api/voice", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ text: "テスト" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json<{
      ok: boolean;
      error: { code: string };
    }>();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when text is missing", async () => {
    const res = await SELF.fetch("http://localhost/api/voice", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ topic_id: "some-id" }),
    });

    expect(res.status).toBe(400);
  });
});
