import { uuidv7 } from "uuidv7";
import type { AIService } from "../domain/ai-service";
import type { DialogEvent } from "../domain/entity";
import type {
  DialogRepository,
  VoiceQueryService,
  TopicChecker,
} from "../domain/repository";
import type { TTSService } from "../../tts/domain/tts-service";
import type { TTSCache } from "../../tts/domain/tts-cache";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export class StartDialogUsecase {
  constructor(
    private dialogRepo: DialogRepository,
    private voiceQuery: VoiceQueryService,
    private topicChecker: TopicChecker,
    private aiService: AIService,
    private ttsService?: TTSService,
    private ttsCache?: TTSCache
  ) {}

  private async synthesizeAndCache(
    text: string,
    speaker: string
  ): Promise<string | undefined> {
    if (!this.ttsService || !this.ttsCache) return undefined;
    try {
      const data = new TextEncoder().encode(`${speaker}:${text}`);
      const hash = await crypto.subtle.digest("SHA-256", data);
      const key = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const cached = await this.ttsCache.get(key);
      if (!cached) {
        const audio = await this.ttsService.synthesize(text, speaker);
        await this.ttsCache.put(key, audio);
      }
      return key;
    } catch {
      return undefined;
    }
  }

  async *execute(topicId: string): AsyncGenerator<DialogEvent> {
    const topicExists = await this.topicChecker.exists(topicId);
    if (!topicExists) {
      throw new AppError("NOT_FOUND", "Topic not found");
    }

    const voices = await this.voiceQuery.getVoicesByTopicId(topicId);
    if (voices.length === 0) {
      throw new AppError("VALIDATION_ERROR", "No voices found");
    }

    const sessionId = uuidv7();
    await this.dialogRepo.createSession({
      id: sessionId,
      topicId,
      status: "active",
      createdAt: new Date().toISOString(),
    });

    const voiceTexts = voices.map((v) => v.text);
    const questions = await this.aiService.generateQuestions(voiceTexts);

    yield { type: "questions", questions };

    for (const q of questions) {
      const questionLogId = uuidv7();
      await this.dialogRepo.createLog({
        id: questionLogId,
        sessionId,
        topicId,
        speaker: "audience",
        text: q.text,
        createdAt: new Date().toISOString(),
      });

      // 視聴者代表AIの質問: TTS合成 + 送出
      const audienceAudioKey = await this.synthesizeAndCache(
        q.text,
        "audience"
      );
      yield {
        type: "dialog",
        question: q.text,
        speaker: "audience",
        text: q.text,
        audioUrl: audienceAudioKey
          ? `/api/tts/audio/${audienceAudioKey}`
          : undefined,
      };

      const response = await this.aiService.generateSorajiroResponse(
        q.text,
        topicId
      );

      const responseLogId = uuidv7();
      await this.dialogRepo.createLog({
        id: responseLogId,
        sessionId,
        topicId,
        speaker: "sorajiro",
        text: response.text,
        source: response.source,
        createdAt: new Date().toISOString(),
      });

      // ソラジローAIの応答: TTS合成 + 送出
      const sorajiroAudioKey = await this.synthesizeAndCache(
        response.text,
        "sorajiro"
      );
      yield {
        type: "dialog",
        question: q.text,
        speaker: "sorajiro",
        text: response.text,
        source: response.source,
        audioUrl: sorajiroAudioKey
          ? `/api/tts/audio/${sorajiroAudioKey}`
          : undefined,
      };
    }

    await this.dialogRepo.endSession(sessionId);

    yield { type: "done", sessionId };
  }
}
