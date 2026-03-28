import { z } from "@hono/zod-openapi";

export const SynthesisBody = z.object({
  text: z.string().openapi({ description: "読み上げテキスト", example: "こんにちは" }),
  speaker: z.number().int().optional().default(1).openapi({ description: "話者ID", example: 1 }),
});
