import type { DishCategory, PreparationType, ProductCategory } from "./types";

export const ProductCategories: { value: ProductCategory; label: string }[] = [
  { value: "Frozen", label: "Заморозка" },
  { value: "Meat", label: "Мясо" },
  { value: "Vegetables", label: "Овощи" },
  { value: "Greens", label: "Зелень" },
  { value: "Spices", label: "Специи" },
  { value: "Groats", label: "Крупы" },
  { value: "Canned", label: "Консервы" },
  { value: "Liquid", label: "Жидкость" },
  { value: "Sweets", label: "Сладости" }
];

export const PreparationTypes: { value: PreparationType; label: string }[] = [
  { value: "ReadyToEat", label: "Готовый к употреблению" },
  { value: "SemiFinished", label: "Полуфабрикат" },
  { value: "RequiresCooking", label: "Требует приготовления" }
];

export const DishCategories: { value: DishCategory; label: string }[] = [
  { value: "Dessert", label: "Десерт" },
  { value: "First", label: "Первое" },
  { value: "Second", label: "Второе" },
  { value: "Drink", label: "Напиток" },
  { value: "Salad", label: "Салат" },
  { value: "Soup", label: "Суп" },
  { value: "Snack", label: "Перекус" }
];