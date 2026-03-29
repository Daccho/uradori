import { z } from "@hono/zod-openapi";

export const SynthesisBody = z.object({
  text: z
    .string()
    .openapi({ description: "読み上げテキスト", example: "こんにちは" }),
  speaker: z
    .string()
    .optional()
    .default("sorajiro")
    .openapi({
      description: "話者 (sorajiro | audience)",
      example: "sorajiro",
    }),
});
