import { z } from "zod";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export const ProductCategorySchema = z.enum([
  "Frozen",
  "Meat",
  "Vegetables",
  "Greens",
  "Spices",
  "Groats",
  "Canned",
  "Liquid",
  "Sweets"
]);

export const PreparationTypeSchema = z.enum(["ReadyToEat", "SemiFinished", "RequiresCooking"]);

const BaseProductSchema = z.object({
  name: z.string().min(2),
  photos: z.array(z.string().min(1)).max(5).default([]),
  calories: z.number().min(0).transform(round2),
  proteins: z.number().min(0).transform(round2),
  fats: z.number().min(0).transform(round2),
  carbs: z.number().min(0).transform(round2),
  compositionText: z.string().nullable().optional().default(null),
  category: ProductCategorySchema.optional(),
  preparationType: PreparationTypeSchema,
  isVegan: z.boolean().optional().default(false),
  isGlutenFree: z.boolean().optional().default(false),
  isSugarFree: z.boolean().optional().default(false)
});

export const CreateProductSchema = BaseProductSchema.superRefine((v, ctx) => {
  if (v.proteins + v.fats + v.carbs > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["proteins"],
      message: "Сумма БЖУ должна быть <= 100"
    });
  }
});

export const UpdateProductSchema = BaseProductSchema.partial()
  .extend({
    photos: z.array(z.string().min(1)).max(5).optional()
  })
  .superRefine((v, ctx) => {
    const p = v.proteins ?? 0;
    const f = v.fats ?? 0;
    const c = v.carbs ?? 0;

    if (v.proteins !== undefined || v.fats !== undefined || v.carbs !== undefined) {
      if (p + f + c > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["proteins"],
          message: "Сумма БЖУ должна быть <= 100"
        });
      }
    }
  });

export const ProductListQuerySchema = z.object({
  q: z.string().optional(),
  category: ProductCategorySchema.optional(),
  preparationType: PreparationTypeSchema.optional(),
  isVegan: z.coerce.boolean().optional(),
  isGlutenFree: z.coerce.boolean().optional(),
  isSugarFree: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["name", "calories", "proteins", "fats", "carbs"])
    .optional()
    .default("name"),
  sortDir: z.enum(["asc", "desc"]).optional().default("asc")
});