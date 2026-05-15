import { FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log("\nE2E тестирование, подготовка\n");

  const API_BASE_URL = "http://localhost:3001/api";
  const MAX_RETRIES = 3;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`Проверяем подключение к API (попытка ${retries + 1}/${MAX_RETRIES})...`);
      const response = await fetch(`${API_BASE_URL}/products`);
      
      if (response.ok) {
        console.log("API доступен\n");
        break;
      }
    } catch (error) {
      retries++;
      if (retries < MAX_RETRIES) {
        console.log(`Ожидание запуска API...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  if (retries === MAX_RETRIES) {
    console.error("Ошибка подключения к API");
    process.exit(1);
  }

  console.log("Подготовка завершена\n");
}

export default globalSetup;