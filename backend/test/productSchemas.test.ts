import { describe, expect, it } from "vitest";
import { 
  CreateProductSchema, 
  UpdateProductSchema, 
  ProductListQuerySchema 
} from "../src/modules/products/productSchemas";

describe("productSchemas", () => {
  describe("CreateProductSchema", () => {
    it("валидирует корректный продукт", () => {
      const validProduct = {
        name: "Говядина",
        calories: 250,
        proteins: 26,
        fats: 15,
        carbs: 0,
        preparationType: "RequiresCooking",
        category: "Meat"
      };

      const result = CreateProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it("валидирует продукт с минимальными значениями (ноль)", () => {
      const validProduct = {
        name: "Вода",
        calories: 0,
        proteins: 0,
        fats: 0,
        carbs: 0,
        preparationType: "ReadyToEat",
        category: "Liquid"
      };

      const result = CreateProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it("отклоняет отрицательные калории", () => {
      const invalidProduct = {
        name: "Негативный продукт",
        calories: -100,
        proteins: 10,
        fats: 5,
        carbs: 20,
        preparationType: "RequiresCooking",
        category: "Vegetables"
      };

      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain("calories");
    });

    it("отклоняет отрицательные белки", () => {
      const invalidProduct = {
        name: "Негативный продукт",
        calories: 100,
        proteins: -10,
        fats: 5,
        carbs: 20,
        preparationType: "RequiresCooking",
        category: "Vegetables"
      };

      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain("proteins");
    });

    it("отклоняет отрицательные жиры", () => {
      const invalidProduct = {
        name: "Негативный продукт",
        calories: 100,
        proteins: 10,
        fats: -5,
        carbs: 20,
        preparationType: "RequiresCooking",
        category: "Vegetables"
      };

      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain("fats");
    });

    it("отклоняет отрицательные углеводы", () => {
      const invalidProduct = {
        name: "Негативный продукт",
        calories: 100,
        proteins: 10,
        fats: 5,
        carbs: -20,
        preparationType: "RequiresCooking",
        category: "Vegetables"
      };

      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain("carbs");
    });

    it("отклоняет сумму БЖУ > 100", () => {
      const invalidProduct = {
        name: "Слишком питательный",
        calories: 100,
        proteins: 60,
        fats: 30,
        carbs: 30,
        preparationType: "RequiresCooking",
        category: "Vegetables"
      };

      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain("Сумма БЖУ должна быть <= 100");
    });

    it("принимает сумму БЖУ равную 100", () => {
      const validProduct = {
        name: "Идеальный продукт",
        calories: 100,
        proteins: 40,
        fats: 30,
        carbs: 30,
        preparationType: "RequiresCooking",
        category: "Vegetables"
      };

      const result = CreateProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it("округляет числа с плавающей точкой до 2 знаков", () => {
      const product = {
        name: "Продукт",
        calories: 100.123,
        proteins: 10.456,
        fats: 5.789,
        carbs: 20.987,
        preparationType: "RequiresCooking",
        category: "Vegetables"
      };

      const result = CreateProductSchema.parse(product);
      expect(result.calories).toBe(100.12);
      expect(result.proteins).toBe(10.46);
      expect(result.fats).toBe(5.79);
      expect(result.carbs).toBe(20.99);
    });

    it("валидирует минимальную длину имени", () => {
      const invalidProduct = {
        name: "А",
        calories: 100,
        proteins: 10,
        fats: 5,
        carbs: 20,
        preparationType: "RequiresCooking",
        category: "Vegetables"
      };

      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it("валидирует ограничение длины массива фото", () => {
      const invalidProduct = {
        name: "Продукт",
        calories: 100,
        proteins: 10,
        fats: 5,
        carbs: 20,
        photos: ["1", "2", "3", "4", "5", "6"],
        preparationType: "RequiresCooking",
        category: "Vegetables"
      };

      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateProductSchema", () => {
    it("разрешает частичные обновления", () => {
      const update = {
        name: "Новое название"
      };

      const result = UpdateProductSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("разрешает пустое обновление", () => {
      const update = {};

      const result = UpdateProductSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("валидирует сумму БЖУ когда указаны все", () => {
      const update = {
        proteins: 60,
        fats: 30,
        carbs: 30
      };

      const result = UpdateProductSchema.safeParse(update);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain("Сумма БЖУ должна быть <= 100");
    });

    it("валидирует сумму БЖУ когда частичное обновление превышает лимит", () => {
      const update = {
        proteins: 70,
        carbs: 40
      };

      const result = UpdateProductSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("не валидирует сумму когда БЖУ не полностью указаны", () => {
      const update = {
        proteins: 60,
        fats: 30
      };

      const result = UpdateProductSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });

  describe("ProductListQuerySchema", () => {
    it("парсит запрос со значениями по умолчанию", () => {
      const query = {};
      const result = ProductListQuerySchema.parse(query);
      
      expect(result.sortBy).toBe("name");
      expect(result.sortDir).toBe("asc");
      expect(result.q).toBeUndefined();
      expect(result.category).toBeUndefined();
      expect(result.preparationType).toBeUndefined();
    });

    it("парсит параметры сортировки", () => {
      const query = {
        sortBy: "calories",
        sortDir: "desc"
      };
      const result = ProductListQuerySchema.parse(query);
      
      expect(result.sortBy).toBe("calories");
      expect(result.sortDir).toBe("desc");
    });

    it("парсит строку 'true' как булево true для флагов", () => {
      const query = {
        isVegan: "true"
      };
      const result = ProductListQuerySchema.parse(query);
      
      expect(result.isVegan).toBe(true);
    });

    it("парсит строку 'false' как булево false для флагов", () => {
      const query = {
        isGlutenFree: false
      };
      const result = ProductListQuerySchema.parse(query);
      
      expect(result.isGlutenFree).toBe(false);
    });

    it("обрабатывает настоящие булевы значения корректно", () => {
      const query = {
        isVegan: true,
        isGlutenFree: false,
        isSugarFree: true
      };
      const result = ProductListQuerySchema.parse(query);
      
      expect(result.isVegan).toBe(true);
      expect(result.isGlutenFree).toBe(false);
      expect(result.isSugarFree).toBe(true);
    });

    it("обрабатывает число 1 как true", () => {
      const query = {
        isVegan: 1
      };
      const result = ProductListQuerySchema.parse(query);
      
      expect(result.isVegan).toBe(true);
    });

    it("обрабатывает число 0 как false", () => {
      const query = {
        isVegan: 0
      };
      const result = ProductListQuerySchema.parse(query);
      
      expect(result.isVegan).toBe(false);
    });

    it("валидирует перечисление категорий", () => {
      const query = {
        category: "InvalidCategory"
      };
      const result = ProductListQuerySchema.safeParse(query);
      
      expect(result.success).toBe(false);
    });

    it("принимает валидные значения категорий", () => {
      const validCategories = ["Frozen", "Meat", "Vegetables", "Greens", "Spices", "Groats", "Canned", "Liquid", "Sweets"];
      
      for (const category of validCategories) {
        const query = { category };
        const result = ProductListQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
      }
    });

    it("принимает валидные значения типов приготовления", () => {
      const validTypes = ["ReadyToEat", "SemiFinished", "RequiresCooking"];
      
      for (const preparationType of validTypes) {
        const query = { preparationType };
        const result = ProductListQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
      }
    });

    it("позволяет комбинировать несколько фильтров", () => {
      const query = {
        q: "овощ",
        category: "Vegetables",
        isVegan: true,
        sortBy: "calories",
        sortDir: "desc"
      };
      const result = ProductListQuerySchema.parse(query);
      
      expect(result.q).toBe("овощ");
      expect(result.category).toBe("Vegetables");
      expect(result.isVegan).toBe(true);
      expect(result.sortBy).toBe("calories");
      expect(result.sortDir).toBe("desc");
    });
  });
});