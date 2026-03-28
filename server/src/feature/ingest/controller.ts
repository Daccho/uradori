import { createRoute } from "@hono/zod-openapi";
import { getDb } from "../../shared/db/client";
import { createApp } from "../../shared/app-factory";
import { ErrorResponse } from "../../shared/schema";
import { adminAuth } from "../../shared/middleware/admin-auth";
import { D1MaterialRepository } from "./infra/d1-material-repository";
import { WorkersEmbeddingService } from "./infra/embedding-service";
import { WorkersHackathonApiClient } from "./infra/hackathon-api-client";
import { AppError, IngestMaterialUsecase } from "./usecase/ingest-material";
import { IngestBody, IngestResponse } from "./schema";

const app = createApp();

const ingestRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Ingest"],
  security: [{ AdminKey: [] }],
  request: {
    body: { content: { "application/json": { schema: IngestBody } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: IngestResponse } },
      description: "素材をVectorizeに登録",
    },
    400: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "バリデーションエラー",
    },
    401: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "認証エラー",
    },
    404: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "トピックが見つからない",
    },
  },
  middleware: [adminAuth] as const,
});

app.openapi(ingestRoute, async (c) => {
  const body = c.req.valid("json");

  const db = getDb(c.env.DB);
  const repo = new D1MaterialRepository(db);
  const embedding = new WorkersEmbeddingService(c.env.AI, c.env.VECTORIZE);
  const apiClient = new WorkersHackathonApiClient(
    c.env.HACKATHON_API_URL,
    c.env.HACKATHON_API_KEY
  );
  const usecase = new IngestMaterialUsecase(repo, embedding, repo, apiClient);

  const input =
    body.mode === "auto"
      ? { mode: "auto" as const, topicId: body.topic_id, sources: body.sources }
      : {
          mode: "manual" as const,
          topicId: body.topic_id,
          content: body.content,
          type: body.type,
          sourceUrl: body.source_url,
        };

  try {
    const indexedCount = await usecase.execute(input);
    return c.json({ ok: true as const, indexed_count: indexedCount }, 201);
  } catch (e) {
    if (e instanceof AppError) {
      if (e.code === "NOT_FOUND") {
        return c.json(
          { ok: false as const, error: { code: "NOT_FOUND" as const, message: e.message } },
          404,
        );
      }
      return c.json(
        { ok: false as const, error: { code: "VALIDATION_ERROR" as const, message: e.message } },
        400,
      );
    }
    throw e;
  }
});

export default app;
