import { eq } from "drizzle-orm";
import type { DrizzleDb } from "../../../shared/db/client";
import { materials, topics } from "../../../shared/db/schema";
import type { Material } from "../domain/entity";
import type { MaterialRepository, TopicChecker } from "../domain/repository";

export class D1MaterialRepository implements MaterialRepository, TopicChecker {
  constructor(private db: DrizzleDb) {}

  async exists(topicId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: topics.id })
      .from(topics)
      .where(eq(topics.id, topicId))
      .limit(1);
    return rows.length > 0;
  }

  async getTopicById(
    id: string
  ): Promise<{ titleId: string; onairDate: string } | null> {
    const rows = await this.db
      .select({ titleId: topics.titleId, onairDate: topics.onairDate })
      .from(topics)
      .where(eq(topics.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async create(material: Material): Promise<void> {
    await this.db.insert(materials).values({
      id: material.id,
      topicId: material.topicId,
      type: material.type,
      content: material.content,
      vectorizeId: material.vectorizeId ?? null,
    });
  }
}
