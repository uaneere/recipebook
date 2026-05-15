import { Page } from "@playwright/test";

export type ProductFormData = {
  name: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  category?: string;
  preparationType?: string;
};

export class ProductsPage {
  constructor(private page: Page) {}

  async gotoList() {
    await this.page.goto("/products");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoCreate() {
    await this.page.goto("/products/new");
    await this.page.waitForLoadState("networkidle");
  }

  async fillForm(data: ProductFormData) {
    await this.page.waitForSelector("input", { timeout: 10000 });

    const nameInput = this.page.locator('label:has-text("Название") input').first();
    await nameInput.fill(data.name);

    const caloriesInput = this.page.locator('label:has-text("Калории") input');
    const proteinsInput = this.page.locator('label:has-text("Белки") input');
    const fatsInput = this.page.locator('label:has-text("Жиры") input');
    const carbsInput = this.page.locator('label:has-text("Углеводы") input');

    await caloriesInput.fill(String(data.calories));
    await proteinsInput.fill(String(data.proteins));
    await fatsInput.fill(String(data.fats));
    await carbsInput.fill(String(data.carbs));

    const categorySelect = this.page.locator('label:has-text("Категория") select').first();
    if (data.category) {
      await categorySelect.selectOption(data.category);
    } else {
      await categorySelect.selectOption({ index: 1 });
    }

    const preparationSelect = this.page.locator('label:has-text("Тип") select').first();
    if (data.preparationType) {
      await preparationSelect.selectOption(data.preparationType);
    } else {
      await preparationSelect.selectOption("ReadyToEat");
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
    await Promise.race([
      this.page.waitForSelector('.trow', { timeout: 7000 }),
      this.page.waitForSelector('text=Продукты не найдены.', { timeout: 7000 })
    ]);
  }

  async clearSearch() {
    const searchInput = this.page.locator('input[placeholder="По названию..."]');
    await searchInput.waitFor({ timeout: 10000 });
    await Promise.all([
      this.page.waitForResponse((response) => response.url().includes("localhost:3001/api") && response.status() === 200),
      searchInput.fill("")
    ]);
    await Promise.race([
      this.page.waitForSelector('.trow', { timeout: 7000 }),
      this.page.waitForSelector('text=Продукты не найдены.', { timeout: 7000 })
    ]);
  }

  async applyFilter(filter: "category" | "preparationType" | "vegan" | "glutenFree" | "sugarFree", value?: string) {
    if (filter === "vegan") {
      await this.page.locator('label:has-text("Веган") input[type="checkbox"]').check();
    } else if (filter === "glutenFree") {
      await this.page.locator('label:has-text("Без глютена") input[type="checkbox"]').check();
    } else if (filter === "sugarFree") {
      await this.page.locator('label:has-text("Без сахара") input[type="checkbox"]').check();
    } else if (value) {
      const label = filter === "category" ? "Категория" : "Тип";
      const select = this.page.locator(`label:has-text("${label}") select`);
      await select.selectOption(value);
    }
    await this.page.waitForTimeout(300);
  }

  async clickProduct(name: string) {
    await this.page.click(`text=${name}`);
    await this.page.waitForURL(`**/products/*`);
  }
}