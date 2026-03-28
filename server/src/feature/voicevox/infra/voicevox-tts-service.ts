import type { TTSService } from "../domain/tts-service";

export class VoicevoxTTSService implements TTSService {
  constructor(private baseUrl: string) {}

  async synthesize(text: string, speaker: number): Promise<ArrayBuffer> {
    // Step 1: audio_query
    const queryRes = await fetch(
      `${this.baseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`,
      { method: "POST" }
    );

    if (!queryRes.ok) {
      throw new Error(`VOICEVOX audio_query failed: ${queryRes.status}`);
    }

    const queryJson = await queryRes.json();

    // Step 2: synthesis
    const synthRes = await fetch(
      `${this.baseUrl}/synthesis?speaker=${speaker}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queryJson),
      }
    );

    if (!synthRes.ok) {
      throw new Error(`VOICEVOX synthesis failed: ${synthRes.status}`);
    }

    return synthRes.arrayBuffer();
  }
}
