import { eq } from "drizzle-orm";
import type { DrizzleDb } from "../../../shared/db/client";
import { audienceVoices, topics } from "../../../shared/db/schema";
import type { AudienceVoice } from "../domain/entity";
import type {
  AudienceVoiceRepository,
  TopicExistenceChecker,
} from "../domain/repository";

export class D1VoiceRepository
  implements AudienceVoiceRepository, TopicExistenceChecker
{
  constructor(private db: DrizzleDb) {}

  async create(voice: AudienceVoice): Promise<void> {
    await this.db.insert(audienceVoices).values(voice);
  }

  async findByTopicId(topicId: string): Promise<AudienceVoice[]> {
    return this.db
      .select()
      .from(audienceVoices)
      .where(eq(audienceVoices.topicId, topicId))
      .all();
  }

  async exists(topicId: string): Promise<boolean> {
    const row = await this.db
      .select()
      .from(topics)
      .where(eq(topics.id, topicId))
      .get();
    return row !== undefined;
  }
}
