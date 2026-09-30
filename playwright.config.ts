import { defineConfig } from '@playwright/test';

const port = 3100;
const widths = [320, 1280];
const themes = ['light', 'dark'] as const;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${port}`,
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
  webServer: {
    command: `pnpm --filter @takaran/site exec next dev -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Bawaan: Postgres di dalam proses yang dibuat baru tiap server uji menyala.
      // Isi E2E_DATABASE_URL untuk menguji terhadap Postgres sungguhan.
      DATABASE_URL:
        process.env.E2E_DATABASE_URL ?? `pglite:./.data/e2e-${Date.now()}`,
      APP_URL: `http://localhost:${port}`,
      BETTER_AUTH_SECRET: 'e2e-only-secret-e2e-only-secret-e2e',
      IP_SALT: 'e2e-only-salt-e2e-only',
      GOOGLE_CLIENT_ID: 'e2e',
      GOOGLE_CLIENT_SECRET: 'e2e',
      ADMIN_EMAILS: 'admin@contoh.id',
      E2E_TEST_AUTH: '1',
    },
  },
});
