import { z } from "zod";
import { CreateProductSchema, ProductListQuerySchema, UpdateProductSchema } from "./productSchemas";

export type CreateProductSchema = z.infer<typeof CreateProductSchema>;
export type UpdateProductSchema = z.infer<typeof UpdateProductSchema>;
export type ProductListQuerySchema = z.infer<typeof ProductListQuerySchema>;