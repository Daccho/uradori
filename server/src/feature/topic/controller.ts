import { createRoute } from "@hono/zod-openapi";
import { getDb } from "../../shared/db/client";
import { createApp } from "../../shared/app-factory";
import { ErrorResponse } from "../../shared/schema";
import { adminAuth } from "../../shared/middleware/admin-auth";
import { D1TopicRepository } from "./infra/d1-topic-repository";
import { CreateTopicUsecase } from "./usecase/create-topic";
import { ListTopicsUsecase } from "./usecase/list-topics";
import {
  CreateTopicBody,
  CreateTopicResponse,
  ListTopicsQuery,
  ListTopicsResponse,
} from "./schema";

const app = createApp();

const createTopicRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Topics"],
  security: [{ AdminKey: [] }],
  request: {
    body: { content: { "application/json": { schema: CreateTopicBody } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: CreateTopicResponse } },
      description: "トピック登録",
    },
    400: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "バリデーションエラー",
    },
    401: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "認証エラー",
    },
  },
  middleware: [adminAuth] as const,
});

const listTopicsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Topics"],
  request: {
    query: ListTopicsQuery,
  },
  responses: {
    200: {
      content: { "application/json": { schema: ListTopicsResponse } },
      description: "トピック一覧",
    },
  },
});

app.openapi(createTopicRoute, async (c) => {
  const body = c.req.valid("json");

  const db = getDb(c.env.DB);
  const repo = new D1TopicRepository(db);
  const usecase = new CreateTopicUsecase(repo);

  const id = await usecase.execute({
    titleId: body.title_id,
    onairDate: body.onair_date,
    headline: body.headline,
    cornerStartTime: body.corner_start_time ?? null,
    cornerEndTime: body.corner_end_time ?? null,
    headlineGenre: body.headline_genre ?? null,
    broadcastScript: body.broadcast_script ?? null,
  });

  return c.json({ id, ok: true as const }, 201);
});

app.openapi(listTopicsRoute, async (c) => {
  const { title_id: titleId, onair_date: onairDate } = c.req.valid("query");

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
      corner_start_time: t.cornerStartTime ?? null,
      corner_end_time: t.cornerEndTime ?? null,
      headline_genre: t.headlineGenre ?? null,
    })),
  });
});

export default app;
