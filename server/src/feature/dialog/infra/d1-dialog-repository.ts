import { eq } from "drizzle-orm";
import type { DrizzleDb } from "../../../shared/db/client";
import {
  dialogSessions,
  dialogLogs,
  audienceVoices,
  topics,
} from "../../../shared/db/schema";
import type { DialogSession, DialogLog } from "../domain/entity";
import type { DialogRepository, VoiceQueryService, TopicChecker } from "../domain/repository";

export class D1DialogRepository
  implements DialogRepository, VoiceQueryService, TopicChecker
{
  constructor(private db: DrizzleDb) {}

  async createSession(session: DialogSession): Promise<void> {
    await this.db.insert(dialogSessions).values({
      id: session.id,
      topicId: session.topicId,
      status: session.status,
      createdAt: session.createdAt,
    });
  }

  async endSession(sessionId: string): Promise<void> {
    await this.db
      .update(dialogSessions)
      .set({
        status: "ended",
        endedAt: new Date().toISOString(),
      })
      .where(eq(dialogSessions.id, sessionId));
  }

  async createLog(log: DialogLog): Promise<void> {
    await this.db.insert(dialogLogs).values({
      id: log.id,
      sessionId: log.sessionId,
      topicId: log.topicId,
      speaker: log.speaker,
      text: log.text,
      source: log.source,
      createdAt: log.createdAt,
    });
  }

  async getVoicesByTopicId(topicId: string): Promise<{ text: string }[]> {
    const rows = await this.db
      .select({ text: audienceVoices.text })
      .from(audienceVoices)
      .where(eq(audienceVoices.topicId, topicId));
    return rows;
  }

  async exists(topicId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: topics.id })
      .from(topics)
      .where(eq(topics.id, topicId))
      .limit(1);
    return rows.length > 0;
  }
}
