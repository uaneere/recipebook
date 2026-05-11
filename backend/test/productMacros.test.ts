import { describe, expect, it } from "vitest";
import { applyProductNameMacro } from "../src/modules/products/productMacros";

describe("productMacros", () => {
  describe("applyProductNameMacro", () => {
    it("извлекает категорию из макроса в начале", () => {
      const result = applyProductNameMacro("!мясо Говядина");
      
      expect(result.name).toBe("Говядина");
      expect(result.categoryFromMacro).toBe("Meat");
    });

    it("извлекает категорию из макроса в конце", () => {
      const result = applyProductNameMacro("Говядина !мясо");
      
      expect(result.name).toBe("Говядина");
      expect(result.categoryFromMacro).toBe("Meat");
    });

    it("обрабатывает все категории продуктов", () => {
      const testCases = [
        { input: "!мясо Свинина", expectedName: "Свинина", expectedCategory: "Meat" },
        { input: "!овощи Морковь", expectedName: "Морковь", expectedCategory: "Vegetables" },
        { input: "!зелень Петрушка", expectedName: "Петрушка", expectedCategory: "Greens" },
        { input: "!специи Корица", expectedName: "Корица", expectedCategory: "Spices" },
        { input: "!крупы Гречка", expectedName: "Гречка", expectedCategory: "Groats" },
        { input: "!консервы Тунец", expectedName: "Тунец", expectedCategory: "Canned" },
        { input: "!жидкость Молоко", expectedName: "Молоко", expectedCategory: "Liquid" },
        { input: "!сладости Шоколад", expectedName: "Шоколад", expectedCategory: "Sweets" },
        { input: "!замороженное Овощи", expectedName: "Овощи", expectedCategory: "Frozen" }
      ];

      for (const { input, expectedName, expectedCategory } of testCases) {
        const result = applyProductNameMacro(input);
        expect(result.name).toBe(expectedName);
        expect(result.categoryFromMacro).toBe(expectedCategory);
      }
    });

    it("возвращает исходное имя, когда макрос не найден", () => {
      const result = applyProductNameMacro("Огурец");
      
      expect(result.name).toBe("Огурец");
      expect(result.categoryFromMacro).toBeUndefined();
    });

    it("обрабатывает несколько макросов - использует первый", () => {
      const result = applyProductNameMacro("!мясо !овощи Говядина");
      
      expect(result.name).toBe("!овощи Говядина");
      expect(result.categoryFromMacro).toBe("Meat");
    });

    it("удаляет макрос и сохраняет остальную часть имени", () => {
      const result = applyProductNameMacro("Филе куриное !мясо свежее");
      
      expect(result.name).toBe("Филе куриное свежее");
      expect(result.categoryFromMacro).toBe("Meat");
    });

    it("выбрасывает ошибку, когда имя состоит только из макроса", () => {
      expect(() => applyProductNameMacro("!мясо")).toThrow();
    });

    it("выбрасывает ошибку, когда после удаления макроса имя короче 2 символов", () => {
      expect(() => applyProductNameMacro("!мясо а")).toThrow();
    });

    it("выбрасывает ошибку для пустого имени", () => {
      expect(() => applyProductNameMacro("")).toThrow();
    });

    it("сохраняет регистр символов в имени", () => {
      const result = applyProductNameMacro("!мясо ГовЯдинА Свежая");
      
      expect(result.name).toBe("ГовЯдинА Свежая");
      expect(result.categoryFromMacro).toBe("Meat");
    });
  });
});