import { test as base, expect } from "@playwright/test";

interface TestFixtures {
  api: {
    post: (url: string, options?: any) => Promise<any>;
    put: (url: string, options?: any) => Promise<any>;
    patch: (url: string, options?: any) => Promise<any>;
    delete: (url: string, options?: any) => Promise<any>;
    get: (url: string, options?: any) => Promise<any>;
  };
}

const API_BASE_URL = "http://localhost:3001/api";

export const test = base.extend<TestFixtures>({
  api: async ({ request }, use) => {
    const createdProductIds: string[] = [];
    const createdDishIds: string[] = [];

    (request as any)._createdProductIds = createdProductIds;
    (request as any)._createdDishIds = createdDishIds;

    const api = {
      post: async (url: string, options?: any) => request.post(url, options),
      put: async (url: string, options?: any) => request.put(url, options),
      patch: async (url: string, options?: any) => request.patch(url, options),
      delete: async (url: string, options?: any) => request.delete(url, options),
      get: async (url: string, options?: any) => request.get(url, options),
    };

    await use(api);

    for (const dishId of createdDishIds) {
      await request.delete(`${API_BASE_URL}/dishes/${dishId}`).catch(() => {});
    }
    for (const productId of createdProductIds) {
      await request.delete(`${API_BASE_URL}/products/${productId}`).catch(() => {});
    }
  },
});

export { expect };