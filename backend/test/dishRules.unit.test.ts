import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateNutritionFromProducts,
  calculateNutritionPerPortion,
  resolveAllowedFlags,
  calculateNutrition,
  type DishIngredientInput,
} from '../src/modules/dishes/dishRules';
import { prisma } from '../src/db';
import { ApiError } from '../src/shared/apiError';

/**
 * Мокаем Prisma клиент для изоляции тестов от реальной БД
 */
vi.mock('../src/db', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

/**
 * Базовый тестовый продукт для переиспользования в тестах
 */
const BASE_TEST_PRODUCT = {
  id: 'test-product-1',
  name: 'Test Product',
  photos: [],
  calories: 100,
  proteins: 10,
  fats: 5,
  carbs: 15,
  compositionText: null,
  category: 'Vegetables' as const,
  preparationType: 'ReadyToEat' as const,
  isVegan: true,
  isGlutenFree: true,
  isSugarFree: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Фабрика для создания тестовых продуктов
 */
const createTestProduct = (overrides = {}) => ({
  ...BASE_TEST_PRODUCT,
  ...overrides,
});

/**
 * Фабрика для создания мок-продуктов для БД
 */
const createMockProduct = (overrides = {}) => ({
  ...BASE_TEST_PRODUCT,
  ...overrides,
});

describe('Тестирование системы расчёта питательности блюд', () => {
  describe('calculateNutritionFromProducts - расчёт питательности на 100г продукта', () => {
    describe('Классы эквивалентности: количество ингредиентов', () => {
      /**
       * Пустой список ингредиентов (0 ингредиентов)
       * Ожидаемый результат: нулевые значения питательности
       */
      it('EP: пустой массив ингредиентов -> нулевые значения питательности', () => {

        const ingredients: DishIngredientInput[] = [];
        const products = new Map();

        const result = calculateNutritionFromProducts(ingredients, products);

        expect(result).toEqual({
          calories: 0,
          proteins: 0,
          fats: 0,
          carbs: 0,
        });
      });

      /**
       * Один ингредиент
       * Ожидаемый результат: питательность равна питательности продукта на 100г
       */
      it('EP: один ингредиент 100г -> питательность равна значениям продукта', () => {
        const product = createTestProduct();
        const ingredients: DishIngredientInput[] = [
          { productId: product.id, grams: 100 },
        ];
        const products = new Map([[product.id, product]]);

        const result = calculateNutritionFromProducts(ingredients, products);

        expect(result).toEqual({
          calories: 100,
          proteins: 10,
          fats: 5,
          carbs: 15,
        });
      });

      /**
       * Несколько ингредиентов (2+)
       * Ожидаемый результат: сумма питательности всех ингредиентов с учётом веса
       */
      it('EP: несколько ингредиентов -> суммирование пропорционально весу', () => {
        const product1 = createTestProduct({ id: 'product-1' });
        const product2 = createTestProduct({
          id: 'product-2',
          calories: 200,
          proteins: 20,
          fats: 10,
          carbs: 30,
        });
        const ingredients: DishIngredientInput[] = [
          { productId: product1.id, grams: 50 },
          { productId: product2.id, grams: 200 },
        ];
        const products = new Map([
          [product1.id, product1],
          [product2.id, product2],
        ]);

        const result = calculateNutritionFromProducts(ingredients, products);

        expect(result.calories).toBe(450);
        expect(result.proteins).toBe(45);
        expect(result.fats).toBe(22.5);
        expect(result.carbs).toBe(67.5);
      });
    });

    describe('Граничный анализ: вес ингредиента', () => {
      /**
       * BVA: Минимальное значение (0)
       * Граница: 0 граммов
       */
      it('BVA: Вес = 0г -> нулевой вклад в питательность', () => {
        const product = createTestProduct();
        const ingredients: DishIngredientInput[] = [
          { productId: product.id, grams: 0 },
        ];
        const products = new Map([[product.id, product]]);

        const result = calculateNutritionFromProducts(ingredients, products);

        expect(result).toEqual({
          calories: 0,
          proteins: 0,
          fats: 0,
          carbs: 0,
        });
      });

      /**
       * BVA: Минимальное положительное значение (0.01)
       * Граница: чуть больше 0
       */
      it('BVA: Вес = 0.01г (минимальный положительный) -> масштабирование с округлением', () => {
        const product = createTestProduct();
        const ingredients: DishIngredientInput[] = [
          { productId: product.id, grams: 0.01 },
        ];
        const products = new Map([[product.id, product]]);

        const result = calculateNutritionFromProducts(ingredients, products);

        expect(result.calories).toBeCloseTo(0.01, 2);
        expect(result.proteins).toBe(0);
        expect(result.fats).toBe(0);
        expect(result.carbs).toBe(0);
      });

      /**
       * BVA: Нормальное значение (100г)
       */
      it('BVA: Вес = 100г (стандартный) -> питательность соответствует значениям продукта', () => {
        const product = createTestProduct();
        const ingredients: DishIngredientInput[] = [
          { productId: product.id, grams: 100 },
        ];
        const products = new Map([[product.id, product]]);

        const result = calculateNutritionFromProducts(ingredients, products);

        expect(result.calories).toBe(100);
        expect(result.proteins).toBe(10);
        expect(result.fats).toBe(5);
        expect(result.carbs).toBe(15);
      });

      /**
       * BVA: Максимальное значение (10000)
       * Проверка на переполнение и корректное масштабирование
       */
      it('BVA: Вес = 10000г (очень большой) -> линейное масштабирование', () => {
        const product = createTestProduct();
        const ingredients: DishIngredientInput[] = [
          { productId: product.id, grams: 10000 },
        ];
        const products = new Map([[product.id, product]]);

        const result = calculateNutritionFromProducts(ingredients, products);

        expect(result.calories).toBe(10000);
        expect(result.proteins).toBe(1000);
        expect(result.fats).toBe(500);
        expect(result.carbs).toBe(1500);
      });
    });

    describe('Граничный анализ: значения питательности продукта', () => {
      /**
       * BVA: Нулевые значения питательности
       */
      it('BVA: Все значения питательности = 0 -> результат = 0', () => {
        const product = createTestProduct({
          calories: 0,
          proteins: 0,
          fats: 0,
          carbs: 0,
        });
        const ingredients: DishIngredientInput[] = [
          { productId: product.id, grams: 100 },
        ];
        const products = new Map([[product.id, product]]);

        const result = calculateNutritionFromProducts(ingredients, products);

        expect(result).toEqual({
          calories: 0,
          proteins: 0,
          fats: 0,
          carbs: 0,
        });
      });

      /**
       * BVA: Очень большие значения питательности
       * Проверка на корректность сложения и масштабирования
       */
      it('BVA: Очень большие значения -> корректное масштабирование', () => {
        const product = createTestProduct({
          calories: 9999,
          proteins: 999,
          fats: 999,
          carbs: 999,
        });
        const ingredients: DishIngredientInput[] = [
          { productId: product.id, grams: 100 },
        ];
        const products = new Map([[product.id, product]]);

        const result = calculateNutritionFromProducts(ingredients, products);

        expect(result.calories).toBe(9999);
        expect(result.proteins).toBe(999);
        expect(result.fats).toBe(999);
        expect(result.carbs).toBe(999);
      });
    });

    describe('Особые сценарии', () => {
      /**
       * Обработка отсутствующих продуктов в Map
       */
      it('Отсутствующий продукт игнорируется при расчёте', () => {
        const existingProduct = createTestProduct();
        const ingredients: DishIngredientInput[] = [
          { productId: 'non-existent', grams: 100 },
          { productId: existingProduct.id, grams: 100 },
        ];
        const products = new Map([[existingProduct.id, existingProduct]]);

        const result = calculateNutritionFromProducts(ingredients, products);

        expect(result.calories).toBe(100);
        expect(result.proteins).toBe(10);
        expect(result.fats).toBe(5);
        expect(result.carbs).toBe(15);
      });

      /**
       * Проверка округления до 2 знаков после запятой
       */
      it('Дробные значения округляются до 2 знаков после запятой', () => {
        const product = createTestProduct({
          calories: 100.5555,
          proteins: 3.3333,
          fats: 2.7777,
          carbs: 1.1111,
        });
        const ingredients: DishIngredientInput[] = [
          { productId: product.id, grams: 100 },
        ];
        const products = new Map([[product.id, product]]);

        const result = calculateNutritionFromProducts(ingredients, products);

        expect(result.calories).toBe(100.56);
        expect(result.proteins).toBe(3.33);
        expect(result.fats).toBe(2.78);
        expect(result.carbs).toBe(1.11);
      });
    });
  });

  describe('calculateNutritionPerPortion - расчёт питательности на порцию', () => {
    
    const portionSizeScenarios = [
      { size: 0, expectedMultiplier: 0, description: 'нулевой размер' },
      { size: 1, expectedMultiplier: 0.01, description: 'минимальная порция' },
      { size: 50, expectedMultiplier: 0.5, description: 'маленькая порция' },
      { size: 100, expectedMultiplier: 1, description: 'стандартная порция' },
      { size: 250, expectedMultiplier: 2.5, description: 'средняя порция' },
      { size: 10000, expectedMultiplier: 100, description: 'очень большая порция' },
    ];

    portionSizeScenarios.forEach(({ size, expectedMultiplier, description }) => {
      it(`Масштабирование для ${description} (${size}г)`, () => {
        const product = createTestProduct();
        const ingredients: DishIngredientInput[] = [
          { productId: product.id, grams: 100 },
        ];
        const products = new Map([[product.id, product]]);

        const result = calculateNutritionPerPortion(ingredients, products, size);

        expect(result.calories).toBe(100 * expectedMultiplier);
        expect(result.proteins).toBe(10 * expectedMultiplier);
        expect(result.fats).toBe(5 * expectedMultiplier);
        expect(result.carbs).toBe(15 * expectedMultiplier);
      });
    });
  });

  describe('calculateNutrition - асинхронный расчёт с БД', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    /**
     * Позитивный сценарий: все продукты найдены
     */
    describe('Позитивные сценарии', () => {
      it('EP: все продукты найдены в БД -> корректный расчёт', async () => {
        const mockProducts = [
          createMockProduct({ id: 'p1', calories: 100, proteins: 10, fats: 5, carbs: 15 }),
          createMockProduct({ id: 'p2', calories: 200, proteins: 20, fats: 10, carbs: 30 }),
        ];
        vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
        const ingredients: DishIngredientInput[] = [
          { productId: 'p1', grams: 100 },
          { productId: 'p2', grams: 50 },
        ];

        const result = await calculateNutrition(ingredients);

        expect(result.calories).toBe(200);
        expect(result.proteins).toBe(20);
        expect(result.fats).toBe(10);
        expect(result.carbs).toBe(30);
      });

      it('EP: пустой список ингредиентов -> нулевые значения', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([]);

        const result = await calculateNutrition([]);

        expect(result).toEqual({
          calories: 0,
          proteins: 0,
          fats: 0,
          carbs: 0,
        });
      });
    });

    /**
     * Негативные сценарии: обработка ошибок
     */
    describe('Негативные сценарии', () => {
      it('EP: некоторые продукты не найдены -> ошибка UNKNOWN_PRODUCT', async () => {
        const mockProducts = [
          createMockProduct({ id: 'p1', calories: 100, proteins: 10, fats: 5, carbs: 15 }),
        ];
        vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
        const ingredients: DishIngredientInput[] = [
          { productId: 'p1', grams: 100 },
          { productId: 'non-existent', grams: 100 },
        ];

        await expect(calculateNutrition(ingredients)).rejects.toThrow(ApiError);
        await expect(calculateNutrition(ingredients)).rejects.toMatchObject({
          status: 400,
          code: 'UNKNOWN_PRODUCT',
        });
      });

      it('EP: ни одного продукта не найдено -> ошибка со списком всех ID', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([]);
        const ingredients: DishIngredientInput[] = [
          { productId: 'p1', grams: 100 },
          { productId: 'p2', grams: 100 },
        ];

        try {
          await calculateNutrition(ingredients);
          expect.fail('Должна быть выброшена ошибка');
        } catch (err) {
          expect(err).toBeInstanceOf(ApiError);
          expect((err as ApiError).status).toBe(400);
          expect((err as ApiError).code).toBe('UNKNOWN_PRODUCT');
          expect((err as ApiError).details).toEqual({
            missingProductIds: ['p1', 'p2'],
          });
        }
      });
    });
  });

  describe('resolveAllowedFlags - определение диетических ограничений', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    /**
     * Параметризованный тест для проверки флага isVegan
     */
    describe('Флаг isVegan - проверка веганскости', () => {
        const veganScenarios = [
          { 
          products: [
            { id: 'p1', isVegan: true, isGlutenFree: true, isSugarFree: true },
            { id: 'p2', isVegan: true, isGlutenFree: true, isSugarFree: true },
          ],
          expectedVegan: true,
          description: 'EP: все продукты веганские -> isVegan = true',
        },
        { 
          products: [
            { id: 'p1', isVegan: true, isGlutenFree: true, isSugarFree: true },
            { id: 'p2', isVegan: false, isGlutenFree: true, isSugarFree: true },
          ],
          expectedVegan: false,
          description: 'EP: хотя бы один невеганский продукт -> isVegan = false',
        },
      ];

      veganScenarios.forEach(({ products, expectedVegan, description }) => {
        it(description, async () => {
          const mockProducts = products.map((p) => 
            createMockProduct(p)
          );
          vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
          
          const ingredients = products.map((p) => ({
            productId: p.id,
            grams: 100,
          }));

          const result = await resolveAllowedFlags(ingredients);

          expect(result.isVegan).toBe(expectedVegan);
        });
      });
    });

    /**
     * Комбинированные сценарии со всеми флагами
     */
    describe('Комбинированные флаги', () => {
      it('Разные комбинации флагов -> все флаги false', async () => {
        const mockProducts = [
          createMockProduct({ id: 'p1', isVegan: true, isGlutenFree: false, isSugarFree: true }),
          createMockProduct({ id: 'p2', isVegan: false, isGlutenFree: true, isSugarFree: false }),
          createMockProduct({ id: 'p3', isVegan: true, isGlutenFree: true, isSugarFree: true }),
        ];
        vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
        
        const ingredients = [
          { productId: 'p1', grams: 50 },
          { productId: 'p2', grams: 50 },
          { productId: 'p3', grams: 50 },
        ];

        const result = await resolveAllowedFlags(ingredients);

        expect(result.isVegan).toBe(false);
        expect(result.isGlutenFree).toBe(false);
        expect(result.isSugarFree).toBe(false);
      });

      it('Все продукты соответствуют всем флагам -> все флаги true', async () => {
        const mockProducts = [
          createMockProduct({ id: 'p1', isVegan: true, isGlutenFree: true, isSugarFree: true }),
          createMockProduct({ id: 'p2', isVegan: true, isGlutenFree: true, isSugarFree: true }),
        ];
        vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
        
        const ingredients = [
          { productId: 'p1', grams: 100 },
          { productId: 'p2', grams: 100 },
        ];

        const result = await resolveAllowedFlags(ingredients);

        expect(result.isVegan).toBe(true);
        expect(result.isGlutenFree).toBe(true);
        expect(result.isSugarFree).toBe(true);
      });
    });

    /**
     * Граничные случаи для флагов
     */
    describe('Граничные случаи', () => {
      it('Один продукт со всеми true -> все флаги true', async () => {
        const mockProduct = createMockProduct({ 
          id: 'p1',
          isVegan: true, 
          isGlutenFree: true, 
          isSugarFree: true 
        });
        vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct]);
        
        const ingredients = [{ productId: 'p1', grams: 100 }];

        const result = await resolveAllowedFlags(ingredients);

        expect(result).toEqual({
          isVegan: true,
          isGlutenFree: true,
          isSugarFree: true,
        });
      });

      it('Один продукт со всеми false -> все флаги false', async () => {
        const mockProduct = createMockProduct({ 
          id: 'p1',
          isVegan: false, 
          isGlutenFree: false, 
          isSugarFree: false 
        });
        vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct]);
        
        const ingredients = [{ productId: 'p1', grams: 100 }];

        const result = await resolveAllowedFlags(ingredients);

        expect(result).toEqual({
          isVegan: false,
          isGlutenFree: false,
          isSugarFree: false,
        });
      });
    });
  });
});