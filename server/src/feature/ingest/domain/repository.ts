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

export type RawCornerItem = {
  headline?: string;
  corner_start_time?: string;
  corner_end_time?: string;
  headline_genre?: string;
  broadcast_script?: string;
  [key: string]: unknown;
};

export interface HackathonApiClient {
  fetchCorners(
    titleId: string,
    onairDate: string
  ): Promise<{ content: string; type: string }[]>;
  fetchCornersRaw(
    titleId: string,
    onairDate: string
  ): Promise<RawCornerItem[]>;
  fetchNews(titleId: string): Promise<{ content: string; type: string }[]>;
  fetchYoutube(titleId: string): Promise<{ content: string; type: string }[]>;
}
