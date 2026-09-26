import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('empty routes work offline and have no serious accessibility violations', async ({
  page,
  context,
}) => {
  await page.goto('http://127.0.0.1:5173/');
  await expect(
    page.getByRole('heading', { name: 'Mulai dari satu resep.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Lihat resep' }).click();
  await expect(page).toHaveURL(/\/resep$/);
  await page.goto('http://127.0.0.1:5173/');
  await page.getByRole('link', { name: 'Tambah bahan' }).click();
  await expect(page).toHaveURL(/\/bahan$/);

  for (const [path, heading] of [
    ['/bahan', 'Bahan'],
    ['/resep', 'Belum ada resep.'],
    ['/lainnya', 'Pengaturan'],
    ['/', 'Mulai dari satu resep.'],
  ]) {
    await page.goto(`http://127.0.0.1:5173${path}`);
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      accessibility.violations.filter(
        ({ impact }) => impact === 'critical' || impact === 'serious',
      ),
    ).toEqual([]);
  }

  await page.goto('http://127.0.0.1:5173/lainnya');
  const themeToggle = page.getByRole('button', { name: 'Ganti tema' }).last();
  await themeToggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.goto('http://127.0.0.1:5173/');
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Mulai dari satu resep.' }),
  ).toBeVisible();
  const mobile = await page.evaluate(() => window.innerWidth < 640);
  const nav = mobile
    ? page.getByRole('navigation', { name: 'Navigasi bawah' })
    : page.getByRole('navigation', { name: 'Navigasi utama' });
  await nav.getByRole('link', { name: 'Bahan' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/bahan$/);
  await nav.getByRole('link', { name: 'Resep' }).click();
  await expect(page).toHaveURL(/\/resep$/);
  if (mobile) {
    await nav.getByRole('link', { name: 'Lainnya' }).click();
    await expect(page).toHaveURL(/\/lainnya$/);
  }
});

test('update notice waits for the user action', async ({ page }) => {
  let navigations = 0;
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations += 1;
  });
  await page.addInitScript(() => {
    const worker = {
      postMessage: (message: unknown) => {
        Object.defineProperty(window, '__updateMessage', {
          value: message,
          configurable: true,
        });
      },
    };
    const registration = Object.assign(new EventTarget(), {
      waiting: worker,
      installing: null,
      update: async () => undefined,
    });
    const serviceWorker = Object.assign(new EventTarget(), {
      controller: {},
      register: async () => registration,
      getRegistration: async () => registration,
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: serviceWorker,
    });
  });
  await page.goto('http://127.0.0.1:5173/');
  await expect(
    page.getByText('Versi baru tersedia. Muat ulang.'),
  ).toBeVisible();
  const loadedBeforeWait = navigations;
  await page.waitForTimeout(100);
  expect(navigations).toBe(loadedBeforeWait);
  await page.getByRole('button', { name: 'Muat ulang' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __updateMessage?: { type: string } })
            .__updateMessage?.type,
      ),
    )
    .toBe('SKIP_WAITING');
});

test('install control appears only after browser install support is available', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5173/lainnya');
  await expect(page.getByRole('button', { name: 'Instal' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Pengaturan' })).toBeVisible();
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    Object.defineProperty(window, '__installCalls', {
      value: 0,
      writable: true,
    });
    const event = Object.assign(
      new Event('beforeinstallprompt', { cancelable: true }),
      {
        prompt: async () => {
          (window as Window & { __installCalls: number }).__installCalls += 1;
        },
        userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
      },
    );
    window.dispatchEvent(event);
  });
  await expect(page.getByRole('button', { name: 'Instal' })).toBeVisible();
  await page.getByRole('button', { name: 'Instal' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __installCalls: number }).__installCalls,
      ),
    )
    .toBe(1);
});

test('shows install instructions for Safari on iOS', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
  });
  await page.goto('http://127.0.0.1:5173/lainnya');
  await expect(
    page.getByText('Di Safari, tekan Bagikan lalu Tambahkan ke Layar Utama.'),
  ).toBeVisible();
});

test('shows a clear message when IndexedDB is unavailable', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: undefined,
    }),
  );
  await page.goto('http://127.0.0.1:5173/');
  await expect(
    page.getByRole('heading', {
      name: 'Penyimpanan tidak tersedia di browser ini',
    }),
  ).toBeVisible();
});
