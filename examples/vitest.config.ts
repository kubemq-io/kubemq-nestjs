import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['testing/**/*.spec.ts'],
    testTimeout: 15000,
  },
});
