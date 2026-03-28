import type { AudienceVoice } from "./entity";

export interface AudienceVoiceRepository {
  create(voice: AudienceVoice): Promise<void>;
  findByTopicId(topicId: string): Promise<AudienceVoice[]>;
}

export interface TopicExistenceChecker {
  exists(topicId: string): Promise<boolean>;
}
