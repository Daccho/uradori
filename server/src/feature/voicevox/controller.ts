import { createRoute } from "@hono/zod-openapi";
import { createApp } from "../../shared/app-factory";
import { ErrorResponse } from "../../shared/schema";
import { VoicevoxTTSService } from "./infra/voicevox-tts-service";
import { SynthesizeSpeechUsecase } from "./usecase/synthesize-speech";
import { SynthesisBody } from "./schema";

const app = createApp();

const synthesisRoute = createRoute({
  method: "post",
  path: "/synthesis",
  tags: ["Voicevox"],
  request: {
    body: { content: { "application/json": { schema: SynthesisBody } } },
  },
  responses: {
    200: {
      description: "音声合成結果 (WAVバイナリ)",
      content: { "audio/wav": { schema: { type: "string", format: "binary" } } },
    },
    400: {
      content: { "application/json": { schema: ErrorResponse } },
      description: "バリデーションエラー",
    },
  },
});

app.openapi(synthesisRoute, async (c) => {
  const { text, speaker } = c.req.valid("json");

  const ttsService = new VoicevoxTTSService(c.env.VOICEVOX_URL);
  const usecase = new SynthesizeSpeechUsecase(ttsService);

  const audioBuffer = await usecase.execute(text, speaker);

  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": String(audioBuffer.byteLength),
    },
  }) as any;
});

export default app;
