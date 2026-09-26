process.env.PUBLIC_API_BASE_URL ??= 'http://127.0.0.1:8787';
process.env.PUBLIC_TURNSTILE_SITEKEY ??= '1x00000000000000000000AA';

import { defineConfig } from '@playwright/test';

const widths = [320, 390, 768, 1280];
const themes = ['light', 'dark'] as const;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    headless: true,
  },
  projects: widths.flatMap((width) =>
    themes.map((colorScheme) => ({
      name: `${width}-${colorScheme}`,
      use: {
        viewport: { width, height: 900 },
        hasTouch: true,
        colorScheme,
      },
    })),
  ),
  webServer: [
    {
      command: 'pnpm --filter @takaran/app dev',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @takaran/web dev',
      url: 'http://127.0.0.1:4321',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
