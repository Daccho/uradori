import type { TopicItem } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function fetchTopics(
  titleId?: string,
  onairDate?: string
): Promise<TopicItem[]> {
  const params = new URLSearchParams();
  if (titleId) params.set("title_id", titleId);
  if (onairDate) params.set("onair_date", onairDate);

  const url = `${BASE_URL}/api/topics${params.size ? `?${params}` : ""}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Failed to fetch topics: ${res.status}`);

  const data = await res.json();
  return data.items as TopicItem[];
}

export async function postVoice(
  topicId: string,
  text: string
): Promise<{ id: string }> {
  const res = await fetch(`${BASE_URL}/api/voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic_id: topicId, text }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error?.message ?? `Failed to post voice: ${res.status}`);
  }

  return res.json();
}

export async function fetchTTSAudio(
  text: string,
  speaker: "sorajiro" | "audience" = "sorajiro"
): Promise<ArrayBuffer> {
  const res = await fetch(`${BASE_URL}/api/tts/synthesis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, speaker }),
  });

  if (!res.ok) throw new Error(`TTS synthesis failed: ${res.status}`);

  return res.arrayBuffer();
}
