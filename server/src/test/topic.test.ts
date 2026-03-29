import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";
import { setupTestDatabase } from "./helpers/setup";
import { adminHeaders, jsonHeaders, seedTopic } from "./helpers/fixtures";
import { useFetchMock, mockFetchRoute } from "./helpers/mock-fetch";

setupTestDatabase();

describe("POST /api/topics", () => {
  it("creates a topic with valid body and admin key", async () => {
    const res = await SELF.fetch("http://localhost/api/topics", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        title_id: "news-morning",
        onair_date: "2026-03-29",
        headline: "今日のニュース",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json<{ ok: boolean; id: string }>();
    expect(body.ok).toBe(true);
    expect(typeof body.id).toBe("string");
  });

  it("creates a topic with optional fields", async () => {
    const res = await SELF.fetch("http://localhost/api/topics", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        title_id: "news",
        onair_date: "2026-03-29",
        headline: "テスト",
        corner_start_time: "08:00",
        corner_end_time: "08:15",
        headline_genre: "ニュース",
        broadcast_script: "台本テスト",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json<{ ok: boolean }>();
    expect(body.ok).toBe(true);
  });

  it("returns 401 without admin key", async () => {
    const res = await SELF.fetch("http://localhost/api/topics", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        title_id: "news",
        onair_date: "2026-03-29",
        headline: "Test",
      }),
    });

    expect(res.status).toBe(401);
    const body = await res.json<{ ok: boolean; error: { code: string } }>();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 with wrong admin key", async () => {
    const res = await SELF.fetch("http://localhost/api/topics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Key": "wrong-key",
      },
      body: JSON.stringify({
        title_id: "news",
        onair_date: "2026-03-29",
        headline: "Test",
      }),
    });

    expect(res.status).toBe(401);
  });

  it("returns 400 when headline is missing", async () => {
    const res = await SELF.fetch("http://localhost/api/topics", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        title_id: "news",
        onair_date: "2026-03-29",
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json<{
      ok: boolean;
      error: { code: string };
    }>();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/topics", () => {
  it("returns empty items when no topics exist", async () => {
    const res = await SELF.fetch("http://localhost/api/topics");

    expect(res.status).toBe(200);
    const body = await res.json<{ items: unknown[] }>();
    expect(body.items).toEqual([]);
  });

  it("returns all topics when no filter", async () => {
    await seedTopic({ id: "t1", titleId: "news", headline: "News 1" });
    await seedTopic({ id: "t2", titleId: "sports", headline: "Sports 1" });

    const res = await SELF.fetch("http://localhost/api/topics");

    expect(res.status).toBe(200);
    const body = await res.json<{ items: unknown[] }>();
    expect(body.items).toHaveLength(2);
  });

  it("filters by title_id", async () => {
    await seedTopic({ id: "t1", titleId: "news", headline: "News 1" });
    await seedTopic({ id: "t2", titleId: "sports", headline: "Sports 1" });

    const res = await SELF.fetch(
      "http://localhost/api/topics?title_id=news"
    );

    expect(res.status).toBe(200);
    const body = await res.json<{
      items: { title_id: string }[];
    }>();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].title_id).toBe("news");
  });

  it("filters by onair_date", async () => {
    await seedTopic({
      id: "t1",
      onairDate: "2026-03-29",
      headline: "Today",
    });
    await seedTopic({
      id: "t2",
      onairDate: "2026-03-30",
      headline: "Tomorrow",
    });

    const res = await SELF.fetch(
      "http://localhost/api/topics?onair_date=2026-03-29"
    );

    expect(res.status).toBe(200);
    const body = await res.json<{ items: { onair_date: string }[] }>();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].onair_date).toBe("2026-03-29");
  });

  it("returns correct response shape", async () => {
    await seedTopic({ id: "t1" });

    const res = await SELF.fetch("http://localhost/api/topics");
    const body = await res.json<{
      items: {
        id: string;
        title_id: string;
        onair_date: string;
        headline: string;
        corner_start_time: string | null;
        corner_end_time: string | null;
        headline_genre: string | null;
      }[];
    }>();

    const item = body.items[0];
    expect(item.id).toBe("t1");
    expect(item.title_id).toBeDefined();
    expect(item.onair_date).toBeDefined();
    expect(item.headline).toBeDefined();
    expect(item.corner_start_time).toBeNull();
    expect(item.corner_end_time).toBeNull();
    expect(item.headline_genre).toBeNull();
  });
});

describe("POST /api/topics/import", () => {
  useFetchMock();

  it("imports topics from hackathon API", async () => {
    mockFetchRoute({
      url: /hackathon\.example\.com\/corners/,
      response: {
        status: 200,
        body: [
          { headline: "Imported Topic 1", corner_start_time: "08:00" },
          { headline: "Imported Topic 2", headline_genre: "News" },
        ],
      },
    });

    const res = await SELF.fetch("http://localhost/api/topics/import", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        title_id: "ﾐ00C",
        onair_date: "2026-03-29",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json<{
      ok: boolean;
      created_count: number;
      ids: string[];
      skipped_count: number;
    }>();
    expect(body.ok).toBe(true);
    expect(body.created_count).toBe(2);
    expect(body.ids).toHaveLength(2);
    expect(body.skipped_count).toBe(0);
  });

  it("skips duplicate headlines on second import", async () => {
    mockFetchRoute({
      url: /hackathon\.example\.com\/corners/,
      response: {
        status: 200,
        body: [{ headline: "Same Topic" }],
      },
    });

    // First import
    await SELF.fetch("http://localhost/api/topics/import", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ title_id: "ﾐ00C", onair_date: "2026-03-29" }),
    });

    // Second import - same headline should be skipped
    const res = await SELF.fetch("http://localhost/api/topics/import", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ title_id: "ﾐ00C", onair_date: "2026-03-29" }),
    });

    expect(res.status).toBe(201);
    const body = await res.json<{
      ok: boolean;
      created_count: number;
      skipped_count: number;
    }>();
    expect(body.created_count).toBe(0);
    expect(body.skipped_count).toBe(1);
  });

  it("returns 401 without admin key", async () => {
    const res = await SELF.fetch("http://localhost/api/topics/import", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ title_id: "ﾐ00C", onair_date: "2026-03-29" }),
    });

    expect(res.status).toBe(401);
  });
});
