import { z } from "@hono/zod-openapi";

export const ErrorResponse = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.enum(["VALIDATION_ERROR", "UNAUTHORIZED", "NOT_FOUND", "INTERNAL_ERROR"]),
    message: z.string(),
  }),
});
