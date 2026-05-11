import type { Dish, DishCategory, DishWithIngredients } from "../types";
import { apiFetch } from "./http";

export type DishListParams = {
  q?: string;
  category?: DishCategory;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSugarFree?: boolean;
  sortBy?: "name" | "calories" | "proteins" | "fats" | "carbs";
  sortDir?: "asc" | "desc";
};

function toQuery(params: Record<string, unknown>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s.length ? `?${s}` : "";
}

export function listDishes(params: DishListParams) {
  return apiFetch<Dish[]>(`/api/dishes${toQuery(params as Record<string, unknown>)}`);
}

export function getDish(id: string) {
  return apiFetch<DishWithIngredients>(`/api/dishes/${encodeURIComponent(id)}`);
}

export type DishIngredientInput = { productId: string; grams: number };

export type CalculateNutritionResult = {
  draftNutrition: { calories: number; proteins: number; fats: number; carbs: number };
  allowedFlags: { isVegan: boolean; isGlutenFree: boolean; isSugarFree: boolean };
};

export function calculateNutrition(ingredients: DishIngredientInput[], portionSize?: number) {
  return apiFetch<CalculateNutritionResult>("/api/dishes/calculate-nutrition", {
    method: "POST",
    body: JSON.stringify({ ingredients, portionSize })
  });
}

export type DishInput = {
  name: string;
  photos: string[];
  portionSize: number;
  category?: DishCategory;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSugarFree?: boolean;
  ingredients: DishIngredientInput[];
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
};

export function createDish(input: DishInput) {
  return apiFetch<{ dish: Dish; draftNutrition: CalculateNutritionResult["draftNutrition"]; allowedFlags: CalculateNutritionResult["allowedFlags"] }>(
    "/api/dishes",
    { method: "POST", body: JSON.stringify(input) }
  );
}

export function updateDish(id: string, input: Partial<DishInput>) {
  return apiFetch<{ dish: Dish; draftNutrition: CalculateNutritionResult["draftNutrition"]; allowedFlags: CalculateNutritionResult["allowedFlags"] }>(
    `/api/dishes/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export function deleteDish(id: string) {
  return apiFetch<{ ok: true }>(`/api/dishes/${encodeURIComponent(id)}`, { method: "DELETE" });
}