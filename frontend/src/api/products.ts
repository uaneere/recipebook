import type { Product, ProductCategory, PreparationType } from "../types";
import { apiFetch } from "./http";

export type ProductListParams = {
  q?: string;
  category?: ProductCategory;
  preparationType?: PreparationType;
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

export function listProducts(params: ProductListParams) {
  return apiFetch<Product[]>(`/api/products${toQuery(params as Record<string, unknown>)}`);
}

export function getProduct(id: string) {
  return apiFetch<Product>(`/api/products/${encodeURIComponent(id)}`);
}

export type ProductInput = Omit<
  Product,
  "id" | "createdAt" | "updatedAt"
>;

export function createProduct(input: ProductInput) {
  return apiFetch<Product>("/api/products", { method: "POST", body: JSON.stringify(input) });
}

export function updateProduct(id: string, input: Partial<ProductInput>) {
  return apiFetch<Product>(`/api/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteProduct(id: string) {
  return apiFetch<{ ok: true }>(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" });
}