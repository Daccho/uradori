import { Hono } from "hono";
import { getDb } from "../../shared/db/client";
import { errorResponse } from "../../shared/error";
import { AppError } from "./domain/entity";
import { D1VoiceRepository } from "./infra/d1-voice-repository";
import { SubmitVoiceUsecase } from "./usecase/submit-voice";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/", async (c) => {
  const body = await c.req.json();

  const topicId = body.topic_id;
  const text = body.text;

  if (!topicId || !text) {
    return errorResponse(
      c,
      400,
      "VALIDATION_ERROR",
      "topic_id and text are required"
    );
  }

  const db = getDb(c.env.DB);
  const repo = new D1VoiceRepository(db);
  const usecase = new SubmitVoiceUsecase(repo, repo);

  try {
    const id = await usecase.execute({ topicId, text });
    return c.json({ id, ok: true }, 201);
  } catch (e) {
    if (e instanceof AppError) {
      return errorResponse(c, 400, "VALIDATION_ERROR", e.message);
    }
    throw e;
  }
});

export default app;
