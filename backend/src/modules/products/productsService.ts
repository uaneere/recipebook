import { Request } from "express";
import { getPrisma } from "../../db";
import { ApiError } from "../../shared/apiError";
import { applyProductNameMacro } from "./productMacros";
import { type CreateProductSchema, type ProductListQuerySchema, type UpdateProductSchema } from "./types";

export async function createProduct(input: CreateProductSchema, req?: Request) {
  const prisma = getPrisma(req);
  
  try {
    const macro = applyProductNameMacro(input.name);
    const name = macro.name;
    const category = input.category ?? macro.categoryFromMacro;
    if (!category) {
      throw new ApiError({ status: 400, code: "VALIDATION_ERROR", message: "Введите категорию продукта" });
    }
    return prisma.product.create({ data: { ...input, name, category } });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Название продукта должно содержать")) {
      throw new ApiError({ status: 400, code: "VALIDATION_ERROR", message: err.message });
    }
    throw err;
  }
}

export async function listProducts(query: ProductListQuerySchema, req?: Request) {
  const prisma = getPrisma(req);
  const where: any = {};

  if (query.q) {
    where.name = { contains: query.q, mode: "insensitive" };
  }
  if (query.category) where.category = query.category;
  if (query.preparationType) where.preparationType = query.preparationType;

  if (query.isVegan === true) where.isVegan = true;
  if (query.isGlutenFree === true) where.isGlutenFree = true;
  if (query.isSugarFree === true) where.isSugarFree = true;

  const orderBy = query.sortBy === "name"
    ? { name: query.sortDir }
    : { [query.sortBy]: query.sortDir as "asc" | "desc" };

  return prisma.product.findMany({ where, orderBy });
}

export async function getProduct(id: string, req?: Request) {
  const prisma = getPrisma(req);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Продукт не найден" });
  return product;
}

export async function updateProduct(id: string, input: UpdateProductSchema, req?: Request) {
  const prisma = getPrisma(req);
  await getProduct(id, req);
  
  try {
    const macro = input.name ? applyProductNameMacro(input.name) : null;
    const name = macro ? macro.name : undefined;
    const category = input.category ?? macro?.categoryFromMacro;
    return prisma.product.update({ where: { id }, data: { ...input, name, category } });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Название продукта должно содержать")) {
      throw new ApiError({ status: 400, code: "VALIDATION_ERROR", message: err.message });
    }
    throw err;
  }
}

export async function deleteProduct(id: string, req?: Request) {
  const prisma = getPrisma(req);
  await getProduct(id, req);

  const usedIn = await prisma.dishIngredient.findMany({
    where: { productId: id },
    select: { dish: { select: { id: true, name: true } } }
  });

  if (usedIn.length > 0) {
    throw new ApiError({
      status: 409,
      code: "PRODUCT_IN_USE",
      message: "Нельзя удалить продукт: он используется в блюдах",
      details: { dishes: usedIn.map((x: any) => x.dish) }
    });
  }

  await prisma.product.delete({ where: { id } });
  return { ok: true };
}