import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import app from "../index";
import { setupTestDatabase } from "./helpers/setup";
import { jsonHeaders, seedTopic, seedVoice } from "./helpers/fixtures";
import { parseSSEResponse } from "./helpers/parse-sse";
import { createMockAI, createMockVectorize } from "./helpers/mock-ai";

setupTestDatabase();

function createMockEnv() {
  return {
    ...env,
    AI: createMockAI(),
    VECTORIZE: createMockVectorize(),
  };
}

describe("POST /api/dialog/start", () => {
  it("returns SSE stream with questions, dialog, and done events", async () => {
    const topicId = await seedTopic({ id: "dialog-topic-1" });
    await seedVoice(topicId, "この問題についてもっと知りたい");
    await seedVoice(topicId, "詳しく解説してほしい");
    await seedVoice(topicId, "今後どうなるの？");

    const res = await app.request(
      "/api/dialog/start",
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ topic_id: topicId }),
      },
      createMockEnv()
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const events = await parseSSEResponse(res);
    expect(events.length).toBeGreaterThan(0);

    // First event should be "questions"
    const questionsEvent = events.find((e) => e.event === "questions");
    expect(questionsEvent).toBeDefined();
    const questionsData = JSON.parse(questionsEvent!.data);
    expect(questionsData.questions).toBeInstanceOf(Array);
    expect(questionsData.questions.length).toBeGreaterThan(0);
    expect(questionsData.questions[0]).toHaveProperty("text");
    expect(questionsData.questions[0]).toHaveProperty("basedOnCount");

    // Dialog events should come in pairs (audience + sorajiro)
    const dialogEvents = events.filter((e) => e.event === "dialog");
    expect(dialogEvents.length).toBeGreaterThanOrEqual(2);

    // Check audience event
    const audienceEvent = dialogEvents.find((e) => {
      const data = JSON.parse(e.data);
      return data.speaker === "audience";
    });
    expect(audienceEvent).toBeDefined();

    // Check sorajiro event
    const sorajiroEvent = dialogEvents.find((e) => {
      const data = JSON.parse(e.data);
      return data.speaker === "sorajiro";
    });
    expect(sorajiroEvent).toBeDefined();
    const sorajiroData = JSON.parse(sorajiroEvent!.data);
    expect(sorajiroData).toHaveProperty("text");
    expect(sorajiroData).toHaveProperty("source");

    // Last event should be "done"
    const doneEvent = events[events.length - 1];
    expect(doneEvent.event).toBe("done");
    const doneData = JSON.parse(doneEvent.data);
    expect(doneData).toHaveProperty("session_id");
  });

  it("creates dialog_sessions and dialog_logs in DB", async () => {
    const topicId = await seedTopic({ id: "dialog-topic-db" });
    await seedVoice(topicId, "テストの声");

    const res = await app.request(
      "/api/dialog/start",
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ topic_id: topicId }),
      },
      createMockEnv()
    );

    // Consume the stream to ensure all writes complete
    await res.text();

    // Check dialog_sessions
    const session = await env.DB.prepare(
      "SELECT * FROM dialog_sessions WHERE topic_id = ?"
    )
      .bind(topicId)
      .first();
    expect(session).not.toBeNull();
    expect(session!.status).toBe("ended");

    // Check dialog_logs
    const logs = await env.DB.prepare(
      "SELECT * FROM dialog_logs WHERE topic_id = ? ORDER BY created_at"
    )
      .bind(topicId)
      .all();
    expect(logs.results.length).toBeGreaterThanOrEqual(2);

    // Should have both audience and sorajiro logs
    const speakers = logs.results.map((l) => l.speaker);
    expect(speakers).toContain("audience");
    expect(speakers).toContain("sorajiro");
  });

  it("returns error SSE event for non-existent topic", async () => {
    const res = await app.request(
      "/api/dialog/start",
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ topic_id: "non-existent" }),
      },
      createMockEnv()
    );

    expect(res.status).toBe(200); // SSE always returns 200, errors are in the stream
    const events = await parseSSEResponse(res);
    const errorEvent = events.find((e) => e.event === "error");
    expect(errorEvent).toBeDefined();
    const errorData = JSON.parse(errorEvent!.data);
    expect(errorData.code).toBe("NOT_FOUND");
  });

  it("returns error SSE event when no voices exist", async () => {
    const topicId = await seedTopic({ id: "dialog-topic-no-voices" });

    const res = await app.request(
      "/api/dialog/start",
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ topic_id: topicId }),
      },
      createMockEnv()
    );

    expect(res.status).toBe(200);
    const events = await parseSSEResponse(res);
    const errorEvent = events.find((e) => e.event === "error");
    expect(errorEvent).toBeDefined();
    const errorData = JSON.parse(errorEvent!.data);
    expect(errorData.code).toBe("VALIDATION_ERROR");
    expect(errorData.message).toContain("No voices");
  });
});
