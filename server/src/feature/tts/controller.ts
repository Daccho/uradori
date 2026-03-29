import { createRoute } from "@hono/zod-openapi";
import { createApp } from "../../shared/app-factory";
import { ErrorResponse } from "../../shared/schema";
import { ElevenLabsTTSService } from "./infra/elevenlabs-tts-service";
import { SynthesizeSpeechUsecase } from "./usecase/synthesize-speech";
import { SynthesisBody } from "./schema";

const app = createApp();

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
  const usecase = new SynthesizeSpeechUsecase(ttsService);

  const audioBuffer = await usecase.execute(text, speaker);

  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audioBuffer.byteLength),
    },
  }) as any;
});

export default app;
