import { createMiddleware } from "hono/factory";

export const adminAuth = createMiddleware<{
  Bindings: CloudflareBindings;
}>(async (c, next) => {
  const key = c.req.header("X-Admin-Key");
  if (!key || key !== c.env.ADMIN_KEY) {
    return c.json(
      {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or missing admin key",
        },
      },
      401
    );
  }
  await next();
});
