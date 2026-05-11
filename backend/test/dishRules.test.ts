import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiError } from "../src/shared/apiError";
import { 
  calculateNutrition, 
  calculateNutritionFromProducts, 
  resolveAllowedFlags 
} from "../src/modules/dishes/dishRules";
import { prisma } from "../src/db";

vi.mock("../src/db", () => ({
  prisma: {
    product: {
      findMany: vi.fn()
    }
  }
}));

const mockFindMany = prisma.product.findMany as unknown as ReturnType<typeof vi.fn>;

describe("dishRules", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  describe("calculateNutritionFromProducts", () => {
    it("рассчитывает питательность для одного продукта", () => {
      const products = new Map([
        ["product1", { calories: 100, proteins: 10, fats: 5, carbs: 20 }]
      ]);
      const ingredients = [{ productId: "product1", grams: 100 }];

      const result = calculateNutritionFromProducts(ingredients, products);

      expect(result).toEqual({
        calories: 100,
        proteins: 10,
        fats: 5,
        carbs: 20
      });
    });

    it("рассчитывает питательность для нескольких продуктов", () => {
      const products = new Map([
        ["product1", { calories: 100, proteins: 10, fats: 5, carbs: 20 }],
        ["product2", { calories: 50, proteins: 5, fats: 2, carbs: 10 }]
      ]);
      const ingredients = [
        { productId: "product1", grams: 150 },
        { productId: "product2", grams: 200 }
      ];

      const result = calculateNutritionFromProducts(ingredients, products);

      expect(result.calories).toBe(250);
      expect(result.proteins).toBe(10 * 1.5 + 5 * 2);
      expect(result.fats).toBe(5 * 1.5 + 2 * 2);
      expect(result.carbs).toBe(20 * 1.5 + 10 * 2);
    });

    it("игнорирует продукты, не найденные в карте", () => {
      const products = new Map([
        ["product1", { calories: 100, proteins: 10, fats: 5, carbs: 20 }]
      ]);
      const ingredients = [
        { productId: "product1", grams: 100 },
        { productId: "missing", grams: 100 }
      ];

      const result = calculateNutritionFromProducts(ingredients, products);

      expect(result).toEqual({
        calories: 100,
        proteins: 10,
        fats: 5,
        carbs: 20
      });
    });

    it("обрабатывает пустой массив ингредиентов", () => {
      const products = new Map();
      const ingredients: { productId: string; grams: number }[] = [];

      const result = calculateNutritionFromProducts(ingredients, products);

      expect(result).toEqual({
        calories: 0,
        proteins: 0,
        fats: 0,
        carbs: 0
      });
    });

    it("округляет значения до 2 знаков после запятой", () => {
      const products = new Map([
        ["product1", { calories: 100.555, proteins: 10.555, fats: 5.555, carbs: 20.555 }]
      ]);
      const ingredients = [{ productId: "product1", grams: 33 }];

      const result = calculateNutritionFromProducts(ingredients, products);

      expect(result.calories).toBe(33.18);
      expect(result.proteins).toBe(3.48);
      expect(result.fats).toBe(1.83);
      expect(result.carbs).toBe(6.78);
    });
  });

  describe("calculateNutrition (с БД)", () => {
    it("получает продукты и рассчитывает питательность", async () => {
      mockFindMany.mockResolvedValue([
        { id: "1", calories: 100, proteins: 10, fats: 5, carbs: 20 },
        { id: "2", calories: 50, proteins: 5, fats: 2, carbs: 10 }
      ]);

      const ingredients = [
        { productId: "1", grams: 150 },
        { productId: "2", grams: 200 }
      ];

      const result = await calculateNutrition(ingredients);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { id: { in: ["1", "2"] } },
        select: { id: true, calories: true, proteins: true, fats: true, carbs: true }
      });
      expect(result.calories).toBe(250);
    });

    it("выбрасывает UNKNOWN_PRODUCT, когда некоторые продукты отсутствуют", async () => {
      mockFindMany.mockResolvedValue([
        { id: "1", calories: 100, proteins: 10, fats: 5, carbs: 20 }
      ]);

      const ingredients = [
        { productId: "1", grams: 100 },
        { productId: "2", grams: 100 }
      ];

      await expect(calculateNutrition(ingredients)).rejects.toThrow(ApiError);
      await expect(calculateNutrition(ingredients)).rejects.toMatchObject({
        code: "UNKNOWN_PRODUCT",
        status: 400,
        details: { missingProductIds: ["2"] }
      });
    });

    it("обрабатывает пустой массив ингредиентов", async () => {
      mockFindMany.mockResolvedValue([]);
      const ingredients: { productId: string; grams: number }[] = [];

      const result = await calculateNutrition(ingredients);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { id: { in: [] } },
        select: { id: true, calories: true, proteins: true, fats: true, carbs: true }
      });
      expect(result).toEqual({ calories: 0, proteins: 0, fats: 0, carbs: 0 });
    });
  });

  describe("resolveAllowedFlags", () => {
    it("возвращает true для всех флагов, когда все продукты веганские/без глютена/без сахара", async () => {
      mockFindMany.mockResolvedValue([
        { id: "1", isVegan: true, isGlutenFree: true, isSugarFree: true },
        { id: "2", isVegan: true, isGlutenFree: true, isSugarFree: true }
      ]);

      const ingredients = [
        { productId: "1", grams: 100 },
        { productId: "2", grams: 100 }
      ];

      const result = await resolveAllowedFlags(ingredients);

      expect(result).toEqual({
        isVegan: true,
        isGlutenFree: true,
        isSugarFree: true
      });
    });

    it("возвращает false для веган, когда любой продукт не веган", async () => {
      mockFindMany.mockResolvedValue([
        { id: "1", isVegan: true, isGlutenFree: true, isSugarFree: true },
        { id: "2", isVegan: false, isGlutenFree: true, isSugarFree: true }
      ]);

      const ingredients = [
        { productId: "1", grams: 100 },
        { productId: "2", grams: 100 }
      ];

      const result = await resolveAllowedFlags(ingredients);

      expect(result.isVegan).toBe(false);
      expect(result.isGlutenFree).toBe(true);
      expect(result.isSugarFree).toBe(true);
    });

    it("возвращает false для без глютена, когда любой продукт не без глютена", async () => {
      mockFindMany.mockResolvedValue([
        { id: "1", isVegan: true, isGlutenFree: true, isSugarFree: true },
        { id: "2", isVegan: true, isGlutenFree: false, isSugarFree: true }
      ]);

      const ingredients = [
        { productId: "1", grams: 100 },
        { productId: "2", grams: 100 }
      ];

      const result = await resolveAllowedFlags(ingredients);

      expect(result.isVegan).toBe(true);
      expect(result.isGlutenFree).toBe(false);
      expect(result.isSugarFree).toBe(true);
    });

    it("возвращает false для без сахара, когда любой продукт не без сахара", async () => {
      mockFindMany.mockResolvedValue([
        { id: "1", isVegan: true, isGlutenFree: true, isSugarFree: true },
        { id: "2", isVegan: true, isGlutenFree: true, isSugarFree: false }
      ]);

      const ingredients = [
        { productId: "1", grams: 100 },
        { productId: "2", grams: 100 }
      ];

      const result = await resolveAllowedFlags(ingredients);

      expect(result.isVegan).toBe(true);
      expect(result.isGlutenFree).toBe(true);
      expect(result.isSugarFree).toBe(false);
    });

    it("выбрасывает UNKNOWN_PRODUCT, когда продукт не найден", async () => {
      mockFindMany.mockResolvedValue([]);

      const ingredients = [
        { productId: "missing", grams: 100 }
      ];

      await expect(resolveAllowedFlags(ingredients)).rejects.toThrow(ApiError);
      await expect(resolveAllowedFlags(ingredients)).rejects.toMatchObject({
        code: "UNKNOWN_PRODUCT",
        status: 400
      });
    });
  });
});