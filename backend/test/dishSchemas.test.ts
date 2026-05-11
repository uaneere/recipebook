import { describe, expect, it } from "vitest";
import { 
  CreateDishSchema, 
  UpdateDishSchema, 
  DishListQuerySchema 
} from "../src/modules/dishes/dishSchemas";

describe("dishSchemas", () => {
  describe("CreateDishSchema", () => {
    it("валидирует корректное блюдо", () => {
      const validDish = {
        name: "Борщ",
        portionSize: 250,
        category: "Soup",
        ingredients: [{ productId: "123", grams: 100 }],
        calories: 200,
        proteins: 10,
        fats: 5,
        carbs: 25
      };

      const result = CreateDishSchema.safeParse(validDish);
      expect(result.success).toBe(true);
    });

    it("отклоняет имя короче 2 символов", () => {
      const invalidDish = {
        name: "Б",
        portionSize: 250,
        ingredients: [{ productId: "123", grams: 100 }]
      };

      const result = CreateDishSchema.safeParse(invalidDish);
      expect(result.success).toBe(false);
    });

    it("отклоняет пустой список ингредиентов", () => {
      const invalidDish = {
        name: "Борщ",
        portionSize: 250,
        ingredients: []
      };

      const result = CreateDishSchema.safeParse(invalidDish);
      expect(result.success).toBe(false);
    });
  });

  describe("DishListQuerySchema", () => {
    it("парсит запрос со значениями по умолчанию", () => {
      const query = {};
      const result = DishListQuerySchema.parse(query);
      
      expect(result.sortBy).toBe("name");
      expect(result.sortDir).toBe("asc");
      expect(result.q).toBeUndefined();
      expect(result.category).toBeUndefined();
    });

    it("парсит параметры сортировки", () => {
      const query = {
        sortBy: "calories",
        sortDir: "desc"
      };
      const result = DishListQuerySchema.parse(query);
      
      expect(result.sortBy).toBe("calories");
      expect(result.sortDir).toBe("desc");
    });

    it("парсит строку 'true' как булевое значение true для флагов", () => {
      const query = {
        isVegan: "true"
      };
      const result = DishListQuerySchema.parse(query);
      
      expect(result.isVegan).toBe(true);
    });

    it("парсит число 1 как true", () => {
      const query = {
        isVegan: 1
      };
      const result = DishListQuerySchema.parse(query);
      
      expect(result.isVegan).toBe(true);
    });

    it("парсит число 0 как false", () => {
      const query = {
        isVegan: 0
      };
      const result = DishListQuerySchema.parse(query);
      
      expect(result.isVegan).toBe(false);
    });

    it("валидирует категорию по перечислению", () => {
      const query = {
        category: "InvalidCategory"
      };
      const result = DishListQuerySchema.safeParse(query);
      
      expect(result.success).toBe(false);
    });

    it("принимает валидные значения категорий", () => {
      const validCategories = ["Dessert", "First", "Second", "Drink", "Salad", "Soup", "Snack"];
      
      for (const category of validCategories) {
        const query = { category };
        const result = DishListQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
      }
    });

    it("позволяет комбинировать несколько фильтров", () => {
      const query = {
        q: "борщ",
        category: "Soup",
        isVegan: true,
        sortBy: "calories",
        sortDir: "desc"
      };
      const result = DishListQuerySchema.parse(query);
      
      expect(result.q).toBe("борщ");
      expect(result.category).toBe("Soup");
      expect(result.isVegan).toBe(true);
      expect(result.sortBy).toBe("calories");
      expect(result.sortDir).toBe("desc");
    });
  });
});