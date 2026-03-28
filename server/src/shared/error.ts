import type { Context } from "hono";

type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

type StatusCode = 400 | 401 | 404 | 500;

export function errorResponse(
  c: Context,
  status: StatusCode,
  code: ErrorCode,
  message: string
) {
  return c.json({ ok: false, error: { code, message } }, status);
}
