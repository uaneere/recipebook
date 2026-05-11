export type ProductCategory =
  | "Frozen"
  | "Meat"
  | "Vegetables"
  | "Greens"
  | "Spices"
  | "Groats"
  | "Canned"
  | "Liquid"
  | "Sweets";

export type PreparationType = "ReadyToEat" | "SemiFinished" | "RequiresCooking";

export type DishCategory = "Dessert" | "First" | "Second" | "Drink" | "Salad" | "Soup" | "Snack";

export type Product = {
  id: string;
  name: string;
  photos: string[];
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  compositionText: string | null;
  category?: ProductCategory;
  preparationType: PreparationType;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSugarFree: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DishIngredient = {
  grams: number;
  product: Pick<Product, "id" | "name" | "calories" | "proteins" | "fats" | "carbs">;
};

export type Dish = {
  id: string;
  name: string;
  photos: string[];
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  portionSize: number;
  category?: DishCategory;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSugarFree: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DishWithIngredients = Dish & { ingredients: DishIngredient[] };

export type ApiErrorBody = {
  error: { code: string; message: string; details: unknown | null };
};