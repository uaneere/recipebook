import { test, expect } from "../fixtures";
import { ProductsPage } from "../pages/ProductsPage";
import {
  createProduct,
  SEED_PRODUCTS
} from "../utils/api";
import {
  VALID_PRODUCTS,
  BVA_PRODUCTS,
  NAME_LENGTH_TESTS,
  INVALID_PRODUCTS
} from "../utils/testData";

test.describe("Страница со списком продуктов", () => {
  let productsPage: ProductsPage;

  test.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page);
    await productsPage.gotoList();
  });

  test.describe("Навигация и отображение", () => {
    test("должен загрузить страницу со списком товаров", async ({ page }) => {
      await expect(page).toHaveTitle(/Recipe|Рецепт/i);
      await expect(page.locator("body")).toContainText(/Продукты/i);
    });

    test("должен отображать начальные продукты", async ({ page }) => {
      const seedName = SEED_PRODUCTS.potato.name;
      const exists = await productsPage.exists(seedName);
      expect(exists).toBeTruthy();
    });
  });

  test.describe("Поиск", () => {
    test("должен фильтровать продукты по запросу поиска", async ({ page }) => {
      const searchTerm = SEED_PRODUCTS.water.name;
      await productsPage.search(searchTerm);
      expect(await productsPage.exists(searchTerm)).toBeTruthy();
    });

    test("должен показывать сообщение об отсутствии результатов для несуществующего продукта", async ({ page }) => {
      await productsPage.search("XYZ_NONEXISTENT_PRODUCT_XYZ");
      const pageText = await page.textContent("body");
      expect(pageText).toMatch(/не найдены|no results/i);
    });

    test("должен восстанавливать полный список после очистки поиска", async ({ page }) => {
      await productsPage.search("Test");
      await productsPage.clearSearch();
      const exists = await productsPage.exists(SEED_PRODUCTS.potato.name);
      expect(exists).toBeTruthy();
    });
  });

  test.describe("Создание продукта - Допустимые данные (эквивалентное разбиение)", () => {
    test.beforeEach(async ({ page }) => {
      await productsPage.gotoCreate();
    });

    for (const product of VALID_PRODUCTS) {
      test(`должен создать валидный продукт: ${product.name}`, async ({ page, api }) => {
        const timestamp = Date.now();
        const uniqueName = `${product.name}_${timestamp}`;

        await productsPage.fillForm({ ...product, name: uniqueName });
        await productsPage.submit();

        await productsPage.gotoList();
        const exists = await productsPage.exists(uniqueName);
        expect(exists).toBeTruthy();
      });
    }
  });

  test.describe("Создание продукта - Анализ граничных значений", () => {
    test.beforeEach(async ({ page }) => {
      await productsPage.gotoCreate();
    });

    test("должен обрабатывать минимальное значение калорий (0)", async ({ page }) => {
      const product = { ...BVA_PRODUCTS.minCalories, name: `Min_Cal_${Date.now()}` };
      await productsPage.fillForm(product);
      await productsPage.submit();
      await productsPage.gotoList();
      expect(await productsPage.exists(product.name)).toBeTruthy();
    });

    test("должен обрабатывать высокое значение калорий (717)", async ({ page }) => {
      const product = { ...BVA_PRODUCTS.maxCalories, name: `Max_Cal_${Date.now()}` };
      await productsPage.fillForm(product);
      await productsPage.submit();
      await productsPage.gotoList();
      expect(await productsPage.exists(product.name)).toBeTruthy();
    });

    test("должен обрабатывать граничное значение суммы макронутриентов (100)", async ({ page }) => {
      const product = { ...BVA_PRODUCTS.maxMacrosSum, name: `MaxMacros_${Date.now()}` };
      await productsPage.fillForm(product);
      await productsPage.submit();
      await productsPage.gotoList();
      expect(await productsPage.exists(product.name)).toBeTruthy();
    });
  });

  test.describe("Создание продукта - Недопустимые данные (эквивалентное разбиение)", () => {
    test.beforeEach(async ({ page }) => {
      await productsPage.gotoCreate();
    });

    test("должен отклонять продукт с пустым названием", async ({ page }) => {
      const invalidProduct = INVALID_PRODUCTS[0];
      await productsPage.fillForm(invalidProduct as any);
      await productsPage.submit();
      const errorVisible = await page.locator("text=/ошибка|error/i").isVisible().catch(() => false);
      expect(errorVisible || page.url().includes("/products/new")).toBeTruthy();
    });

    test("должен отклонять продукт с суммой БЖУ > 100", async ({ page }) => {
      const invalidProduct = INVALID_PRODUCTS[2];
      await productsPage.fillForm(invalidProduct as any);
      await productsPage.submit();
      const errorVisible = await page.locator("text=/ошибка|error|больше 100/i").isVisible().catch(() => false);
      expect(errorVisible || page.url().includes("/products/new")).toBeTruthy();
    });
  });

  test.describe("Информация о продукте", () => {
    test("должен перейти к карточке продукта и отобразить информацию о продукте", async ({ page, api }) => {
      const product = { 
        ...VALID_PRODUCTS[0],
        name: `Detail_Test_${Date.now()}`,
      };
      const { id } = await createProduct(api, product as any);

      await productsPage.gotoList();
      await productsPage.clickProduct(product.name);
      await page.waitForURL(`**/products/${id}`);
      await page.locator('h1.h1', { hasText: product.name }).waitFor({ timeout: 10000 });

      expect(page.url()).toContain(`/products/${id}`);
      const pageText = await page.textContent("body");
      expect(pageText).toContain(product.name);
    });
  });
});