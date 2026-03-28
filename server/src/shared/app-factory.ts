import { OpenAPIHono } from "@hono/zod-openapi";

export function createApp() {
  return new OpenAPIHono<{ Bindings: CloudflareBindings }>({
    defaultHook: (result, c) => {
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        return c.json(
          {
            ok: false,
            error: {
              code: "VALIDATION_ERROR",
              message: firstIssue
                ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
                : "Validation failed",
            },
          },
          400,
        );
      }
    },
  });
}
