import { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "./apiError";

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details ?? null }
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Ошибка валидации",
        details: err.flatten()
      }
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Внутренняя ошибка сервера", details: null }
  });
}