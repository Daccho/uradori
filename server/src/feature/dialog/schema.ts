import { z } from "@hono/zod-openapi";

export const StartDialogBody = z.object({
  topic_id: z.string().openapi({ description: "トピックID", example: "01961234-5678-7abc-def0-123456789abc" }),
});
