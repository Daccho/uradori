import { uuidv7 } from "uuidv7";
import type { TopicRepository } from "../domain/repository";
import type {
  HackathonApiClient,
  RawCornerItem,
} from "../../ingest/domain/repository";

export class ImportError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export class ImportTopicsUsecase {
  constructor(
    private repository: TopicRepository,
    private hackathonApi: HackathonApiClient,
  ) {}

  async execute(input: {
    titleId: string;
    onairDate: string;
  }): Promise<{ createdCount: number; ids: string[]; skippedCount: number }> {
    let rawCorners: RawCornerItem[];
    try {
      rawCorners = await this.hackathonApi.fetchCornersRaw(
        input.titleId,
        input.onairDate,
      );
    } catch (e) {
      throw new ImportError(
        "EXTERNAL_API_ERROR",
        e instanceof Error ? e.message : "外部APIの呼び出しに失敗しました",
      );
    }

    const existing = await this.repository.findByTitleAndDate(
      input.titleId,
      input.onairDate,
    );
    const existingHeadlines = new Set(existing.map((t) => t.headline));

    const ids: string[] = [];
    let skippedCount = 0;

    for (const corner of rawCorners) {
      const headline = corner.headline;
      if (!headline) {
        console.warn("[ImportTopics] Skipping corner item without headline");
        skippedCount++;
        continue;
      }

      if (existingHeadlines.has(headline)) {
        skippedCount++;
        continue;
      }

      const id = uuidv7();
      await this.repository.create({
        id,
        titleId: input.titleId,
        onairDate: input.onairDate,
        headline,
        cornerStartTime: corner.corner_start_time ?? null,
        cornerEndTime: corner.corner_end_time ?? null,
        headlineGenre: corner.headline_genre ?? null,
        broadcastScript: corner.broadcast_script ?? null,
      });
      ids.push(id);
      existingHeadlines.add(headline);
    }

    return { createdCount: ids.length, ids, skippedCount };
  }
}
