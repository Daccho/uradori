import { uuidv7 } from "uuidv7";
import type { IngestInput } from "../domain/entity";
import type {
  EmbeddingService,
  HackathonApiClient,
  MaterialRepository,
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

export class IngestMaterialUsecase {
  constructor(
    private materialRepo: MaterialRepository,
    private embeddingService: EmbeddingService,
    private topicChecker: TopicChecker,
    private hackathonApi: HackathonApiClient
  ) {}

  async execute(input: IngestInput): Promise<number> {
    const topicExists = await this.topicChecker.exists(input.topicId);
    if (!topicExists) {
      throw new AppError("NOT_FOUND", `Topic ${input.topicId} not found`);
    }

    if (input.mode === "manual") {
      const materialId = uuidv7();
      const vector = await this.embeddingService.embed(input.content);
      await this.embeddingService.upsertVector(materialId, vector, {
        topic_id: input.topicId,
        type: input.type,
      });
      await this.materialRepo.create({
        id: materialId,
        topicId: input.topicId,
        type: input.type,
        content: input.content,
        vectorizeId: materialId,
      });
      return 1;
    }

    // mode === 'auto'
    const topic = await this.topicChecker.getTopicById(input.topicId);
    if (!topic) {
      throw new AppError("NOT_FOUND", `Topic ${input.topicId} not found`);
    }

    let totalCount = 0;

    for (const source of input.sources) {
      let items: { content: string; type: string }[] = [];

      switch (source) {
        case "corners":
          items = await this.hackathonApi.fetchCorners(
            topic.titleId,
            topic.onairDate
          );
          break;
        case "news":
          items = await this.hackathonApi.fetchNews(topic.titleId);
          break;
        case "youtube":
          items = await this.hackathonApi.fetchYoutube(topic.titleId);
          break;
      }

      for (const item of items) {
        const materialId = uuidv7();
        const vector = await this.embeddingService.embed(item.content);
        await this.embeddingService.upsertVector(materialId, vector, {
          topic_id: input.topicId,
          type: item.type,
        });
        await this.materialRepo.create({
          id: materialId,
          topicId: input.topicId,
          type: item.type,
          content: item.content,
          vectorizeId: materialId,
        });
        totalCount++;
      }
    }

    return totalCount;
  }
}
