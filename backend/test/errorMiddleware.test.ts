import { describe, expect, it, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ZodError } from "zod";
import { errorMiddleware } from "../src/shared/errorMiddleware";
import { ApiError } from "../src/shared/apiError";

describe("errorMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    next = vi.fn();
  });

  describe("обрабатывает ApiError", () => {
    it("возвращает 400 с деталями ошибки", () => {
      const error = new ApiError({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Неверный ввод",
        details: { field: "name" }
      });

      errorMiddleware(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: "VALIDATION_ERROR",
          message: "Неверный ввод",
          details: { field: "name" }
        }
      });
    });

    it("возвращает 404 для ошибки NOT_FOUND", () => {
      const error = new ApiError({
        status: 404,
        code: "NOT_FOUND",
        message: "Продукт не найден"
      });

      errorMiddleware(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: "NOT_FOUND",
          message: "Продукт не найден",
          details: null
        }
      });
    });

    it("возвращает 409 для ошибки PRODUCT_IN_USE", () => {
      const error = new ApiError({
        status: 409,
        code: "PRODUCT_IN_USE",
        message: "Нельзя удалить продукт: он используется в блюдах",
        details: { dishes: [{ id: "1", name: "Борщ" }] }
      });

      errorMiddleware(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe("обрабатывает ZodError", () => {
    it("возвращает 400 с деталями валидации", () => {
      let zodError: ZodError;
      try {
        const schema = z.object({ name: z.string().min(3) });
        schema.parse({ name: "A" });
      } catch (err) {
        zodError = err as ZodError;
      }

      errorMiddleware(zodError!, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ошибка валидации",
          details: expect.any(Object)
        }
      });
    });
  });

  describe("обрабатывает неизвестные ошибки", () => {
    it("возвращает 500 для неизвестной ошибки", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Что-то пошло не так");

      errorMiddleware(error, req as Request, res as Response, next);

      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: "INTERNAL_ERROR",
          message: "Внутренняя ошибка сервера",
          details: null
        }
      });
      consoleSpy.mockRestore();
    });
  });
});