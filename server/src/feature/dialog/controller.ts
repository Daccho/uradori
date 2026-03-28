import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { getDb } from "../../shared/db/client";
import { errorResponse } from "../../shared/error";
import { D1DialogRepository } from "./infra/d1-dialog-repository";
import { WorkersAIService } from "./infra/workers-ai-service";
import { StartDialogUsecase, AppError } from "./usecase/start-dialog";

const dialog = new Hono<{ Bindings: CloudflareBindings }>();

dialog.post("/start", async (c) => {
  const body = await c.req.json<{ topic_id?: string }>();

  if (!body.topic_id) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "topic_id is required");
  }

  const db = getDb(c.env.DB);
  const repo = new D1DialogRepository(db);
  const aiService = new WorkersAIService(c.env.AI, c.env.VECTORIZE, db);
  const usecase = new StartDialogUsecase(repo, repo, repo, aiService);

  return streamSSE(c, async (stream) => {
    try {
      for await (const event of usecase.execute(body.topic_id!)) {
        let data: string;
        switch (event.type) {
          case "questions":
            data = JSON.stringify({ questions: event.questions });
            break;
          case "dialog":
            data = JSON.stringify({
              question: event.question,
              speaker: event.speaker,
              text: event.text,
              source: event.source,
            });
            break;
          case "done":
            data = JSON.stringify({ session_id: event.sessionId });
            break;
        }
        await stream.writeSSE({ event: event.type, data });
      }
    } catch (err) {
      if (err instanceof AppError) {
        const errorData = JSON.stringify({
          code: err.code,
          message: err.message,
        });
        await stream.writeSSE({ event: "error", data: errorData });
      } else {
        const errorData = JSON.stringify({
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        });
        await stream.writeSSE({ event: "error", data: errorData });
      }
    }
  });
});

export default dialog;
