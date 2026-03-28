import { Hono } from "hono";
import { getDb } from "../../shared/db/client";
import { errorResponse } from "../../shared/error";
import { adminAuth } from "../../shared/middleware/admin-auth";
import { D1TopicRepository } from "./infra/d1-topic-repository";
import { CreateTopicUsecase } from "./usecase/create-topic";
import { ListTopicsUsecase } from "./usecase/list-topics";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/", adminAuth, async (c) => {
  const body = await c.req.json();

  const titleId = body.title_id;
  const onairDate = body.onair_date;
  const headline = body.headline;

  if (!titleId || !onairDate || !headline) {
    return errorResponse(
      c,
      400,
      "VALIDATION_ERROR",
      "title_id, onair_date, and headline are required"
    );
  }

  const db = getDb(c.env.DB);
  const repo = new D1TopicRepository(db);
  const usecase = new CreateTopicUsecase(repo);

  const id = await usecase.execute({
    titleId,
    onairDate,
    headline,
    cornerStartTime: body.corner_start_time ?? null,
    cornerEndTime: body.corner_end_time ?? null,
    headlineGenre: body.headline_genre ?? null,
    broadcastScript: body.broadcast_script ?? null,
  });

  return c.json({ id, ok: true }, 201);
});

app.get("/", async (c) => {
  const titleId = c.req.query("title_id");
  const onairDate = c.req.query("onair_date");

  const db = getDb(c.env.DB);
  const repo = new D1TopicRepository(db);
  const usecase = new ListTopicsUsecase(repo);

  const topics = await usecase.execute({
    titleId: titleId || undefined,
    onairDate: onairDate || undefined,
  });

  return c.json({
    items: topics.map((t) => ({
      id: t.id,
      title_id: t.titleId,
      onair_date: t.onairDate,
      headline: t.headline,
      corner_start_time: t.cornerStartTime,
      corner_end_time: t.cornerEndTime,
      headline_genre: t.headlineGenre,
    })),
  });
});

export default app;
