import { describe, expect, it } from "vitest";
import { applyDishNameMacro } from "../src/modules/dishes/dishMacros";

describe("dishMacros", () => {
  describe("applyDishNameMacro", () => {
    it("извлекает категорию из макроса в начале", () => {
      const result = applyDishNameMacro("!суп Борщ");
      
      expect(result.name).toBe("Борщ");
      expect(result.categoryFromMacro).toBe("Soup");
    });

    it("извлекает категорию из макроса в конце", () => {
      const result = applyDishNameMacro("Борщ !суп");
      
      expect(result.name).toBe("Борщ");
      expect(result.categoryFromMacro).toBe("Soup");
    });

    it("извлекает категорию из макроса в середине", () => {
      const result = applyDishNameMacro("Борщ !суп классический");
      
      expect(result.name).toBe("Борщ классический");
      expect(result.categoryFromMacro).toBe("Soup");
    });

    it("обрабатывает несколько макросов - использует первый", () => {
      const result = applyDishNameMacro("!суп !первое Борщ");
      
      expect(result.name).toBe("Борщ");
      expect(result.categoryFromMacro).toBe("Soup");
    });

    it("возвращает исходное имя, когда макрос не найден", () => {
      const result = applyDishNameMacro("Борщ классический");
      
      expect(result.name).toBe("Борщ классический");
      expect(result.categoryFromMacro).toBeUndefined();
    });

    it("обрабатывает все категории блюд", () => {
      const testCases = [
        { input: "!десерт Тирамису", expectedName: "Тирамису", expectedCategory: "Dessert" },
        { input: "!первое Суп", expectedName: "Суп", expectedCategory: "First" },
        { input: "!второе Стейк", expectedName: "Стейк", expectedCategory: "Second" },
        { input: "!напиток Чай", expectedName: "Чай", expectedCategory: "Drink" },
        { input: "!салат Цезарь", expectedName: "Цезарь", expectedCategory: "Salad" },
        { input: "!перекус Сэндвич", expectedName: "Сэндвич", expectedCategory: "Snack" }
      ];

      for (const { input, expectedName, expectedCategory } of testCases) {
        const result = applyDishNameMacro(input);
        expect(result.name).toBe(expectedName);
        expect(result.categoryFromMacro).toBe(expectedCategory);
      }
    });

    it("выбрасывает ошибку, когда имя состоит только из макроса", () => {
      expect(() => applyDishNameMacro("!суп")).toThrow(
        "Название блюда не может состоять только из макросов. Добавьте название блюда"
      );
    });

    it("выбрасывает ошибку, когда после удаления макроса имя короче 2 символов", () => {
      expect(() => applyDishNameMacro("!суп а")).toThrow(
        "Название блюда должно содержать не менее 2 символов"
      );
    });

    it("выбрасывает ошибку для пустого имени", () => {
      expect(() => applyDishNameMacro("")).toThrow();
    });

    it("выбрасывает ошибку для имени только из пробелов", () => {
      expect(() => applyDishNameMacro("   ")).toThrow();
    });

    it("сохраняет регистр символов в имени", () => {
      const result = applyDishNameMacro("!суп БоРщ СвЕкольный");
      
      expect(result.name).toBe("БоРщ СвЕкольный");
      expect(result.categoryFromMacro).toBe("Soup");
    });

    it("выбрасывает ошибку, когда имя после удаления макроса слишком короткое", () => {
      expect(() => applyDishNameMacro("!суп К")).toThrow(
        "Название блюда должно содержать не менее 2 символов"
      );
    });

    it("не выбрасывает ошибку для валидного имени с макросом", () => {
      expect(() => applyDishNameMacro("!суп Борщ вкусный")).not.toThrow();
    });
  });
});