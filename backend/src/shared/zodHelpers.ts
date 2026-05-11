import { type Request } from "express";
import { type ZodSchema } from "zod";

export function parseBody<T>(req: Request, schema: ZodSchema<T>): T {
  return schema.parse(req.body);
}

export function parseQuery<T>(req: Request, schema: ZodSchema<T>): T {
  return schema.parse(req.query);
}