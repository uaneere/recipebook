import { type z } from "zod";
import { DishCategorySchema } from "./dishSchemas";

type DishCategory = z.infer<typeof DishCategorySchema>;

const MacroToCategory: Record<string, DishCategory> = {
  "!десерт": "Dessert",
  "!первое": "First",
  "!второе": "Second",
  "!напиток": "Drink",
  "!салат": "Salad",
  "!суп": "Soup",
  "!перекус": "Snack"
};

export function applyDishNameMacro(inputName: string): { name: string; categoryFromMacro?: DishCategory } {
  const trimmed = inputName.trim();
  
  if (!trimmed) {
    throw new Error("Название блюда не может состоять только из макросов. Добавьте название блюда");
  }
  
  const parts = trimmed.split(/\s+/).filter(Boolean);
  
  const allAreMacros = parts.every(part => MacroToCategory[part.toLowerCase()]);
  
  if (allAreMacros && parts.length > 0) {
    throw new Error("Название блюда не может состоять только из макросов. Добавьте название блюда");
  }
  
  let foundCategory: DishCategory | undefined;
  const nameParts: string[] = [];
  
  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    const category = MacroToCategory[lowerPart];
    
    if (category) {
      if (!foundCategory) {
        foundCategory = category;
      }
      continue;
    } else {
      nameParts.push(part);
    }
  }
  
  const currentName = nameParts.join(' ').trim();
  
  if (currentName.length < 2) {
    throw new Error("Название блюда должно содержать не менее 2 символов");
  }
  
  return { name: currentName, categoryFromMacro: foundCategory };
}