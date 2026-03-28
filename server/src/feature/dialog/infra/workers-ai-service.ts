import { eq, inArray } from "drizzle-orm";
import type { DrizzleDb } from "../../../shared/db/client";
import { materials } from "../../../shared/db/schema";
import type { AIService } from "../domain/ai-service";
import type { GeneratedQuestion } from "../domain/entity";

export class WorkersAIService implements AIService {
  constructor(
    private ai: Ai,
    private vectorize: VectorizeIndex,
    private db: DrizzleDb
  ) {}

  async generateQuestions(voices: string[]): Promise<GeneratedQuestion[]> {
    const voiceList = voices.map((v, i) => `${i + 1}. ${v}`).join("\n");

    const systemPrompt = `あなたは視聴者の声を集約し、代表的な質問を生成するアシスタントです。
以下の視聴者の声を分析し、共通するテーマや関心事をまとめて、3〜5個の代表的な質問を生成してください。

出力は必ず以下のJSON形式で返してください。JSON以外のテキストは含めないでください。
[
  { "text": "質問文", "basedOnCount": 関連する声の数 }
]`;

    const response = await this.ai.run(
      "@cf/meta/llama-3.1-70b-instruct" as BaseAiTextGenerationModels,
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `視聴者の声:\n${voiceList}` },
        ],
      }
    );

    try {
      const text =
        "response" in response ? (response.response as string) : "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }
      const parsed = JSON.parse(jsonMatch[0]) as GeneratedQuestion[];
      return parsed;
    } catch {
      return [
        {
          text: "この話題について詳しく教えてください。",
          basedOnCount: voices.length,
        },
      ];
    }
  }

  async generateSorajiroResponse(
    question: string,
    topicId: string
  ): Promise<{ text: string; source: string }> {
    const embeddingResult = await this.ai.run(
      "@cf/pfnet/plamo-embedding-1b" as BaseAiTextEmbeddingModels,
      {
        text: [question],
      }
    );

    const embedding = embeddingResult.data[0];

    const vectorResults = await this.vectorize.query(embedding, {
      topK: 5,
      filter: { topic_id: topicId },
    });

    let contextText = "";
    let sourceLabel = "broadcast";

    if (vectorResults.matches.length > 0) {
      const matchedIds = vectorResults.matches
        .map((m) => m.id)
        .filter((id): id is string => typeof id === "string");

      if (matchedIds.length > 0) {
        const rows = await this.db
          .select({
            type: materials.type,
            content: materials.content,
          })
          .from(materials)
          .where(inArray(materials.id, matchedIds));

        const grouped: Record<string, string[]> = {
          broadcast: [],
          unaired: [],
          opendata: [],
        };

        for (const row of rows) {
          const key = row.type in grouped ? row.type : "opendata";
          grouped[key].push(row.content);
        }

        const parts: string[] = [];
        if (grouped.broadcast.length > 0) {
          parts.push(`【放送情報】\n${grouped.broadcast.join("\n")}`);
          sourceLabel = "broadcast";
        }
        if (grouped.unaired.length > 0) {
          parts.push(`【未放送素材】\n${grouped.unaired.join("\n")}`);
          if (!parts.some((p) => p.startsWith("【放送情報】"))) {
            sourceLabel = "unaired";
          }
        }
        if (grouped.opendata.length > 0) {
          parts.push(`【オープンデータ】\n${grouped.opendata.join("\n")}`);
          if (parts.length === 1) {
            sourceLabel = "opendata";
          }
        }

        contextText = parts.join("\n\n");
      }
    }

    const systemPrompt = `あなたはソラジローAI、公平で透明性を重視するAIジャーナリストです。取材素材に基づき、視聴者の質問に誠実に回答してください。回答には必ず情報の出典層（放送情報/未放送素材/オープンデータ）を明示してください。

以下の取材素材を参考にしてください:
${contextText || "（関連する取材素材が見つかりませんでした）"}`;

    const response = await this.ai.run(
      "@cf/meta/llama-3.1-70b-instruct" as BaseAiTextGenerationModels,
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }
    );

    const text =
      "response" in response ? (response.response as string) : "";

    return {
      text: text || "申し訳ありません。回答を生成できませんでした。",
      source: sourceLabel,
    };
  }
}
