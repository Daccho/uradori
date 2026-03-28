import { uuidv7 } from "uuidv7";
import type { AIService } from "../domain/ai-service";
import type { DialogEvent } from "../domain/entity";
import type {
  DialogRepository,
  VoiceQueryService,
  TopicChecker,
} from "../domain/repository";

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
    private aiService: AIService
  ) {}

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

      yield {
        type: "dialog",
        question: q.text,
        speaker: "sorajiro",
        text: response.text,
        source: response.source,
      };
    }

    await this.dialogRepo.endSession(sessionId);

    yield { type: "done", sessionId };
  }
}
