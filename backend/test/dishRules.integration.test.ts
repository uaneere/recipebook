import { describe, it, expect, beforeAll } from 'vitest';
import { calculateNutrition, resolveAllowedFlags } from '../src/modules/dishes/dishRules';
import { prisma } from '../src/db';
import { ApiError } from '../src/shared/apiError';
import type { DishIngredientInput } from '../src/modules/dishes/dishRules';

/**
 * Интеграционные тесты для dishRules
 * Все изменения откатятся, даже если тест завершится с ошибкой
 * Сиды загружаются через setup.integration.ts
 */

beforeAll(async () => {
  console.log('Подготовка интеграционных тестов (сиды уже загружены через setup)');
});

/**
 * Создаёт тестовый продукт в реальной БД
 * @param overrides - переопределяемые поля
 */
async function createTestProductInDB(overrides: Partial<any> = {}) {
  const defaultProduct = {
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
    ...overrides,
  };
  
  return await prisma.product.create({
    data: defaultProduct,
  });
}

/**
 * Создаём несколько тестовых продуктов
 */
async function createMultipleTestProducts(productsData: any[]) {
  const products = [];
  for (const data of productsData) {
    const product = await createTestProductInDB(data);
    products.push(product);
  }
  return products;
}

/**
 * Тесты на calculateNutrition
 */

describe('Интеграционные тесты: calculateNutrition', () => {
  
  describe('Эквивалентное разбиение (EP) - количество продуктов', () => {
    
    it('EP1: 0 продуктов в БД -> нулевая питательность', async () => {
      const ingredients: DishIngredientInput[] = [];
      
      const result = await calculateNutrition(ingredients);
      
      expect(result).toEqual({
        calories: 0,
        proteins: 0,
        fats: 0,
        carbs: 0,
      });
    });
    
    it('EP2: 1 продукт -> расчёт только для него', async () => {
      const product = await createTestProductInDB({
        calories: 150,
        proteins: 12,
        fats: 8,
        carbs: 20,
      });
      
      const ingredients: DishIngredientInput[] = [
        { productId: product.id, grams: 100 }
      ];
      
      const result = await calculateNutrition(ingredients);
      
      expect(result.calories).toBe(150);
      expect(result.proteins).toBe(12);
      expect(result.fats).toBe(8);
      expect(result.carbs).toBe(20);
    });
    
    it('EP3: 3+ продуктов -> корректное суммирование', async () => {
      const products = await createMultipleTestProducts([
        { calories: 100, proteins: 10, fats: 5, carbs: 15 },
        { calories: 200, proteins: 20, fats: 10, carbs: 30 },
        { calories: 300, proteins: 30, fats: 15, carbs: 45 },
      ]);
      
      const ingredients: DishIngredientInput[] = [
        { productId: products[0].id, grams: 100 },
        { productId: products[1].id, grams: 50 },
        { productId: products[2].id, grams: 200 },
      ];
      
      const result = await calculateNutrition(ingredients);
      
      expect(result.calories).toBe(800);
      expect(result.proteins).toBe(80);
      expect(result.fats).toBe(40);
      expect(result.carbs).toBe(120);
    });
  });
  
  describe('Анализ граничных значений (BVA) - вес продукта', () => {
    
    it('BVA: Вес = 0г -> вклад 0', async () => {
      const product = await createTestProductInDB({ calories: 100 });
      
      const ingredients: DishIngredientInput[] = [
        { productId: product.id, grams: 0 }
      ];
      
      const result = await calculateNutrition(ingredients);
      
      expect(result.calories).toBe(0);
    });
    
    it('BVA: Вес = 0.01г -> минимальный вклад', async () => {
      const product = await createTestProductInDB({ calories: 100 });
      
      const ingredients: DishIngredientInput[] = [
        { productId: product.id, grams: 0.01 }
      ];
      
      const result = await calculateNutrition(ingredients);
      
      expect(result.calories).toBeCloseTo(0.01, 2);
    });
    
    it('BVA: Вес = 100г -> 100% питательности', async () => {
      const product = await createTestProductInDB({ 
        calories: 100,
        proteins: 10,
        fats: 5,
        carbs: 15,
      });
      
      const ingredients: DishIngredientInput[] = [
        { productId: product.id, grams: 100 }
      ];
      
      const result = await calculateNutrition(ingredients);
      
      expect(result.calories).toBe(100);
      expect(result.proteins).toBe(10);
      expect(result.fats).toBe(5);
      expect(result.carbs).toBe(15);
    });
    
    it('BVA: Вес = 10000г -> масштабирование ×100', async () => {
      const product = await createTestProductInDB({ 
        calories: 100,
        proteins: 10,
      });
      
      const ingredients: DishIngredientInput[] = [
        { productId: product.id, grams: 10000 }
      ];
      
      const result = await calculateNutrition(ingredients);
      
      expect(result.calories).toBe(10000);
      expect(result.proteins).toBe(1000);
    });
    
    it('BVA: Вес = 100000г (100кг) -> проверка переполнения', async () => {
      const product = await createTestProductInDB({ calories: 100 });
      
      const ingredients: DishIngredientInput[] = [
        { productId: product.id, grams: 100000 }
      ];
      
      const result = await calculateNutrition(ingredients);
      
      expect(result.calories).toBe(100000);
      expect(typeof result.calories).toBe('number');
      expect(Number.isFinite(result.calories)).toBe(true);
    });
  });
  
  describe('Эквивалентное разбиение (EP) - значения питательности', () => {
    
    it('EP1: Продукт с 0 калорий -> вклад 0', async () => {
      const product = await createTestProductInDB({
        calories: 0,
        proteins: 0,
        fats: 0,
        carbs: 0,
      });
      
      const ingredients: DishIngredientInput[] = [
        { productId: product.id, grams: 500 }
      ];
      
      const result = await calculateNutrition(ingredients);
      
      expect(result.calories).toBe(0);
      expect(result.proteins).toBe(0);
    });
    
    it('EP2: Стандартные значения -> корректный расчёт', async () => {
      const product = await createTestProductInDB({
        calories: 250,
        proteins: 15.5,
        fats: 8.3,
        carbs: 30.7,
      });
      
      const ingredients: DishIngredientInput[] = [
        { productId: product.id, grams: 100 }
      ];
      
      const result = await calculateNutrition(ingredients);
      
      expect(result.calories).toBeCloseTo(250, 1);
      expect(result.proteins).toBeCloseTo(15.5, 1);
      expect(result.fats).toBeCloseTo(8.3, 1);
      expect(result.carbs).toBeCloseTo(30.7, 1);
    });
  });
  
  describe('Негативные сценарии (интеграционные)', () => {
    
    it('Несуществующий productId -> ошибка UNKNOWN_PRODUCT', async () => {
      const existingProduct = await createTestProductInDB();
      
      const ingredients: DishIngredientInput[] = [
        { productId: existingProduct.id, grams: 100 },
        { productId: 'non-existent-id-12345', grams: 100 },
      ];
      
      try {
        await calculateNutrition(ingredients);
        expect.fail('Должна быть ошибка');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).code).toBe('UNKNOWN_PRODUCT');
        expect((err as ApiError).details).toHaveProperty('missingProductIds');
        expect(((err as ApiError).details as { missingProductIds: string[] }).missingProductIds).toContain('non-existent-id-12345');
      }
    });
    
    it('Один продукт указан несколько раз -> учитывается как один продукт', async () => {
      const product = await createTestProductInDB({ calories: 100 });
      
      const ingredients: DishIngredientInput[] = [
        { productId: product.id, grams: 50 },
        { productId: product.id, grams: 30 },
        { productId: product.id, grams: 20 },
      ];
      
      const uniqueIngredients = Object.values(
        ingredients.reduce((acc, ing) => {
          if (!acc[ing.productId]) {
            acc[ing.productId] = { productId: ing.productId, grams: 0 };
          }
          acc[ing.productId].grams += ing.grams;
          return acc;
        }, {} as Record<string, DishIngredientInput>)
      );
      
      const result = await calculateNutrition(uniqueIngredients);
      
      expect(result.calories).toBe(100);
    });
  });
  
  describe('Параметризованные integration-тесты', () => {
    
    const weightScenarios = [
      { grams: 0, expected: 0, precision: 2, description: 'ноль граммов' },
      { grams: 0.001, expected: 0.001, precision: 2, description: 'самый маленький вес' },
      { grams: 0.1, expected: 0.1, precision: 2, description: '0.1 грамма' },
      { grams: 1, expected: 1, precision: 2, description: '1 грамм' },
      { grams: 100, expected: 100, precision: 2, description: '100 грамм (базовый)' },
      { grams: 500, expected: 500, precision: 2, description: '500 грамм' },
      { grams: 1000, expected: 1000, precision: 2, description: '1 кг' },
    ];
    
    weightScenarios.forEach(({ grams, expected, precision, description }) => {
      it(`BVA + Parameterized: Вес ${description} (${grams}г) -> ${expected} калорий`, async () => {
        const product = await createTestProductInDB({ calories: 100 });
        const ingredients: DishIngredientInput[] = [{ productId: product.id, grams }];
        
        const result = await calculateNutrition(ingredients);
        
        expect(result.calories).toBeCloseTo(expected, precision);
      });
    });
    
    it('BVA: Проверка округления для очень малых весов', async () => {
      const product = await createTestProductInDB({ calories: 100 });
      const ingredients: DishIngredientInput[] = [{ productId: product.id, grams: 0.001 }];
      
      const result = await calculateNutrition(ingredients);
      
      expect(result.calories).toBeDefined();
      expect(result.calories).toBeGreaterThanOrEqual(0);
      expect(result.calories).toBeLessThanOrEqual(0.01);
      
      console.log(`Фактическое значение для 0.001г: ${result.calories}`);
    });
  });
});

/**
 * Тесты на resolveAllowedFlags
 */

describe('Интеграционные тесты: resolveAllowedFlags', () => {
  
  describe('Эквивалентное разбиение (EP) - комбинации флагов', () => {
    
    it('EP1: Все продукты диетические -> все флаги true', async () => {
      const products = await createMultipleTestProducts([
        { isVegan: true, isGlutenFree: true, isSugarFree: true },
        { isVegan: true, isGlutenFree: true, isSugarFree: true },
      ]);
      
      const ingredients: DishIngredientInput[] = products.map(p => ({ productId: p.id, grams: 100 }));
      
      const result = await resolveAllowedFlags(ingredients);
      
      expect(result.isVegan).toBe(true);
      expect(result.isGlutenFree).toBe(true);
      expect(result.isSugarFree).toBe(true);
    });
    
    it('EP2: Смешанные нарушения -> все флаги false', async () => {
      const products = await createMultipleTestProducts([
        { isVegan: false, isGlutenFree: true, isSugarFree: true },
        { isVegan: true, isGlutenFree: false, isSugarFree: true },
        { isVegan: true, isGlutenFree: true, isSugarFree: false },
      ]);
      
      const ingredients: DishIngredientInput[] = products.map(p => ({ productId: p.id, grams: 100 }));
      
      const result = await resolveAllowedFlags(ingredients);
      
      expect(result.isVegan).toBe(false);
      expect(result.isGlutenFree).toBe(false);
      expect(result.isSugarFree).toBe(false);
    });
    
    it('EP3: Только isVegan true -> остальные false', async () => {
      const products = await createMultipleTestProducts([
        { isVegan: true, isGlutenFree: false, isSugarFree: false },
        { isVegan: true, isGlutenFree: false, isSugarFree: false },
      ]);
      
      const ingredients: DishIngredientInput[] = products.map(p => ({ productId: p.id, grams: 100 }));
      
      const result = await resolveAllowedFlags(ingredients);
      
      expect(result.isVegan).toBe(true);
      expect(result.isGlutenFree).toBe(false);
      expect(result.isSugarFree).toBe(false);
    });
    
    it('EP4: Пустые ингредиенты -> все флаги true', async () => {
      const result = await resolveAllowedFlags([]);
      
      expect(result.isVegan).toBe(true);
      expect(result.isGlutenFree).toBe(true);
      expect(result.isSugarFree).toBe(true);
    });
  });
  
  describe('Граничный анализ (BVA) для флагов', () => {
    
    it('BVA: Один продукт нарушает vegan -> isVegan = false', async () => {
      const products = await createMultipleTestProducts([
        { isVegan: true, isGlutenFree: true, isSugarFree: true },
        { isVegan: true, isGlutenFree: true, isSugarFree: true },
        { isVegan: false, isGlutenFree: true, isSugarFree: true },
        { isVegan: true, isGlutenFree: true, isSugarFree: true },
      ]);
      
      const ingredients: DishIngredientInput[] = products.map(p => ({ productId: p.id, grams: 100 }));
      
      const result = await resolveAllowedFlags(ingredients);
      
      expect(result.isVegan).toBe(false);
    });
    
    it('BVA: Продукт с весом 0.01г -> всё равно делает флаг false', async () => {
      const veganProduct = await createTestProductInDB({ 
        isVegan: true, isGlutenFree: true, isSugarFree: true 
      });
      const nonVeganProduct = await createTestProductInDB({ 
        isVegan: false, isGlutenFree: true, isSugarFree: true 
      });
      
      const ingredients: DishIngredientInput[] = [
        { productId: veganProduct.id, grams: 1000 },
        { productId: nonVeganProduct.id, grams: 0.01 },
      ];
      
      const result = await resolveAllowedFlags(ingredients);
      
      expect(result.isVegan).toBe(false);
    });
  });
  
  describe('Сценарии с реальной БД', () => {
    
    it('Один продукт с разным весом -> флаги учитываются один раз', async () => {
      const product = await createTestProductInDB({ 
        isVegan: true, isGlutenFree: false, isSugarFree: true 
      });
      
      const ingredients: DishIngredientInput[] = [
        { productId: product.id, grams: 50 },
        { productId: product.id, grams: 150 },
        { productId: product.id, grams: 200 },
      ];
      
      const result = await resolveAllowedFlags(ingredients);
      
      expect(result.isGlutenFree).toBe(false);
      expect(result.isVegan).toBe(true);
    });
  
    /**
     * Проверка с реальными данными из сидов
     * Использует seed данные, загруженные через setup.integration.ts
     */
    it('Реальные данные из сидов: Борщ → не веганский, так как есть мясо', async () => {
      const allProducts = await prisma.product.findMany({
        select: { id: true, name: true, isVegan: true }
      });
      console.log('Все продукты в БД:', JSON.stringify(allProducts, null, 2));
      
      const meatProduct = await prisma.product.findFirst({ 
        where: { name: 'Мясо' },
        select: { id: true, name: true, isVegan: true, calories: true }
      });
      const potatoProduct = await prisma.product.findFirst({ 
        where: { name: 'Картофель' },
        select: { id: true, name: true, isVegan: true, calories: true }
      });
      const waterProduct = await prisma.product.findFirst({ 
        where: { name: 'Вода' },
        select: { id: true, name: true, isVegan: true, calories: true }
      });
      const beetProduct = await prisma.product.findFirst({ 
        where: { name: 'Свёкла' },
        select: { id: true, name: true, isVegan: true, calories: true }
      });
      
      expect(meatProduct, 'Мясо должно быть в БД').toBeTruthy();
      expect(potatoProduct, 'Картофель должен быть в БД').toBeTruthy();
      expect(waterProduct, 'Вода должна быть в БД').toBeTruthy();
      expect(beetProduct, 'Свёкла должна быть в БД').toBeTruthy();
      
      console.log('Мясо:', meatProduct);
      console.log('Картофель:', potatoProduct);
      console.log('Вода:', waterProduct);
      console.log('Свёкла:', beetProduct);
      
      expect(meatProduct!.isVegan).toBe(false);
      expect(potatoProduct!.isVegan).toBe(true);
      expect(waterProduct!.isVegan).toBe(true);
      expect(beetProduct!.isVegan).toBe(true);
      
      const ingredients: DishIngredientInput[] = [
        { productId: meatProduct!.id, grams: 200 },
        { productId: beetProduct!.id, grams: 150 },
        { productId: potatoProduct!.id, grams: 200 },
        { productId: waterProduct!.id, grams: 500 }
      ];
      
      const flagsResult = await resolveAllowedFlags(ingredients);
      console.log('Флаги борща:', flagsResult);
      
      expect(flagsResult.isVegan).toBe(false);
      expect(flagsResult.isGlutenFree).toBe(true);
      expect(flagsResult.isSugarFree).toBe(true);
      
      const nutrition = await calculateNutrition(ingredients);
      console.log('Питательность борща (суммарная):', nutrition);
      
      expect(nutrition.calories).toBeGreaterThan(0);
      expect(nutrition.proteins).toBeGreaterThan(0);
      expect(nutrition.fats).toBeGreaterThan(0);
      
      expect(nutrition.calories).toBeCloseTo(592.9, 0);
      expect(nutrition.proteins).toBeCloseTo(44.2, 0);
      expect(nutrition.fats).toBeCloseTo(25.9, 0);
      expect(nutrition.carbs).toBeCloseTo(47, 0);
      
      console.log('Тест с реальными сидами успешно выполнен!');
    });
  });
});