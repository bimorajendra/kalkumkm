import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'apps/site/src') },
  },
  test: {
    include: ['packages/**/*.test.ts', 'apps/site/src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      include: ['packages/calc/src/**/*.ts'],
      thresholds: { lines: 95 },
    },
  },
});
