import { Page } from "@playwright/test";

export type DishFormData = {
  name: string;
  category?: string;
  portionSize?: number;
  ingredients?: Array<{ productId: string; grams: number }>;
};

export class DishesPage {
  constructor(private page: Page) {}

  async gotoList() {
    await this.page.goto("/dishes");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoCreate() {
    await this.page.goto("/dishes/new");
    await this.page.waitForLoadState("networkidle");
  }

  async fillForm(data: DishFormData) {
    await this.page.waitForSelector("input", { timeout: 10000 });

    const nameInput = this.page.locator('label:has-text("Название") input').first();
    await nameInput.fill(data.name);

    const categorySelect = this.page.locator('label:has-text("Категория") select').first();
    if (data.category) {
      await categorySelect.selectOption(data.category);
    } else {
      await categorySelect.selectOption({ index: 1 });
    }

    if (data.portionSize !== undefined) {
      const portionInput = this.page.locator('label:has-text("Размер порции") input[type="number"]');
      await portionInput.fill(String(data.portionSize));
    }

    if (data.ingredients && data.ingredients.length > 0) {
      const addIngredientButton = this.page.locator('button:has-text("Добавить ингредиент")');
      for (let i = 1; i < data.ingredients.length; i++) {
        await addIngredientButton.click();
      }

      const selects = this.page.locator('select');
      const numberInputs = this.page.locator('input[type="number"]');

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

  async submit() {
    const button = this.page.locator('button[type="submit"]');
    await button.first().click();
    await this.page.waitForLoadState("networkidle");
  }

  async exists(name: string) {
    try {
      await this.page.waitForSelector(`.trow:has-text("${name}")`, { timeout: 7000 });
      return true;
    } catch {
      return false;
    }
  }

  async search(query: string) {
    const searchInput = this.page.locator('input[placeholder="По названию..."]');
    await searchInput.waitFor({ timeout: 10000 });
    await Promise.all([
      this.page.waitForResponse((response) => response.url().includes("localhost:3001/api") && response.status() === 200),
      searchInput.fill(query)
    ]);
  }

  async clearSearch() {
    const searchInput = this.page.locator('input[placeholder="По названию..."]');
    await searchInput.waitFor({ timeout: 10000 });
    await Promise.all([
      this.page.waitForResponse((response) => response.url().includes("localhost:3001/api") && response.status() === 200),
      searchInput.fill("")
    ]);
  }

  async clickDish(name: string) {
    await this.page.click(`text=${name}`);
    await this.page.waitForURL(`**/dishes/*`);
  }

  async clickEditFromDetail() {
    const editLink = this.page.getByRole("link", { name: /Редактировать/i }).first();
    await editLink.click();
    await this.page.waitForURL(`**/dishes/*/edit`);
  }
}