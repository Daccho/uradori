import { createRoute } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";
import { getDb } from "../../shared/db/client";
import { createApp } from "../../shared/app-factory";
import { ErrorResponse } from "../../shared/schema";
import { D1DialogRepository } from "./infra/d1-dialog-repository";
import { WorkersAIService } from "./infra/workers-ai-service";
import { StartDialogUsecase, AppError } from "./usecase/start-dialog";
import { StartDialogBody } from "./schema";

const app = createApp();

const startDialogRoute = createRoute({
  method: "post",
  path: "/start",
  tags: ["Dialog"],
  request: {
    body: { content: { "application/json": { schema: StartDialogBody } } },
  },
  responses: {
    200: {
      description:
        "SSEストリーム。イベント: questions (質問一覧), dialog (AI対話), done (完了), error (エラー)",
      content: { "text/event-stream": { schema: { type: "string" } } },
    },
    400: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "バリデーションエラー",
    },
  },
});

app.openapi(startDialogRoute, async (c) => {
  const { topic_id } = c.req.valid("json");

  const db = getDb(c.env.DB);
  const repo = new D1DialogRepository(db);
  const aiService = new WorkersAIService(c.env.AI, c.env.VECTORIZE, db);
  const usecase = new StartDialogUsecase(repo, repo, repo, aiService);

  return streamSSE(c, async (stream) => {
    try {
      for await (const event of usecase.execute(topic_id)) {
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
  }) as any;
});

export default app;
