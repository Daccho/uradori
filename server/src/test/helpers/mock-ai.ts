import type { GeneratedQuestion } from "../../feature/dialog/domain/entity";

/** Mock AI binding that returns deterministic responses */
export function createMockAI() {
  return {
    run: async (model: string, input: unknown) => {
      if (model.includes("bge-m3")) {
        // Embedding model - return a fixed 1024-dim vector
        return { data: [new Array(1024).fill(0.1)] };
      }
      if (model.includes("llama")) {
        // LLM model - return deterministic JSON
        const messages = (input as { messages: { role: string; content: string }[] }).messages;
        const userMessage = messages.find((m) => m.role === "user")?.content ?? "";

        if (userMessage.includes("視聴者の声")) {
          // Question generation
          const questions: GeneratedQuestion[] = [
            { text: "テスト質問1: この問題についてどう思いますか？", basedOnCount: 3 },
            { text: "テスト質問2: 今後の見通しは？", basedOnCount: 2 },
          ];
          return { response: JSON.stringify(questions) };
        }

        // Sorajiro response
        return {
          response: `テスト回答: ${userMessage.slice(0, 50)}`,
        };
      }
      return { response: "" };
    },
  } as unknown as Ai;
}

/** Mock Vectorize binding */
export function createMockVectorize() {
  return {
    query: async () => ({
      matches: [],
      count: 0,
    }),
    upsert: async () => ({
      mutationId: "mock-mutation-id",
      count: 0,
      ids: [],
    }),
    insert: async () => ({
      mutationId: "mock-mutation-id",
      count: 0,
      ids: [],
    }),
  } as unknown as VectorizeIndex;
}
