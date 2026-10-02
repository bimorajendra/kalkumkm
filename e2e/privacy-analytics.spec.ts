import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('event berbagi hanya untuk aksi sukses dan klik masuk tidak membawa hasil', async ({
  page,
}) => {
  test.skip(!process.env.NEXT_PUBLIC_GA_ID);
  await page.route('https://www.googletagmanager.com/gtag/js**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
  await page.addInitScript(() => {
    let copies = 0;
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          if (copies++) throw new DOMException('Ditolak', 'NotAllowedError');
        },
      },
    });
    Object.defineProperty(navigator, 'share', {
      value: async () => {
        throw new DOMException('Dibatalkan', 'AbortError');
      },
    });
  });
  await page.goto('/usaha/hpp-brownies?input=private');
  await page.getByRole('button', { name: 'Izinkan analitik' }).click();
  await expect(page.locator('#google-analytics-script')).toHaveCount(1);
  await page.getByRole('button', { name: 'Isi angka contoh' }).click();
  await page.getByRole('button', { name: 'Hitung sekarang' }).click();
  await page.getByRole('button', { name: 'Bagikan hasil hitung' }).click();
  await page.getByRole('button', { name: 'Salin hasil hitung' }).click();
  await page.getByRole('button', { name: 'Salin hasil hitung' }).click();
  await page
    .getByRole('link', { name: 'Masuk untuk menyimpan resepmu' })
    .click();
  await expect(page).toHaveURL(/\/masuk$/);
  const events = await page.evaluate(() =>
    window.dataLayer
      ?.map((entry) => Array.from(entry as ArrayLike<unknown>))
      .filter(
        (entry) =>
          entry[0] === 'event' && String(entry[1]).startsWith('calculator_'),
      ),
  );
  expect(events?.map((entry) => entry[1])).toEqual([
    'calculator_complete',
    'calculator_share',
    'calculator_signup_click',
  ]);
  for (const event of events ?? [])
    expect(event[2]).toEqual({
      calculator: 'hpp',
      page_location: 'http://localhost:3100/usaha/hpp-brownies',
      page_referrer: '',
      send_to: process.env.NEXT_PUBLIC_GA_ID,
    });
  expect(JSON.stringify(events)).not.toMatch(/2925|27800|private/);
});

test('consent pageview lama diminta ulang, penolakan lama dihormati', async ({
  page,
}) => {
  test.skip(!process.env.NEXT_PUBLIC_GA_ID);
  await page.addInitScript(() => {
    if (!localStorage.getItem('takaran-analytics-consent-v1'))
      localStorage.setItem('takaran-analytics-consent-v1', 'granted');
  });
  await page.goto('/margin');
  await expect(
    page.getByRole('button', { name: 'Izinkan analitik' }),
  ).toBeVisible();
  await expect(page.locator('#google-analytics-script')).toHaveCount(0);
  await page.evaluate(() =>
    localStorage.setItem('takaran-analytics-consent-v1', 'denied'),
  );
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Izinkan analitik' }),
  ).toHaveCount(0);
  await expect(page.locator('#google-analytics-script')).toHaveCount(0);
});

test('event hitung publik memerlukan consent dan tidak membawa angka atau query', async ({
  page,
}) => {
  test.skip(!process.env.NEXT_PUBLIC_GA_ID);
  await page.route('https://www.googletagmanager.com/gtag/js**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
  await page.goto('/margin?recipe=private-recipe#private-input');
  await page.getByRole('button', { name: 'Tolak analitik' }).click();
  await page.getByLabel('HPP per porsi (Rp)').fill('12345');
  await page.getByLabel('Harga jual per porsi (Rp)').fill('30000');
  await page.getByLabel('Komisi saluran jual (%)').fill('0');
  await page.getByRole('button', { name: 'Hitung sekarang' }).click();
  expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();

  await page.goto('/kebijakan-privasi');
  await page.getByRole('button', { name: 'Atur pilihan analitik' }).click();
  await page.getByRole('button', { name: 'Izinkan analitik' }).click();
  await page.goto('/margin?recipe=private-recipe#private-input');
  await expect(page.locator('#google-analytics-script')).toHaveCount(1);
  await page.getByLabel('HPP per porsi (Rp)').fill('12345');
  await page.getByLabel('Harga jual per porsi (Rp)').fill('30000');
  await page.getByLabel('Komisi saluran jual (%)').fill('0');
  await page.getByRole('button', { name: 'Hitung sekarang' }).click();
  const events = await page.evaluate(() =>
    window.dataLayer
      ?.map((entry) => Array.from(entry as ArrayLike<unknown>))
      .filter(
        (entry) => entry[0] === 'event' && entry[1] === 'calculator_complete',
      ),
  );
  expect(events).toHaveLength(1);
  expect(events?.[0]?.[2]).toEqual({
    calculator: 'margin',
    page_location: 'http://localhost:3100/margin',
    page_referrer: '',
    send_to: process.env.NEXT_PUBLIC_GA_ID,
  });
  expect(JSON.stringify(events)).not.toMatch(/12345|30000|private/);
  await page.getByLabel('Komisi saluran jual (%)').fill('100');
  await page.getByRole('button', { name: 'Hitung sekarang' }).click();
  expect(
    await page.evaluate(
      () =>
        window.dataLayer
          ?.map((entry) => Array.from(entry as ArrayLike<unknown>))
          .filter((entry) => entry[1] === 'calculator_complete').length,
    ),
  ).toBe(1);
});

test('kebijakan privasi menjelaskan GA dan tetap terbaca pada layar kecil', async ({
  page,
}) => {
  await page.goto('/kebijakan-privasi');

  await expect(
    page.getByRole('heading', { name: 'Analitik', level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'kebijakan privasi Google' }),
  ).toHaveAttribute('href', 'https://policies.google.com/privacy?hl=id');
  await expect(
    page.getByRole('button', { name: 'Atur pilihan analitik' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Kembali ke Takaran' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'kebijakan privasi Google' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Atur pilihan analitik' }),
  ).toBeFocused();
});

test('GA hanya mengirim pageview publik tanpa query dan tidak melacak login', async ({
  page,
}) => {
  test.skip(!process.env.NEXT_PUBLIC_GA_ID);

  await page.route('https://www.googletagmanager.com/gtag/js**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
  await page.addInitScript(() => {
    const analyticsWindow = window as typeof window & {
      dataLayer: unknown[][];
      gtag: (...args: unknown[]) => void;
    };
    analyticsWindow.dataLayer = [];
    analyticsWindow.gtag = (...args) => analyticsWindow.dataLayer.push(args);
  });

  const response = await page.goto(
    '/?email=private%40example.com&recipe=private-name',
  );
  await expect(
    page.getByRole('button', { name: 'Izinkan analitik' }),
  ).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.getByRole('button', { name: 'Izinkan analitik' }).click();
  const tag = page.locator('#google-analytics-script');
  const cspNonce = response
    ?.headers()
    ['content-security-policy']?.match(/'nonce-([^']+)'/)?.[1];
  expect(cspNonce).toBeTruthy();
  await expect
    .poll(() => tag.evaluate((element) => (element as HTMLScriptElement).nonce))
    .toBe(cspNonce);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.dataLayer?.filter(
            (entry) =>
              Array.isArray(entry) &&
              entry[0] === 'event' &&
              entry[1] === 'page_view',
          ).length ?? 0,
      ),
    )
    .toBe(1);

  const pageViews = await page.evaluate(() =>
    window.dataLayer?.filter(
      (entry) =>
        Array.isArray(entry) &&
        entry[0] === 'event' &&
        entry[1] === 'page_view',
    ),
  );
  expect(pageViews?.[0]?.[2]).toMatchObject({
    page_path: '/',
    page_location: new URL('/', 'http://localhost:3100').href,
  });
  expect(JSON.stringify(pageViews)).not.toContain('private');

  await page
    .getByRole('banner')
    .getByRole('link', { name: 'Coba gratis' })
    .click();
  await expect(page).toHaveURL(/\/masuk$/);
  await expect(
    page.getByRole('heading', { name: 'Masuk atau buat akun' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Izinkan analitik' }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.dataLayer?.filter(
            (entry) =>
              Array.isArray(entry) &&
              entry[0] === 'event' &&
              entry[1] === 'page_view',
          ).length ?? 0,
      ),
    )
    .toBe(1);
});

test('pilihan tolak tidak memuat tag dan bisa dibuka lagi dari privasi', async ({
  page,
}) => {
  test.skip(!process.env.NEXT_PUBLIC_GA_ID);

  await page.goto('/');
  const rejectButton = page.getByRole('button', { name: 'Tolak analitik' });
  await expect(rejectButton).toBeVisible();
  await rejectButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#google-analytics-script')).toHaveCount(0);

  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Tolak analitik' }),
  ).toHaveCount(0);
  await page.goto('/kebijakan-privasi');
  await page.getByRole('button', { name: 'Atur pilihan analitik' }).click();
  await expect(
    page.getByRole('button', { name: 'Izinkan analitik' }),
  ).toBeVisible();
  await expect(page.locator('#google-analytics-script')).toHaveCount(0);
});
