import type { EmbeddingService } from "../domain/repository";

export class WorkersEmbeddingService implements EmbeddingService {
  constructor(
    private ai: Ai,
    private vectorize: VectorizeIndex
  ) {}

  async embed(text: string): Promise<number[]> {
    const result = await this.ai.run("@cf/baai/bge-m3" as BaseAiTextEmbeddingModels, {
      text: [text],
    });
    return result.data[0];
  }

  async upsertVector(
    id: string,
    values: number[],
    metadata: Record<string, string>
  ): Promise<void> {
    await this.vectorize.upsert([{ id, values, metadata }]);
  }
}
