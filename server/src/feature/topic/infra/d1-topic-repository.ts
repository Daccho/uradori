import { eq, and } from "drizzle-orm";
import type { DrizzleDb } from "../../../shared/db/client";
import { topics } from "../../../shared/db/schema";
import type { Topic, ListTopicsFilter } from "../domain/entity";
import type { TopicRepository } from "../domain/repository";

export class D1TopicRepository implements TopicRepository {
  constructor(private db: DrizzleDb) {}

  async create(topic: Topic): Promise<void> {
    await this.db.insert(topics).values(topic);
  }

  async findById(id: string): Promise<Topic | null> {
    const row = await this.db
      .select()
      .from(topics)
      .where(eq(topics.id, id))
      .get();
    return row ?? null;
  }

  async findByTitleAndDate(titleId: string, onairDate: string): Promise<Topic[]> {
    return this.db
      .select()
      .from(topics)
      .where(and(eq(topics.titleId, titleId), eq(topics.onairDate, onairDate)))
      .all();
  }

  async list(filter: ListTopicsFilter): Promise<Topic[]> {
    const conditions = [];
    if (filter.titleId) {
      conditions.push(eq(topics.titleId, filter.titleId));
    }
    if (filter.onairDate) {
      conditions.push(eq(topics.onairDate, filter.onairDate));
    }

    if (conditions.length === 0) {
      return this.db.select().from(topics).all();
    }

    return this.db
      .select()
      .from(topics)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .all();
  }
}
