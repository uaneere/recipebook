import { describe, expect, it } from "vitest";
import { ApiError } from "../src/shared/apiError";

describe("ApiError", () => {
  it("создание ошибки со всеми свойствами", () => {
    const error = new ApiError({
      status: 400,
      code: "TEST_ERROR",
      message: "Test message",
      details: { foo: "bar" }
    });

    expect(error.status).toBe(400);
    expect(error.code).toBe("TEST_ERROR");
    expect(error.message).toBe("Test message");
    expect(error.details).toEqual({ foo: "bar" });
  });

  it("создание ошибки без деталей", () => {
    const error = new ApiError({
      status: 404,
      code: "NOT_FOUND",
      message: "Not found"
    });

    expect(error.status).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("Not found");
    expect(error.details).toBeUndefined();
  });

  it("проверка наследования от Error", () => {
    const error = new ApiError({
      status: 500,
      code: "ERROR",
      message: "Error"
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });
});