import { z } from "@hono/zod-openapi";

const IngestAutoBody = z.object({
  mode: z.literal("auto"),
  topic_id: z.string().openapi({ description: "トピックID" }),
  sources: z
    .array(z.enum(["corners", "news", "youtube"]))
    .min(1)
    .openapi({ description: "取得元ソース一覧" }),
});

const IngestManualBody = z.object({
  mode: z.literal("manual"),
  topic_id: z.string().openapi({ description: "トピックID" }),
  content: z.string().openapi({ description: "素材コンテンツ" }),
  type: z.literal("opendata").openapi({ description: "素材タイプ" }),
  source_url: z.string().optional().openapi({ description: "ソースURL" }),
});

export const IngestBody = z
  .discriminatedUnion("mode", [IngestAutoBody, IngestManualBody])
  .openapi({ description: "mode: 'auto' または 'manual'" });

export const IngestResponse = z.object({
  ok: z.literal(true),
  indexed_count: z.number().int().openapi({ description: "インデックス登録件数" }),
});
