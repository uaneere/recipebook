import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts', 'test/**/*.integration.test.ts'],
    testTimeout: 30000,
    environment: 'node',
    setupFiles: ['./test/setup.integration.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/modules/dishes/dishRules.ts', 'src/modules/dishes/dishesService.ts', 'src/modules/products/productsService.ts'],
      exclude: ['**/*.test.ts', '**/*.integration.test.ts'],
    },
    globals: true
  },
});