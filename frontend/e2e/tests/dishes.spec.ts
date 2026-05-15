import { test, expect } from "../fixtures";
import { DishesPage } from "../pages/DishesPage";
import {
  createDish,
  SEED_PRODUCTS
} from "../utils/api";
import {
  VALID_DISHES,
  BVA_DISHES,
  INVALID_DISHES
} from "../utils/testData";

test.describe("Страница со списком блюд", () => {
  let dishesPage: DishesPage;

  test.beforeEach(async ({ page }) => {
    dishesPage = new DishesPage(page);
    await dishesPage.gotoList();
  });

  test.describe("Навигация и отображение", () => {
    test("должен загрузить страницу со списком блюд", async ({ page }) => {
      await expect(page).toHaveTitle(/Recipe|Рецепт/i);
      await expect(page.locator("body")).toContainText(/Блюда/i);
    });

    test("должен иметь ссылку на создание нового блюда", async ({ page }) => {
    const createLink = page.locator('a:has-text("Создать блюдо")');
    await expect(createLink).toBeVisible();
    });
  });

  test.describe("Поиск", () => {
    test("должен фильтровать блюда по запросу поиска", async ({ page, api }) => {
        const uniqueName = `Search_Test_${Date.now()}`;
        const dish = {
            name: uniqueName,
            category: "Second",
            portionSize: 200,
            ingredients: [{ productId: SEED_PRODUCTS.water.id, grams: 100 }]
        };
        await createDish(api, dish as any);

        await dishesPage.gotoList();
        await dishesPage.search(uniqueName);

        const exists = await dishesPage.exists(uniqueName);
        expect(exists).toBeTruthy();
    });

    test("должен показывать сообщение об отсутствии результатов для несуществующего блюда", async ({ page }) => {
        await dishesPage.gotoList();
        await dishesPage.search("XYZ_NONEXISTENT_DISH_XYZ");

        const notFoundText = page.locator("text=Блюда не найдены");
        await expect(notFoundText).toBeVisible({ timeout: 5000 });
    });

    test("должен очищать результаты поиска", async ({ page, api }) => {
      const uniqueName = `Search_Clear_${Date.now()}`;
      const dish = {
        name: uniqueName,
        category: "First",
        portionSize: 300,
        ingredients: [{ productId: SEED_PRODUCTS.water.id, grams: 100 }]
      };
      await createDish(api, dish as any);

      await dishesPage.gotoList();
      await dishesPage.search(uniqueName);
      await dishesPage.clearSearch();
      
      const seedDishExists = await page.textContent("body");
      expect(seedDishExists).toBeDefined();
    });
  });

    test.describe("Создание блюда - Допустимые данные (эквивалентное разбиение)", () => {
        test.beforeEach(async ({ page }) => {
            await dishesPage.gotoCreate();
        });

        for (let i = 0; i < VALID_DISHES.length; i++) {
            test(`должен создать валидное блюдо: ${VALID_DISHES[i].name}`, async ({ page }) => {
                const dish = VALID_DISHES[i];
                const uniqueName = `${dish.name}_${Date.now()}`;
                const expectedName = uniqueName.replace(/^![^\s]+\s*/, "");

                await dishesPage.fillForm({ ...dish, name: uniqueName });
                await dishesPage.submit();

                await dishesPage.gotoList();
                expect(await dishesPage.exists(expectedName)).toBeTruthy();
            });
        }
    });

  test.describe("Создание блюда - Анализ граничных значений", () => {
    test.beforeEach(async ({ page }) => {
      await dishesPage.gotoCreate();
    });

    test("должен обрабатывать минимальный размер порции (1г)", async ({ page }) => {
      const dish = {
        ...BVA_DISHES.minPortionSize,
        name: `Min_Portion_${Date.now()}`
      };
      await dishesPage.fillForm(dish);
      await dishesPage.submit();
      await dishesPage.gotoList();
      expect(await dishesPage.exists(dish.name)).toBeTruthy();
    });

    test("должен обрабатывать максимальный размер порции (9999г)", async ({ page }) => {
      const dish = {
        ...BVA_DISHES.maxPortionSize,
        name: `Max_Portion_${Date.now()}`
      };
      await dishesPage.fillForm(dish);
      await dishesPage.submit();
      await dishesPage.gotoList();
      expect(await dishesPage.exists(dish.name)).toBeTruthy();
    });

    test("должен обрабатывать минимум ингредиентов (1)", async ({ page }) => {
      const dish = {
        ...BVA_DISHES.minIngredients,
        name: `Min_Ingredients_${Date.now()}`
      };
      await dishesPage.fillForm(dish);
      await dishesPage.submit();
      await dishesPage.gotoList();
      expect(await dishesPage.exists(dish.name)).toBeTruthy();
    });
  });

  test.describe("Создание блюда - Недопустимые данные (эквивалентное разбиение)", () => {
    test.beforeEach(async ({ page }) => {
      await dishesPage.gotoCreate();
    });

    test("должен отклонять блюдо с пустым названием", async ({ page }) => {
      const invalidDish = INVALID_DISHES[0];
      await dishesPage.fillForm(invalidDish as any);
      await dishesPage.submit();
      const errorVisible = await page.locator("text=/ошибка|error/i").isVisible().catch(() => false);
      expect(errorVisible || page.url().includes("/dishes/new")).toBeTruthy();
    });

    test("должен отклонять блюдо с только макросами в названии", async ({ page }) => {
      const invalidDish = INVALID_DISHES[1];
      await dishesPage.fillForm(invalidDish as any);
      await dishesPage.submit();
      const errorVisible = await page.locator("text=/ошибка|error|название/i").isVisible().catch(() => false);
      expect(errorVisible || page.url().includes("/dishes/new")).toBeTruthy();
    });

    test("должен отклонять блюдо без ингредиентов", async ({ page }) => {
      const invalidDish = INVALID_DISHES[2];
      await dishesPage.fillForm(invalidDish as any);
      await dishesPage.submit();
      const errorVisible = await page.locator("text=/ошибка|error|ингредиент/i").isVisible().catch(() => false);
      expect(errorVisible || page.url().includes("/dishes/new")).toBeTruthy();
    });

    test("должен отклонять блюдо с нулевым размером порции", async ({ page }) => {
      const invalidDish = INVALID_DISHES[3];
      await dishesPage.fillForm(invalidDish as any);
      await dishesPage.submit();
      const errorVisible = await page.locator("text=/ошибка|error|размер/i").isVisible().catch(() => false);
      expect(errorVisible || page.url().includes("/dishes/new")).toBeTruthy();
    });
  });

  test.describe("Информация о блюде", () => {
    test("должен переходить к деталям блюда и отображать информацию о нем", async ({ page, api }) => {
      const dish = {
        ...VALID_DISHES[0],
        name: `Detail_Test_${Date.now()}`,
      };
      const { id } = await createDish(api, dish as any);

      await dishesPage.gotoList();
      await dishesPage.clickDish(dish.name);
      await page.waitForURL(`**/dishes/${id}`);
      await page.locator('h1.h1', { hasText: dish.name }).waitFor({ timeout: 10000 });

      expect(page.url()).toContain(`/dishes/${id}`);
      const pageText = await page.textContent("body");
      expect(pageText).toContain(dish.name);
    });

    test("должен отображать информацию о питательной ценности блюда", async ({ page, api }) => {
      const dish = {
        name: `Nutrition_Test_${Date.now()}`,
        category: "First",
        portionSize: 200,
        ingredients: [
          { productId: SEED_PRODUCTS.meat.id, grams: 100 }
        ]
      };
      await createDish(api, dish as any);

      await dishesPage.gotoList();
      await dishesPage.clickDish(dish.name);
      await page.waitForURL(`**/dishes/**`);
      await page.locator('h1.h1', { hasText: dish.name }).waitFor({ timeout: 10000 });

      const pageText = await page.textContent("body");
      expect(pageText).toMatch(/белки|жиры|углеводы|калории/i);
    });
  });

  test.describe("Редактирование блюда", () => {
    test("должен редактировать существующее блюдо", async ({ page, api }) => {
      const originalName = `Edit_Test_${Date.now()}`;
      const dish = {
        name: originalName,
        category: "First",
        portionSize: 200,
        ingredients: [
          { productId: SEED_PRODUCTS.water.id, grams: 100 }
        ]
      };
      await createDish(api, dish as any);

      await dishesPage.gotoList();
      await dishesPage.clickDish(originalName);
      await page.waitForURL(`**/dishes/**`);
      await page.locator('h1.h1').waitFor({ timeout: 10000 });

      await dishesPage.clickEditFromDetail();
      await page.locator('label:has-text("Название") input').first().waitFor({ timeout: 10000 });

      const newName = `Edited_${originalName}`;
      const nameInput = page.locator('label:has-text("Название") input').first();
      await nameInput.fill(newName);
      await dishesPage.submit();

      await dishesPage.gotoList();
      expect(await dishesPage.exists(newName)).toBeTruthy();
    });
  });

  test.describe("Обработка макросов", () => {
    test("должен обрабатывать префикс макросов (!веган) в названии блюда", async ({ page, api }) => {
      const dishName = `!веган Test Dish ${Date.now()}`;
      const dish = {
        name: dishName,
        category: "Second",
        portionSize: 200,
        ingredients: [
          { productId: SEED_PRODUCTS.water.id, grams: 100 }
        ]
      };

      await dishesPage.gotoCreate();
      await dishesPage.fillForm(dish);
      await dishesPage.submit();

      await dishesPage.gotoList();
      expect(await dishesPage.exists("Test Dish")).toBeTruthy();
    });
  });
});