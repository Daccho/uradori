import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { createApp } from "./shared/app-factory";
import topicApp from "./feature/topic/controller";
import voiceApp from "./feature/voice/controller";
import dialogApp from "./feature/dialog/controller";
import ingestApp from "./feature/ingest/controller";
import voicevoxApp from "./feature/voicevox/controller";

const app = createApp();

app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (origin && origin.startsWith("http://localhost")) return origin;
      return "";
    },
  })
);

app.onError((err, c) => {
  console.error(err);
  return c.json(
    {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    },
    500
  );
});

app.route("/api/topics", topicApp);
app.route("/api/voice", voiceApp);
app.route("/api/dialog", dialogApp);
app.route("/api/ingest", ingestApp);
app.route("/api/voicevox", voicevoxApp);

app.openAPIRegistry.registerComponent("securitySchemes", "AdminKey", {
  type: "apiKey",
  in: "header",
  name: "X-Admin-Key",
});

app.doc("/api/openapi.json", {
  openapi: "3.0.0",
  info: { title: "Uradori API", version: "1.0.0" },
});

app.get("/docs", swaggerUI({ url: "/api/openapi.json" }));

export default app;
