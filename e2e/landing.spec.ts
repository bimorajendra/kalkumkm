import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from './helpers';

test('beranda: demo memakai mesin hitung, tanpa scroll horizontal', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Jualan laris/ }),
  ).toBeVisible();
  await expect(page.getByText('Rp 2.925')).toBeVisible();
  await expect(page.getByText('Rp 5.000', { exact: true })).toBeVisible();
  const slider = page.getByLabel('Target untung');
  await slider.fill('70');
  await slider.dispatchEvent('change');
  await expect(
    page.getByText('Rp 10.000', { exact: true }).first(),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('beranda: tautan ke cara hitung dan masuk', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Coba gratis' }).first().click();
  await expect(page).toHaveURL(/\/masuk$/);
  await expect(
    page.getByRole('button', { name: 'Lanjut dengan Google' }),
  ).toBeVisible();
});

test('artikel: canonical, robots, dan sitemap memuat halaman publik', async ({
  page,
}) => {
  await page.goto('/artikel/cara-menghitung-hpp-makanan');
  await expect(
    page.getByRole('heading', {
      name: 'Cara menghitung HPP makanan per porsi',
    }),
  ).toBeVisible();
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    /\/artikel\/cara-menghitung-hpp-makanan$/,
  );

  const [robots, sitemap] = await Promise.all([
    page.request.get('/robots.txt'),
    page.request.get('/sitemap.xml'),
  ]);
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain(
    'Sitemap: http://localhost:3100/sitemap.xml',
  );
  expect(sitemap.ok()).toBe(true);
  const sitemapBody = await sitemap.text();
  expect(sitemapBody).toContain('/artikel/cara-menghitung-hpp-makanan');
  expect(sitemapBody).not.toContain('/dashboard');
});

test('cara hitung: rincian HPP memuat angka contoh PRD', async ({ page }) => {
  await page.goto('/cara-hitung');
  await expect(
    page.getByRole('heading', { name: /Dari struk belanja/ }),
  ).toBeVisible();
  await expect(page.getByText('Rp 2.925')).toBeVisible();
  await expect(page.getByText('Rp 5.000').last()).toBeVisible();
  await expect(page.getByText('41,5%').last()).toBeVisible();
  await expect(page.getByText('Rp 22.133')).toBeVisible();
});

test('fitur: contoh harga bahan naik dan builder pesanan custom', async ({
  page,
}) => {
  await page.goto('/fitur');
  await expect(page.getByText('41,5%').first()).toBeVisible();
  await expect(page.getByText('38,5%').first()).toBeVisible();
  await expect(page.getByText('−Rp 96.000')).toBeVisible();

  await expect(page.getByText('Rp 180.000').first()).toBeVisible();
  await page.getByLabel('Kotak mika premium').check();
  await expect(page.getByText('Rp 195.000').first()).toBeVisible();
});

test('harga: dua paket dan FAQ', async ({ page }) => {
  await page.goto('/harga');
  await expect(
    page.getByRole('heading', { name: 'Gratis', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
  await expect(page.getByText('Rp 49.000')).toBeVisible();
  await expect(page.getByText('Rp 79.000')).toBeVisible();

  const closedItem = page.getByText('Siapa yang bisa melihat resepku?');
  await expect(closedItem).toBeVisible();
  await closedItem.click();
  await expect(
    page.getByText('Hanya akunmu. Semua data bisa kamu unduh'),
  ).toBeVisible();
});

test('nav aktif benar di tiap halaman (desktop)', async ({ page }) => {
  test.skip(
    (page.viewportSize()?.width ?? 0) < 1024,
    'Nav desktop tersembunyi di lebar ini; menu HP diuji lewat cara lain.',
  );
  await page.goto('/fitur');
  await expect(
    page.locator('header').getByRole('link', { name: 'Fitur' }),
  ).toHaveAttribute('aria-current', 'page');
});

for (const path of [
  '/',
  '/cara-hitung',
  '/fitur',
  '/harga',
  '/masuk',
  '/artikel',
  '/artikel/cara-menghitung-hpp-makanan',
]) {
  test(`${path} lolos axe`, async ({ page }) => {
    await page.goto(path);
    await expectNoA11yViolations(page);
  });
}
