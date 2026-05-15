import { Page } from "@playwright/test";

/**
 * Переход на страницу списка продуктаов
 */
export async function navigateToProducts(page: Page): Promise<void> {
  await page.goto("/products");
  await page.waitForLoadState("networkidle");
}

/**
 * Переход на страницу со списком блюд
 */
export async function navigateToDishes(page: Page): Promise<void> {
  await page.goto("/dishes");
  await page.waitForLoadState("networkidle");
}

/**
 * Переход на страницу создания продукта
 */
export async function navigateToCreateProduct(page: Page): Promise<void> {
  await page.goto("/products/new");
  await page.waitForLoadState("networkidle");
}

/**
 * Переход на страницу создания блюда
 */
export async function navigateToCreateDish(page: Page): Promise<void> {
  await page.goto("/dishes/new");
  await page.waitForLoadState("networkidle");
}

/**
 * Заполнение формы продукта
 */
export async function fillProductForm(
  page: Page,
  data: {
    name: string;
    calories: number;
    proteins: number;
    fats: number;
    carbs: number;
    category?: string;
    preparationType?: string;
  }
): Promise<void> {
  await page.waitForSelector("input", { timeout: 10000 });

  const nameInput = page.locator('label:has-text("Название") input').first();
  await nameInput.fill(data.name);

  const caloriesInput = page.locator('label:has-text("Калории") input');
  const proteinsInput = page.locator('label:has-text("Белки") input');
  const fatsInput = page.locator('label:has-text("Жиры") input');
  const carbsInput = page.locator('label:has-text("Углеводы") input');

  await caloriesInput.fill(String(data.calories));
  await proteinsInput.fill(String(data.proteins));
  await fatsInput.fill(String(data.fats));
  await carbsInput.fill(String(data.carbs));

  const categorySelect = page.locator('label:has-text("Категория") select').first();
  if (data.category) {
    await categorySelect.selectOption(data.category);
  } else {
    await categorySelect.selectOption({ index: 1 });
  }

  const preparationSelect = page.locator('label:has-text("Тип") select').first();
  if (data.preparationType) {
    await preparationSelect.selectOption(data.preparationType);
  } else {
    await preparationSelect.selectOption("ReadyToEat");
  }
}

/**
 * Заполнение формы блюда
 */
export async function fillDishForm(
  page: Page,
  data: {
    name: string;
    category?: string;
    portionSize?: number;
    ingredients?: Array<{ productId: string; grams: number }>;
  }
): Promise<void> {
  await page.waitForSelector("input", { timeout: 10000 });

  const nameInput = page.locator('label:has-text("Название") input').first();
  await nameInput.fill(data.name);

  if (data.category) {
    const categorySelect = page.locator('label:has-text("Категория") select').first();
    await categorySelect.selectOption(data.category);
  }

  if (data.portionSize !== undefined) {
    const portionInput = page.locator('label:has-text("Размер порции") input[type="number"]');
    await portionInput.fill(String(data.portionSize));
  }

  if (data.ingredients && data.ingredients.length > 0) {
    const addIngredientButton = page.locator('button:has-text("Добавить ингредиент")');

    for (let i = 1; i < data.ingredients.length; i++) {
      await addIngredientButton.click();
    }

    const selects = page.locator('select');
    const numberInputs = page.locator('input[type="number"]');

    for (let i = 0; i < data.ingredients.length; i++) {
      const ingredient = data.ingredients[i];
      const productSelect = selects.nth(1 + i);
      await productSelect.waitFor({ timeout: 5000 });
      await productSelect.selectOption(ingredient.productId);

      const gramsInput = numberInputs.nth(1 + i);
      await gramsInput.fill(String(ingredient.grams));
    }
  }
}

/**
 * Отправить форму
 */
export async function submitForm(page: Page): Promise<void> {
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.first().click();
  await page.waitForLoadState("networkidle");
}

/**
 * Проверка, существует ли продукт в списке
 */
export async function productExists(page: Page, productName: string): Promise<boolean> {
  try {
    await page.waitForSelector(`.trow:has-text("${productName}")`, { timeout: 7000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Проверка, существует ли блюдо в списке
 */
export async function dishExists(page: Page, dishName: string): Promise<boolean> {
  try {
    await page.waitForSelector(`.trow:has-text("${dishName}")`, { timeout: 7000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Поиск предметов
 */
export async function search(page: Page, query: string): Promise<void> {
  const searchInput = page.locator('input[placeholder="По названию..."]');
  await searchInput.waitFor({ timeout: 10000 });
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("localhost:3001/api") && response.status() === 200),
    searchInput.fill(query)
  ]);
}

/**
 * Очистить поиск
 */
export async function clearSearch(page: Page): Promise<void> {
  const searchInput = page.locator('input[placeholder="По названию..."]');
  await searchInput.waitFor({ timeout: 10000 });
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("localhost:3001/api") && response.status() === 200),
    searchInput.fill("")
  ]);
}

/**
 * Применить фильтр к списку
 */
export async function applyProductFilter(
  page: Page,
  filter: "category" | "preparationType" | "vegan" | "glutenFree" | "sugarFree",
  value?: string
): Promise<void> {
  if (filter === "vegan") {
    await page.locator('label:has-text("Веган") input[type="checkbox"]').check();
  } else if (filter === "glutenFree") {
    await page.locator('label:has-text("Без глютена") input[type="checkbox"]').check();
  } else if (filter === "sugarFree") {
    await page.locator('label:has-text("Без сахара") input[type="checkbox"]').check();
  } else if (value) {
    const select = page.locator(`select`).nth(filter === "category" ? 0 : 1);
    await select.selectOption(value);
  }
  await page.waitForTimeout(300);
}

/**
 * Получить список названий продуктов или блюд на странице
 */
export async function getListItems(page: Page): Promise<string[]> {
  const items = await page.locator('.trow .strong').all();
  const names: string[] = [];
  for (const item of items) {
    const text = await item.textContent();
    if (text && text.trim()) {
      names.push(text.trim());
    }
  }
  return names;
}