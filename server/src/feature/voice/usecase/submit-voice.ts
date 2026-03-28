import { uuidv7 } from "uuidv7";
import type { AudienceVoice, SubmitVoiceInput } from "../domain/entity";
import { AppError } from "../domain/entity";
import type {
  AudienceVoiceRepository,
  TopicExistenceChecker,
} from "../domain/repository";

export class SubmitVoiceUsecase {
  constructor(
    private repository: AudienceVoiceRepository,
    private topicChecker: TopicExistenceChecker
  ) {}

  async execute(input: SubmitVoiceInput): Promise<string> {
    if (input.text.length > 500) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Text must be 500 characters or less"
      );
    }

    const topicExists = await this.topicChecker.exists(input.topicId);
    if (!topicExists) {
      throw new AppError("VALIDATION_ERROR", "Topic not found");
    }

    const id = uuidv7();
    const voice: AudienceVoice = {
      id,
      topicId: input.topicId,
      text: input.text,
      createdAt: null,
    };

    await this.repository.create(voice);
    return id;
  }
}
