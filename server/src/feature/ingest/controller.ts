import { Hono } from "hono";
import { getDb } from "../../shared/db/client";
import { errorResponse } from "../../shared/error";
import { adminAuth } from "../../shared/middleware/admin-auth";
import { D1MaterialRepository } from "./infra/d1-material-repository";
import { WorkersEmbeddingService } from "./infra/embedding-service";
import { WorkersHackathonApiClient } from "./infra/hackathon-api-client";
import { AppError, IngestMaterialUsecase } from "./usecase/ingest-material";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/", adminAuth, async (c) => {
  const body = await c.req.json();

  const mode = body.mode;
  if (!mode || (mode !== "auto" && mode !== "manual")) {
    return errorResponse(
      c,
      400,
      "VALIDATION_ERROR",
      "mode must be 'auto' or 'manual'"
    );
  }

  const topicId = body.topic_id;
  if (!topicId) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "topic_id is required");
  }

  if (mode === "auto") {
    const sources = body.sources;
    if (!Array.isArray(sources) || sources.length === 0) {
      return errorResponse(
        c,
        400,
        "VALIDATION_ERROR",
        "sources array is required for auto mode"
      );
    }
  }

  if (mode === "manual") {
    if (!body.content || !body.type) {
      return errorResponse(
        c,
        400,
        "VALIDATION_ERROR",
        "content and type are required for manual mode"
      );
    }
  }

  const db = getDb(c.env.DB);
  const repo = new D1MaterialRepository(db);
  const embedding = new WorkersEmbeddingService(c.env.AI, c.env.VECTORIZE);
  const apiClient = new WorkersHackathonApiClient(
    c.env.HACKATHON_API_URL,
    c.env.HACKATHON_API_KEY
  );
  const usecase = new IngestMaterialUsecase(repo, embedding, repo, apiClient);

  const input =
    mode === "auto"
      ? { mode: "auto" as const, topicId, sources: body.sources }
      : {
          mode: "manual" as const,
          topicId,
          content: body.content,
          type: body.type,
          sourceUrl: body.source_url,
        };

  try {
    const indexedCount = await usecase.execute(input);
    return c.json({ ok: true, indexed_count: indexedCount }, 201);
  } catch (e) {
    if (e instanceof AppError) {
      if (e.code === "NOT_FOUND") {
        return errorResponse(c, 404, "NOT_FOUND", e.message);
      }
      return errorResponse(c, 400, "VALIDATION_ERROR", e.message);
    }
    throw e;
  }
});

export default app;
