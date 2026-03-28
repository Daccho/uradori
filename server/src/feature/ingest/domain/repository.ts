import type { Material } from "./entity";

export interface MaterialRepository {
  create(material: Material): Promise<void>;
}

export interface EmbeddingService {
  embed(text: string): Promise<number[]>;
  upsertVector(
    id: string,
    values: number[],
    metadata: Record<string, string>
  ): Promise<void>;
}

export interface TopicChecker {
  exists(topicId: string): Promise<boolean>;
  getTopicById(
    id: string
  ): Promise<{ titleId: string; onairDate: string } | null>;
}

export interface HackathonApiClient {
  fetchCorners(
    titleId: string,
    onairDate: string
  ): Promise<{ content: string; type: string }[]>;
  fetchNews(titleId: string): Promise<{ content: string; type: string }[]>;
  fetchYoutube(titleId: string): Promise<{ content: string; type: string }[]>;
}
