import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'examples/**',
      '*.config.*',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // NestJS framework uses `any` extensively in DI, decorators, and transport APIs
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // Template literals with error messages and dynamic values are idiomatic
      '@typescript-eslint/restrict-template-expressions': 'off',
      // Non-null assertions after connection guards (this.client!) are safe patterns
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Async handler callbacks passed to kubemq-js subscriptions
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      // Interface implementations may not use await in every method
      '@typescript-eslint/require-await': 'off',
      // Defensive null checks are acceptable even when types say non-null
      '@typescript-eslint/no-unnecessary-condition': 'off',
      // NestJS modules/decorators are class-based by design
      '@typescript-eslint/no-extraneous-class': 'off',
      // Unused vars with _ prefix are common in NestJS DI
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.spec.ts', '__tests__/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
