/**
 * Тестовые данные для E2E тестов продуктов и блюд
 * Используются для проверки различных сценариев создания продуктов и блюд через UI и API
 * Включают валидные данные, граничные значения (BVA) и невалидные данные для проверки валидации
 */

// Валидные продукты - Эквивалентные классы: валидные данные
export const VALID_PRODUCTS = [
  {
    name: "Помидор",
    calories: 18,
    proteins: 0.9,
    fats: 0.2,
    carbs: 3.9,
    preparationType: "ReadyToEat"
  },
  {
    name: "Курица",
    calories: 165,
    proteins: 31,
    fats: 3.6,
    carbs: 0,
    preparationType: "ReadyToEat"
  }
];

// BVA: граничные значения для продуктов
export const BVA_PRODUCTS = {
  // Калории: 0-1000
  minCalories: {
    name: "Вода с воздухом",
    calories: 0,
    proteins: 0,
    fats: 0,
    carbs: 0,
    preparationType: "ReadyToEat"
  },
  maxCalories: {
    name: "Масло сливочное",
    calories: 717,
    proteins: 0.9,
    fats: 81.1,
    carbs: 0.1,
    preparationType: "ReadyToEat"
  },

  // Сумма БЖУ = 100
  maxMacrosSum: {
    name: "Идеальное блюдо",
    calories: 100,
    proteins: 50,
    fats: 30,
    carbs: 20,
    preparationType: "ReadyToEat"
  }
};

// Длина названия - BVA
export const NAME_LENGTH_TESTS = [
  {
    name: "Аа",
    calories: 100,
    proteins: 10,
    fats: 5,
    carbs: 15,
    preparationType: "ReadyToEat"
  },
  {
    name: "Супер длинное название продукта для проверки граничного значения максимальной длины названия",
    calories: 100,
    proteins: 10,
    fats: 5,
    carbs: 15,
    preparationType: "ReadyToEat"
  }
];

// Невалидные продукты - Эквивалентные классы: невалидные данные
export const INVALID_PRODUCTS = [
  {
    name: "",
    calories: 100,
    proteins: 10,
    fats: 5,
    carbs: 15,
    preparationType: "ReadyToEat",
    expectedError: "Название не может быть пустым"
  },
  {
    name: "А",
    calories: 100,
    proteins: 10,
    fats: 5,
    carbs: 15,
    preparationType: "ReadyToEat",
    expectedError: "Минимальная длина"
  },
  {
    name: "Тестовый продукт",
    calories: 100,
    proteins: 40,
    fats: 40,
    carbs: 30,
    preparationType: "ReadyToEat",
    expectedError: "сумма БЖУ не может быть больше 100"
  }
];

/**
 * Тестовые данные для блюд с граничными значениями и эквивалентным разбиением
 */

// Валидные блюда - Эквивалентные классы: валидные данные
export const VALID_DISHES = [
  {
    name: "Овощной салат",
    category: "Second",
    portionSize: 200,
    ingredients: [
      { productId: "seed_beet", grams: 50 },
      { productId: "seed_potato", grams: 100 }
    ]
  },
  {
    name: "!первое Борщ",
    category: "First",
    portionSize: 300,
    ingredients: [
      { productId: "seed_beet", grams: 150 },
      { productId: "seed_meat", grams: 100 }
    ]
  }
];

// BVA: граничные значения для блюд
export const BVA_DISHES = {
  minPortionSize: {
    name: "Микро порция",
    category: "Second",
    portionSize: 1,
    ingredients: [
      { productId: "seed_water", grams: 1 }
    ]
  },
  maxPortionSize: {
    name: "Огромная порция",
    category: "Second",
    portionSize: 9999,
    ingredients: [
      { productId: "seed_water", grams: 9999 }
    ]
  },
  minIngredients: {
    name: "ВодИчка",
    category: "Second",
    portionSize: 100,
    ingredients: [
      { productId: "seed_water", grams: 100 }
    ]
  }
};

// Невалидные блюда - Эквивалентные классы: невалидные данные
export const INVALID_DISHES = [
  {
    name: "",
    category: "Second",
    portionSize: 200,
    ingredients: [{ productId: "seed_water", grams: 100 }],
    expectedError: "Название"
  },
  {
    name: "!веган !без-глютена",
    category: "Second",
    portionSize: 200,
    ingredients: [{ productId: "seed_water", grams: 100 }],
    expectedError: "название должно содержать"
  },
  {
    name: "Пустое блюдо",
    category: "Second",
    portionSize: 200,
    ingredients: [],
    expectedError: "минимум 1 ингредиент"
  },
  {
    name: "Нулевая порция",
    category: "Second",
    portionSize: 0,
    ingredients: [{ productId: "seed_water", grams: 100 }],
    expectedError: "Размер порции"
  }
];