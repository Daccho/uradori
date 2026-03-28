import type { HackathonApiClient } from "../domain/repository";

export class WorkersHackathonApiClient implements HackathonApiClient {
  constructor(
    private apiUrl: string,
    private apiKey: string
  ) {}

  async fetchCorners(
    titleId: string,
    onairDate: string
  ): Promise<{ content: string; type: string }[]> {
    const url = `${this.apiUrl}/corners?title_id=${encodeURIComponent(titleId)}&onair_date=${encodeURIComponent(onairDate)}`;
    const res = await fetch(url, {
      headers: { "X-Api-Key": this.apiKey },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown[];
    return data.map((item) => ({
      content: JSON.stringify(item),
      type: "broadcast",
    }));
  }

  async fetchNews(
    titleId: string
  ): Promise<{ content: string; type: string }[]> {
    const url = `${this.apiUrl}/news?title_id=${encodeURIComponent(titleId)}`;
    const res = await fetch(url, {
      headers: { "X-Api-Key": this.apiKey },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown[];
    return data.map((item) => ({
      content: JSON.stringify(item),
      type: "unaired",
    }));
  }

  async fetchYoutube(
    titleId: string
  ): Promise<{ content: string; type: string }[]> {
    const url = `${this.apiUrl}/youtube?title_id=${encodeURIComponent(titleId)}`;
    const res = await fetch(url, {
      headers: { "X-Api-Key": this.apiKey },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown[];
    return data.map((item) => ({
      content: JSON.stringify(item),
      type: "unaired",
    }));
  }
}
