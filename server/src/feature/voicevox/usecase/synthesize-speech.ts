import type { TTSService } from "../domain/tts-service";

export class SynthesizeSpeechUsecase {
  constructor(private ttsService: TTSService) {}

  async execute(text: string, speaker: number): Promise<ArrayBuffer> {
    return this.ttsService.synthesize(text, speaker);
  }
}
