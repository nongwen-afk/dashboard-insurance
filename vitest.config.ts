import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('.', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
    globals: true,
    exclude: ['e2e/**', 'tests/**', 'node_modules/**', '.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
