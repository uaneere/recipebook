import { z } from "zod";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export const DishCategorySchema = z.enum([
  "Dessert",
  "First",
  "Second",
  "Drink",
  "Salad",
  "Soup",
  "Snack"
]);

export const DishIngredientInputSchema = z.object({
  productId: z.string().min(1),
  grams: z.number().positive()
});

const BaseDishSchema = z.object({
  name: z.string().min(2),
  photos: z.array(z.string().min(1)).max(5).default([]),
  portionSize: z.number().positive(),
  category: DishCategorySchema.optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  isSugarFree: z.boolean().optional(),
  ingredients: z.array(DishIngredientInputSchema).min(1),
  calories: z.number().min(0).optional(),
  proteins: z.number().min(0).optional(),
  fats: z.number().min(0).optional(),
  carbs: z.number().min(0).optional()
});

export const CreateDishSchema = BaseDishSchema;
export const UpdateDishSchema = BaseDishSchema.partial().extend({
  ingredients: z.array(DishIngredientInputSchema).min(1).optional(),
  portionSize: z.number().positive().optional()
});

export const DishListQuerySchema = z.object({
  q: z.string().optional(),
  category: DishCategorySchema.optional(),
  isVegan: z.coerce.boolean().optional(),
  isGlutenFree: z.coerce.boolean().optional(),
  isSugarFree: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["name", "calories", "proteins", "fats", "carbs"])
    .optional()
    .default("name"),
  sortDir: z.enum(["asc", "desc"]).optional().default("asc")
});

export const CalculateNutritionSchema = z.object({
  ingredients: z.array(DishIngredientInputSchema).min(1),
  portionSize: z.number().positive().optional()
});