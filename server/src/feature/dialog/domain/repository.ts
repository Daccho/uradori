import type { DialogSession, DialogLog } from "./entity";

export interface DialogRepository {
  createSession(session: DialogSession): Promise<void>;
  endSession(sessionId: string): Promise<void>;
  createLog(log: DialogLog): Promise<void>;
}

export interface VoiceQueryService {
  getVoicesByTopicId(topicId: string): Promise<{ text: string }[]>;
}

export interface TopicChecker {
  exists(topicId: string): Promise<boolean>;
}
