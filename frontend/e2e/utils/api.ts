import { APIRequestContext } from "@playwright/test";

/**
 * API-интерфейсы для управления тестовыми данными
 * Предоставляет методы для создания, чтения и удаления тестовых данных
 */

interface Product {
  id?: string;
  name: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  category?: string;
  preparationType?: string;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSugarFree?: boolean;
}

interface Dish {
  id?: string;
  name: string;
  category?: string;
  portionSize?: number;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSugarFree?: boolean;
  ingredients?: Array<{
    productId: string;
    grams: number;
  }>;
}

const API_BASE_URL = "http://localhost:3001/api";

/**
 * Проверка по сиду
 */
export const SEED_PRODUCTS = {
  beet: { id: "seed_beet", name: "Свёкла" },
  potato: { id: "seed_potato", name: "Картофель" },
  water: { id: "seed_water", name: "Вода" },
  meat: { id: "seed_meat", name: "Мясо" },
  pumpkin: { id: "seed_pumpkin", name: "Тыква" },
  donuts: { id: "seed_donuts", name: "Пончики" }
};

/**
 * Создание продукта через API
 */
export async function createProduct(
  request: any,
  product: Product
): Promise<{ id: string }> {
  const payload = {
    ...product,
    category: product.category ?? "Frozen",
    preparationType: product.preparationType ?? "ReadyToEat"
  };

  const response = await request.post(`${API_BASE_URL}/products`, {
    data: payload
  });

  if (!response.ok()) {
    throw new Error(`Не получилось создать продукт: ${response.status()}`);
  }

  const body = await response.json();
  const id = body.id as string;
  if (!id) {
    throw new Error("Не удалось прочитать id созданного продукта");
  }

  if (Array.isArray((request as any)._createdProductIds)) {
    (request as any)._createdProductIds.push(id);
  }

  return { id };
}

/**
 * Удаление продукта через API
 */
export async function deleteProduct(
  request: any,
  productId: string
): Promise<void> {
  const response = await request.delete(`${API_BASE_URL}/products/${productId}`);

  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Не удалось удалить продукт: ${response.status()}`);
  }

  const createdProductIds = (request as any)._createdProductIds;
  if (Array.isArray(createdProductIds)) {
    const index = createdProductIds.indexOf(productId);
    if (index >= 0) createdProductIds.splice(index, 1);
  }
}

/**
 * Создание блюда через API
 */
export async function createDish(
  request: any,
  dish: Dish
): Promise<{ id: string }> {
  const response = await request.post(`${API_BASE_URL}/dishes`, {
    data: dish
  });

  if (!response.ok()) {
    throw new Error(`Не удалось создать блюдо: ${response.status()}`);
  }

  const body = await response.json();
  const id = body?.dish?.id as string;
  if (!id) {
    throw new Error("Не удалось прочитать id созданного блюда");
  }

  if (Array.isArray((request as any)._createdDishIds)) {
    (request as any)._createdDishIds.push(id);
  }

  return { id };
}

/**
 * Удаление блюда через API
 */
export async function deleteDish(
  request: any,
  dishId: string
): Promise<void> {
  const response = await request.delete(`${API_BASE_URL}/dishes/${dishId}`);

  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Не удалось удалить блюдо: ${response.status()}`);
  }

  const createdDishIds = (request as any)._createdDishIds;
  if (Array.isArray(createdDishIds)) {
    const index = createdDishIds.indexOf(dishId);
    if (index >= 0) createdDishIds.splice(index, 1);
  }
}

/**
 * Получение продукта через API
 */
export async function getProduct(
  request: any,
  productId: string
): Promise<any> {
  const response = await request.get(`${API_BASE_URL}/products/${productId}`);

  if (!response.ok()) {
    throw new Error(`Не удалось получить продукт: ${response.status()}`);
  }

  return response.json();
}

/**
 * Получение блюда через API
 */
export async function getDish(
  request: any,
  dishId: string
): Promise<any> {
  const response = await request.get(`${API_BASE_URL}/dishes/${dishId}`);

  if (!response.ok()) {
    throw new Error(`Не удалось получить блюдо: ${response.status()}`);
  }

  return response.json();
}