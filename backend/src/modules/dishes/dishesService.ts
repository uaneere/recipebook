import { prisma } from "../../db";
import { Prisma } from "../../generated/prisma/client";
import { ApiError } from "../../shared/apiError";
import { applyDishNameMacro } from "./dishMacros";
import {
  calculateNutrition,
  resolveAllowedFlags,
  type AllowedFlags,
  type DishIngredientInput
} from "./dishRules";
import { type CreateDishInput, type DishListQuery, type UpdateDishInput } from "./types";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function calculatePerPortion(per100g: { calories: number; proteins: number; fats: number; carbs: number }, portionSize: number) {
  const factor = portionSize / 400;
  return {
    calories: round2(per100g.calories * factor),
    proteins: round2(per100g.proteins * factor),
    fats: round2(per100g.fats * factor),
    carbs: round2(per100g.carbs * factor)
  };
}

export async function listDishes(query: DishListQuery) {
  const where: Prisma.DishWhereInput = {};

  if (query.q) where.name = { contains: query.q, mode: "insensitive" };
  if (query.category) where.category = query.category;

  if (query.isVegan === true) where.isVegan = true;
  if (query.isGlutenFree === true) where.isGlutenFree = true;
  if (query.isSugarFree === true) where.isSugarFree = true;

  const orderBy: Prisma.DishOrderByWithRelationInput = {};
  if (query.sortBy && query.sortBy !== "name") {
    orderBy[query.sortBy] = query.sortDir || "asc";
  } else {
    orderBy.name = query.sortDir || "asc";
  }

  return prisma.dish.findMany({ where, orderBy });
}

export async function getDish(id: string) {
  const dish = await prisma.dish.findUnique({
    where: { id },
    include: {
      ingredients: {
        select: {
          grams: true,
          product: { select: { id: true, name: true, calories: true, proteins: true, fats: true, carbs: true } }
        }
      }
    }
  });
  if (!dish) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Блюдо не найдено" });
  return dish;
}

function assertFlagAllowed(
  flagName: keyof AllowedFlags,
  requested: boolean | undefined,
  allowed: boolean
) {
  if (requested === true && !allowed) {
    throw new ApiError({
      status: 400,
      code: "FLAG_NOT_ALLOWED",
      message: `Флаг ${String(flagName)} не разрешен для данного блюда`
    });
  }
}

export async function createDish(input: CreateDishInput) {
  try {
    const macro = applyDishNameMacro(input.name);
    const name = macro.name;
    const category = input.category ?? macro.categoryFromMacro;
    if (!category) {
      throw new ApiError({ status: 400, code: "VALIDATION_ERROR", message: "Введите категорию блюда" });
    }

    const ingredients: DishIngredientInput[] = input.ingredients;
    const allowedFlags = await resolveAllowedFlags(ingredients);

    assertFlagAllowed("isVegan", input.isVegan, allowedFlags.isVegan);
    assertFlagAllowed("isGlutenFree", input.isGlutenFree, allowedFlags.isGlutenFree);
    assertFlagAllowed("isSugarFree", input.isSugarFree, allowedFlags.isSugarFree);

    const nutritionPer100g = await calculateNutrition(ingredients);
    const calculatedPerPortion = calculatePerPortion(nutritionPer100g, input.portionSize);
    
    const finalNutrition = {
      calories: input.calories !== undefined ? round2(input.calories) : calculatedPerPortion.calories,
      proteins: input.proteins !== undefined ? round2(input.proteins) : calculatedPerPortion.proteins,
      fats: input.fats !== undefined ? round2(input.fats) : calculatedPerPortion.fats,
      carbs: input.carbs !== undefined ? round2(input.carbs) : calculatedPerPortion.carbs
    };

    const dish = await prisma.dish.create({
      data: {
        name,
        photos: input.photos,
        portionSize: input.portionSize,
        category,
        calories: finalNutrition.calories,
        proteins: finalNutrition.proteins,
        fats: finalNutrition.fats,
        carbs: finalNutrition.carbs,
        isVegan: input.isVegan ?? false,
        isGlutenFree: input.isGlutenFree ?? false,
        isSugarFree: input.isSugarFree ?? false,
        ingredients: {
          create: ingredients.map((i) => ({ productId: i.productId, grams: i.grams }))
        }
      }
    });

    const draftNutrition = calculatedPerPortion;
    
    return { dish, draftNutrition, allowedFlags };
  } catch (err) {
    if (err instanceof Error && err.message.includes("Название блюда должно содержать")) {
      throw new ApiError({ status: 400, code: "VALIDATION_ERROR", message: err.message });
    }
    throw err;
  }
}

export async function updateDish(id: string, input: UpdateDishInput) {
  const existing = await prisma.dish.findUnique({
    where: { id },
    include: { ingredients: { select: { productId: true, grams: true } } }
  });
  if (!existing) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Блюдо не найдено" });

  try {
    const nextIngredients: DishIngredientInput[] =
      input.ingredients?.map((i: DishIngredientInput) => ({ productId: i.productId, grams: i.grams })) ??
      existing.ingredients.map((i) => ({ productId: i.productId, grams: i.grams }));

    const ingredientsChanged = input.ingredients !== undefined;
    const portionSize = input.portionSize ?? existing.portionSize;

    const macro = input.name ? applyDishNameMacro(input.name) : null;
    const name = macro ? macro.name : undefined;

    const categoryFromMacro = macro?.categoryFromMacro;
    const category = input.category ?? categoryFromMacro;

    const nutritionPer100g = await calculateNutrition(nextIngredients);
    const calculatedPerPortion = calculatePerPortion(nutritionPer100g, portionSize);
    const allowedFlags = await resolveAllowedFlags(nextIngredients);

    assertFlagAllowed("isVegan", input.isVegan, allowedFlags.isVegan);
    assertFlagAllowed("isGlutenFree", input.isGlutenFree, allowedFlags.isGlutenFree);
    assertFlagAllowed("isSugarFree", input.isSugarFree, allowedFlags.isSugarFree);

    const finalNutrition = {
      calories: input.calories !== undefined ? round2(input.calories) : calculatedPerPortion.calories,
      proteins: input.proteins !== undefined ? round2(input.proteins) : calculatedPerPortion.proteins,
      fats: input.fats !== undefined ? round2(input.fats) : calculatedPerPortion.fats,
      carbs: input.carbs !== undefined ? round2(input.carbs) : calculatedPerPortion.carbs
    };

    const dish = await prisma.dish.update({
      where: { id },
      data: {
        name,
        photos: input.photos,
        portionSize: input.portionSize,
        category,
        calories: finalNutrition.calories,
        proteins: finalNutrition.proteins,
        fats: finalNutrition.fats,
        carbs: finalNutrition.carbs,
        isVegan: input.isVegan ?? (allowedFlags.isVegan ? existing.isVegan : false),
        isGlutenFree: input.isGlutenFree ?? (allowedFlags.isGlutenFree ? existing.isGlutenFree : false),
        isSugarFree: input.isSugarFree ?? (allowedFlags.isSugarFree ? existing.isSugarFree : false),
        ingredients: ingredientsChanged
          ? {
              deleteMany: {},
              create: nextIngredients.map((i) => ({ productId: i.productId, grams: i.grams }))
            }
          : undefined
      }
    });

    const draftNutrition = calculatedPerPortion;
    return { dish, draftNutrition, allowedFlags };
  } catch (err) {
    if (err instanceof Error && err.message.includes("Название блюда должно содержать")) {
      throw new ApiError({ status: 400, code: "VALIDATION_ERROR", message: err.message });
    }
    throw err;
  }
}

export async function deleteDish(id: string) {
  await prisma.dish.delete({ where: { id } }).catch(() => {
    throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Блюдо не найдено" });
  });
  return { ok: true };
}

export async function calculateDishNutrition(ingredients: DishIngredientInput[], portionSize?: number) {
  const per100g = await calculateNutrition(ingredients);
  if (portionSize) {
    const perPortion = calculatePerPortion(per100g, portionSize);
    return { draftNutrition: perPortion, allowedFlags: await resolveAllowedFlags(ingredients) };
  }
  return { draftNutrition: per100g, allowedFlags: await resolveAllowedFlags(ingredients) };
}