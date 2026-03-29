import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import app from "../index";
import { setupTestDatabase } from "./helpers/setup";
import { adminHeaders, jsonHeaders, seedTopic } from "./helpers/fixtures";
import { useFetchMock, mockFetchRoute } from "./helpers/mock-fetch";
import { createMockAI, createMockVectorize } from "./helpers/mock-ai";

setupTestDatabase();

function createMockEnv() {
  return {
    ...env,
    AI: createMockAI(),
    VECTORIZE: createMockVectorize(),
  };
}

describe("POST /api/ingest (manual)", () => {
  it("indexes a manual material", async () => {
    const topicId = await seedTopic({ id: "ingest-topic-1" });

    const res = await app.request(
      "/api/ingest",
      {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({
          mode: "manual",
          topic_id: topicId,
          content: "テスト素材コンテンツ",
          type: "opendata",
        }),
      },
      createMockEnv()
    );

    expect(res.status).toBe(201);
    const body = await res.json<{ ok: boolean; indexed_count: number }>();
    expect(body.ok).toBe(true);
    expect(body.indexed_count).toBe(1);

    // Verify material was stored in DB
    const row = await env.DB.prepare(
      "SELECT * FROM materials WHERE topic_id = ?"
    )
      .bind(topicId)
      .first();
    expect(row).not.toBeNull();
    expect(row!.content).toBe("テスト素材コンテンツ");
    expect(row!.type).toBe("opendata");
  });

  it("returns 404 for non-existent topic", async () => {
    const res = await app.request(
      "/api/ingest",
      {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({
          mode: "manual",
          topic_id: "non-existent",
          content: "テスト",
          type: "opendata",
        }),
      },
      createMockEnv()
    );

    expect(res.status).toBe(404);
    const body = await res.json<{
      ok: boolean;
      error: { code: string };
    }>();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 401 without admin key", async () => {
    const res = await app.request(
      "/api/ingest",
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          mode: "manual",
          topic_id: "any",
          content: "テスト",
          type: "opendata",
        }),
      },
      createMockEnv()
    );

    expect(res.status).toBe(401);
  });
});

describe("POST /api/ingest (auto)", () => {
  useFetchMock();

  it("indexes materials from hackathon API", async () => {
    const topicId = await seedTopic({
      id: "ingest-auto-topic",
      titleId: "ﾐ00C",
      onairDate: "2026-03-29",
    });

    mockFetchRoute({
      url: /hackathon\.example\.com\/corners/,
      response: {
        status: 200,
        body: [
          { headline: "Corner 1", broadcast_script: "Script 1" },
          { headline: "Corner 2" },
        ],
      },
    });

    const res = await app.request(
      "/api/ingest",
      {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({
          mode: "auto",
          topic_id: topicId,
          sources: ["corners"],
        }),
      },
      createMockEnv()
    );

    expect(res.status).toBe(201);
    const body = await res.json<{ ok: boolean; indexed_count: number }>();
    expect(body.ok).toBe(true);
    expect(body.indexed_count).toBe(2);
  });

  it("indexes materials from multiple sources", async () => {
    const topicId = await seedTopic({
      id: "ingest-multi-topic",
      titleId: "ﾐ00C",
      onairDate: "2026-03-29",
    });

    mockFetchRoute({
      url: /hackathon\.example\.com\/corners/,
      response: { status: 200, body: [{ headline: "Corner" }] },
    });
    mockFetchRoute({
      url: /hackathon\.example\.com\/news/,
      response: { status: 200, body: [{ title: "News 1" }] },
    });

    const res = await app.request(
      "/api/ingest",
      {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({
          mode: "auto",
          topic_id: topicId,
          sources: ["corners", "news"],
        }),
      },
      createMockEnv()
    );

    expect(res.status).toBe(201);
    const body = await res.json<{ ok: boolean; indexed_count: number }>();
    expect(body.indexed_count).toBe(2);
  });
});
