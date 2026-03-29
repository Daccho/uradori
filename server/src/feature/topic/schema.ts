import { z } from "@hono/zod-openapi";

export const CreateTopicBody = z.object({
  title_id: z.string().openapi({ description: "番組ID", example: "news-morning" }),
  onair_date: z.string().openapi({ description: "放送日 (YYYY-MM-DD)", example: "2026-03-29" }),
  headline: z.string().openapi({ description: "見出し", example: "今日のニュース" }),
  corner_start_time: z.string().nullable().optional().openapi({ description: "コーナー開始時刻" }),
  corner_end_time: z.string().nullable().optional().openapi({ description: "コーナー終了時刻" }),
  headline_genre: z.string().nullable().optional().openapi({ description: "見出しジャンル" }),
  broadcast_script: z.string().nullable().optional().openapi({ description: "放送台本" }),
});

export const CreateTopicResponse = z.object({
  id: z.string().openapi({ description: "トピックID" }),
  ok: z.literal(true),
});

export const ListTopicsQuery = z.object({
  title_id: z.string().optional().openapi({ description: "番組IDでフィルタ" }),
  onair_date: z.string().optional().openapi({ description: "放送日でフィルタ" }),
});

export const ImportTopicsBody = z.object({
  title_id: z.string().openapi({ description: "番組ID", example: "ﾐ00C" }),
  onair_date: z.string().openapi({ description: "放送日 (YYYY-MM-DD)", example: "2026-03-29" }),
});

export const ImportTopicsResponse = z.object({
  ok: z.literal(true),
  created_count: z.number().int().openapi({ description: "作成されたトピック数" }),
  ids: z.array(z.string()).openapi({ description: "作成されたトピックIDの一覧" }),
  skipped_count: z.number().int().openapi({ description: "重複スキップ数" }),
});

export const ListTopicsResponse = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title_id: z.string(),
      onair_date: z.string(),
      headline: z.string(),
      corner_start_time: z.string().nullable(),
      corner_end_time: z.string().nullable(),
      headline_genre: z.string().nullable(),
    })
  ),
});
