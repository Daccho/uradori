import { env } from "cloudflare:test";

export const TEST_ADMIN_KEY = "test-admin-key";

export function adminHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Admin-Key": TEST_ADMIN_KEY,
  };
}

export function jsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

export async function seedTopic(
  overrides: Partial<{
    id: string;
    titleId: string;
    onairDate: string;
    headline: string;
  }> = {}
): Promise<string> {
  const id = overrides.id ?? "test-topic-001";
  const titleId = overrides.titleId ?? "test-title";
  const onairDate = overrides.onairDate ?? "2026-03-29";
  const headline = overrides.headline ?? "テスト見出し";

  await env.DB.prepare(
    "INSERT INTO topics (id, title_id, onair_date, headline) VALUES (?, ?, ?, ?)"
  )
    .bind(id, titleId, onairDate, headline)
    .run();

  return id;
}

export async function seedVoice(
  topicId: string,
  text: string = "テストの声"
): Promise<string> {
  const id = "test-voice-" + Math.random().toString(36).slice(2, 8);

  await env.DB.prepare(
    "INSERT INTO audience_voices (id, topic_id, text) VALUES (?, ?, ?)"
  )
    .bind(id, topicId, text)
    .run();

  return id;
}
