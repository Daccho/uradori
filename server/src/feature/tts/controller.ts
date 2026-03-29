import { createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { createApp } from "../../shared/app-factory";
import { ErrorResponse } from "../../shared/schema";
import { ElevenLabsTTSService } from "./infra/elevenlabs-tts-service";
import { R2TTSCache } from "./infra/r2-tts-cache";
import { SynthesizeSpeechUsecase } from "./usecase/synthesize-speech";
import { SynthesisBody } from "./schema";

const app = createApp();

// --- POST /synthesis (既存: 直接合成、iOS後方互換) ---

const synthesisRoute = createRoute({
  method: "post",
  path: "/synthesis",
  tags: ["TTS"],
  request: {
    body: { content: { "application/json": { schema: SynthesisBody } } },
  },
  responses: {
    200: {
      description: "音声合成結果 (MP3バイナリ)",
      content: {
        "audio/mpeg": { schema: { type: "string", format: "binary" } },
      },
    },
    400: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "バリデーションエラー",
    },
  },
});

app.openapi(synthesisRoute, async (c) => {
  const { text, speaker } = c.req.valid("json");

  const ttsService = new ElevenLabsTTSService(c.env.ELEVENLABS_API_KEY, {
    sorajiro: c.env.ELEVENLABS_VOICE_ID_SORAJIRO,
    audience: c.env.ELEVENLABS_VOICE_ID_AUDIENCE,
  });
  const cache = new R2TTSCache(c.env.TTS_CACHE);

  const { data } = await cache.getOrCreate(speaker, text, () =>
    ttsService.synthesize(text, speaker)
  );

  return new Response(data, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(data.byteLength),
    },
  }) as any;
});

// --- GET /audio/:key (R2キャッシュから音声配信) ---

const audioRoute = createRoute({
  method: "get",
  path: "/audio/{key}",
  tags: ["TTS"],
  request: {
    params: z.object({
      key: z.string().openapi({ description: "R2キャッシュキー (SHA-256 hex)" }),
    }),
  },
  responses: {
    200: {
      description: "キャッシュ済み音声 (MP3バイナリ)",
      content: {
        "audio/mpeg": { schema: { type: "string", format: "binary" } },
      },
    },
    404: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "音声が見つからない",
    },
  },
});

app.openapi(audioRoute, async (c) => {
  const { key } = c.req.valid("param");
  const cache = new R2TTSCache(c.env.TTS_CACHE);
  const data = await cache.get(key);

  if (!data) {
    return c.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Audio not found" } },
      404
    ) as any;
  }

  return new Response(data, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(data.byteLength),
      "Cache-Control": "public, max-age=86400",
    },
  }) as any;
});

export default app;
