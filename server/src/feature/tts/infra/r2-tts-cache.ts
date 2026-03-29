import type { TTSCache } from "../domain/tts-cache";

export class R2TTSCache implements TTSCache {
  constructor(private bucket: R2Bucket) {}

  private async hashKey(speaker: string, text: string): Promise<string> {
    const data = new TextEncoder().encode(`${speaker}:${text}`);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    return obj.arrayBuffer();
  }

  async put(key: string, data: ArrayBuffer): Promise<string> {
    await this.bucket.put(key, data, {
      httpMetadata: { contentType: "audio/mpeg" },
    });
    return key;
  }

  async getOrCreate(
    speaker: string,
    text: string,
    synthesize: () => Promise<ArrayBuffer>
  ): Promise<{ key: string; data: ArrayBuffer }> {
    const key = await this.hashKey(speaker, text);
    const cached = await this.get(key);
    if (cached) return { key, data: cached };

    const data = await synthesize();
    await this.put(key, data);
    return { key, data };
  }
}
