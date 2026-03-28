import { z } from "@hono/zod-openapi";

export const SubmitVoiceBody = z.object({
  topic_id: z.string().openapi({ description: "トピックID", example: "01961234-5678-7abc-def0-123456789abc" }),
  text: z.string().max(500).openapi({ description: "視聴者の声 (最大500文字)", example: "この問題についてもっと議論してほしい" }),
});

export const SubmitVoiceResponse = z.object({
  id: z.string().openapi({ description: "投稿ID" }),
  ok: z.literal(true),
});
