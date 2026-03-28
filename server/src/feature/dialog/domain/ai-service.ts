import type { GeneratedQuestion } from "./entity";

export interface AIService {
  generateQuestions(voices: string[]): Promise<GeneratedQuestion[]>;
  generateSorajiroResponse(
    question: string,
    topicId: string
  ): Promise<{ text: string; source: string }>;
}
