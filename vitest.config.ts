import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/**/*.test.ts',
      'apps/api/test/**/*.test.ts',
      'apps/app/src/**/*.test.ts',
    ],
    environment: 'node',
    coverage: {
      include: ['packages/calc/src/**/*.ts'],
      thresholds: { lines: 95 },
    },
  },
});
