import { prisma } from "../../db";
import { ApiError } from "../../shared/apiError";

export type DishIngredientInput = { productId: string; grams: number };

export type Nutrition = { calories: number; proteins: number; fats: number; carbs: number };

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function calculateNutritionFromProducts(
  ingredients: DishIngredientInput[],
  products: Map<string, { calories: number; proteins: number; fats: number; carbs: number }>
): Nutrition {
  const total = ingredients.reduce(
    (acc: Nutrition, ing) => {
      const p = products.get(ing.productId);
      if (!p) return acc;
      const k = ing.grams / 100;
      acc.calories += p.calories * k;
      acc.proteins += p.proteins * k;
      acc.fats += p.fats * k;
      acc.carbs += p.carbs * k;
      return acc;
    },
    { calories: 0, proteins: 0, fats: 0, carbs: 0 }
  );

  return {
    calories: round2(total.calories),
    proteins: round2(total.proteins),
    fats: round2(total.fats),
    carbs: round2(total.carbs)
  };
}

export function calculateNutritionPerPortion(
  ingredients: DishIngredientInput[],
  products: Map<string, { calories: number; proteins: number; fats: number; carbs: number }>,
  portionSize: number
): Nutrition {
  const per100g = calculateNutritionFromProducts(ingredients, products);
  const factor = portionSize / 100;
  
  return {
    calories: round2(per100g.calories * factor),
    proteins: round2(per100g.proteins * factor),
    fats: round2(per100g.fats * factor),
    carbs: round2(per100g.carbs * factor)
  };
}

export async function calculateNutrition(
  ingredients: DishIngredientInput[],
  portionSize?: number
): Promise<Nutrition> {
  const productIds = ingredients.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, calories: true, proteins: true, fats: true, carbs: true }
  });

  if (products.length !== productIds.length) {
    const existing = new Set(products.map((p) => p.id));
    const missing = productIds.filter((id) => !existing.has(id));
    throw new ApiError({
      status: 400,
      code: "UNKNOWN_PRODUCT",
      message: "Некоторые продукты не найдены",
      details: { missingProductIds: missing }
    });
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  const per100g = calculateNutritionFromProducts(ingredients, byId);
  
  if (portionSize && portionSize > 0) {
    const factor = portionSize / 100;
    return {
      calories: round2(per100g.calories * factor),
      proteins: round2(per100g.proteins * factor),
      fats: round2(per100g.fats * factor),
      carbs: round2(per100g.carbs * factor)
    };
  }
  
  return per100g;
}

export type AllowedFlags = { isVegan: boolean; isGlutenFree: boolean; isSugarFree: boolean };

export async function resolveAllowedFlags(ingredients: DishIngredientInput[]): Promise<AllowedFlags> {
  const productIds = ingredients.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, isVegan: true, isGlutenFree: true, isSugarFree: true }
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const flags = ingredients.map((ing) => byId.get(ing.productId));

  if (flags.some((p) => !p)) {
    throw new ApiError({ status: 400, code: "UNKNOWN_PRODUCT", message: "Некоторые продукты не найдены" });
  }

  const allowed = {
    isVegan: flags.every((p) => p!.isVegan),
    isGlutenFree: flags.every((p) => p!.isGlutenFree),
    isSugarFree: flags.every((p) => p!.isSugarFree)
  };

  return allowed;
}