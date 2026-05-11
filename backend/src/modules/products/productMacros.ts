import { type z } from "zod";
import { ProductCategorySchema } from "./productSchemas";

type ProductCategory = z.infer<typeof ProductCategorySchema>;

const MacroToCategory: Record<string, ProductCategory> = {
  "!мясо": "Meat",
  "!овощи": "Vegetables",
  "!зелень": "Greens",
  "!специи": "Spices",
  "!крупы": "Groats",
  "!консервы": "Canned",
  "!жидкость": "Liquid",
  "!сладости": "Sweets",
  "!замороженное": "Frozen"
};

export function applyProductNameMacro(inputName: string): { name: string; categoryFromMacro?: ProductCategory } {
  const parts = inputName.split(/\s+/).filter(Boolean);

  for (const part of parts) {
    const key = part.toLowerCase();
    const category = MacroToCategory[key];
    if (category) {
      const nameWithout = parts.filter((p) => p !== part).join(" ").trim();
      const finalName = nameWithout.length > 0 ? nameWithout : inputName.replace(part, "").trim();
      
      if (finalName.length < 2) {
        throw new Error(`Название продукта должно содержать не менее 2 символов после удаления макроса "${part}"`);
      }
      
      return { name: finalName, categoryFromMacro: category };
    }
  }

  if (inputName.trim().length < 2) {
    throw new Error("Название продукта должно содержать не менее 2 символов");
  }

  return { name: inputName };
}