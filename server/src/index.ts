import { Hono } from "hono";
import { cors } from "hono/cors";
import topicApp from "./feature/topic/controller";
import voiceApp from "./feature/voice/controller";
import dialogApp from "./feature/dialog/controller";
import ingestApp from "./feature/ingest/controller";

const app = new Hono<{ Bindings: CloudflareBindings }>();

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

export default app;
