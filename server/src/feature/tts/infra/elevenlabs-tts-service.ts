import type { TTSService } from "../domain/tts-service";

export class ElevenLabsTTSService implements TTSService {
  constructor(
    private apiKey: string,
    private voiceIdMap: { sorajiro: string; audience: string }
  ) {}

  async synthesize(text: string, speaker: string): Promise<ArrayBuffer> {
    const voiceId =
      speaker === "audience"
        ? this.voiceIdMap.audience
        : this.voiceIdMap.sorajiro;

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`ElevenLabs synthesis failed: ${res.status}`);
    }

    return res.arrayBuffer();
  }
}
