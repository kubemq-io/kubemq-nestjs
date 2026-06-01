import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['__tests__/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/testing.ts',
        'src/cqrs.ts',
        'src/**/index.ts',
        'src/interfaces/**',
        'src/cqrs/interfaces.ts',
        'src/serialization/interfaces.ts',
        'src/interfaces/kubemq-feature-options.interface.ts',
        'src/testing/test-helpers.ts',
      ],
    },
    testTimeout: 30000,
  },
});
