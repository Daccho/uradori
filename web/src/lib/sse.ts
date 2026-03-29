import type { DialogStreamEvent } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function* streamDialogSSE(
  topicId: string,
  signal?: AbortSignal
): AsyncGenerator<DialogStreamEvent> {
  const response = await fetch(`${BASE_URL}/api/dialog/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic_id: topicId }),
    signal,
  });

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error?.message ?? `Dialog stream failed: ${response.status}`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ") && currentEvent) {
          const data = JSON.parse(line.slice(6));
          yield { type: currentEvent, ...data } as DialogStreamEvent;
          currentEvent = "";
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
