import { z } from "zod";
import {
  CalculateNutritionSchema,
  CreateDishSchema,
  DishListQuerySchema,
  UpdateDishSchema
} from "./dishSchemas";

export type CreateDishInput = z.infer<typeof CreateDishSchema>;
export type UpdateDishInput = z.infer<typeof UpdateDishSchema>;
export type DishListQuery = z.infer<typeof DishListQuerySchema>;
export type CalculateNutritionInput = z.infer<typeof CalculateNutritionSchema>;