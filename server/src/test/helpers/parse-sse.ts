export type SSEEvent = {
  event: string;
  data: string;
};

export async function parseSSEResponse(
  response: Response
): Promise<SSEEvent[]> {
  const text = await response.text();
  const events: SSEEvent[] = [];

  const blocks = text.split("\n\n").filter(Boolean);
  for (const block of blocks) {
    const lines = block.split("\n");
    let event = "";
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        event = line.slice(7);
      } else if (line.startsWith("data: ")) {
        data = line.slice(6);
      }
    }
    if (event && data) {
      events.push({ event, data });
    }
  }

  return events;
}
