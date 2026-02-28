import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/e2e/**/*.test.ts'],
    globalSetup: ['src/__tests__/e2e/globalSetup.e2e.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
