import { createRoute } from "@hono/zod-openapi";
import { getDb } from "../../shared/db/client";
import { createApp } from "../../shared/app-factory";
import { ErrorResponse } from "../../shared/schema";
import { AppError } from "./domain/entity";
import { D1VoiceRepository } from "./infra/d1-voice-repository";
import { SubmitVoiceUsecase } from "./usecase/submit-voice";
import { SubmitVoiceBody, SubmitVoiceResponse } from "./schema";

const app = createApp();

const submitVoiceRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Voice"],
  request: {
    body: { content: { "application/json": { schema: SubmitVoiceBody } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: SubmitVoiceResponse } },
      description: "視聴者の声を登録",
    },
    400: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "バリデーションエラー",
    },
  },
});

app.openapi(submitVoiceRoute, async (c) => {
  const { topic_id: topicId, text } = c.req.valid("json");

  const db = getDb(c.env.DB);
  const repo = new D1VoiceRepository(db);
  const usecase = new SubmitVoiceUsecase(repo, repo);

  try {
    const id = await usecase.execute({ topicId, text });
    return c.json({ id, ok: true as const }, 201);
  } catch (e) {
    if (e instanceof AppError) {
      return c.json(
        { ok: false as const, error: { code: "VALIDATION_ERROR" as const, message: e.message } },
        400,
      );
    }
    throw e;
  }
});

export default app;
