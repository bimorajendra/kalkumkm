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

test('beranda: panduan usaha bisa ditemukan dan dibuka dengan keyboard', async ({
  page,
}) => {
  await page.goto('/');
  const guides = page.getByRole('navigation', {
    name: 'Panduan HPP berdasarkan jenis usaha',
  });
  const guideLinks = [
    ['/usaha/hpp-brownies', 'Cara menghitung HPP brownies per potong'],
    ['/usaha/hpp-katering', 'Cara menghitung HPP katering per porsi'],
    ['/usaha/hpp-frozen-food', 'Cara menghitung HPP frozen food'],
    ['/usaha/hpp-rice-bowl', 'Cara menghitung HPP rice bowl'],
    ['/usaha/hpp-minuman', 'Cara menghitung HPP minuman per gelas'],
    ['/usaha/hpp-hampers', 'Cara menghitung HPP hampers makanan'],
  ] as const;

  for (const [href, name] of guideLinks) {
    await expect(guides.getByRole('link', { name })).toHaveAttribute(
      'href',
      href,
    );
  }

  await page.getByRole('link', { name: 'Semua artikel' }).focus();
  for (const [, name] of guideLinks) {
    await page.keyboard.press('Tab');
    await expect(guides.getByRole('link', { name })).toBeFocused();
  }
  for (let index = 1; index < guideLinks.length; index += 1) {
    await page.keyboard.press('Shift+Tab');
  }
  await expect(
    guides.getByRole('link', { name: guideLinks[0][1] }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/usaha\/hpp-brownies$/);
  await expect(
    page.getByRole('heading', {
      name: 'Cara menghitung HPP brownies per potong',
    }),
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
  expect(sitemapBody).toContain('/kalkulator-hpp');
  expect(sitemapBody).toContain('/usaha/hpp-brownies');
  expect(sitemapBody).not.toContain('/dashboard');
});

test('kalkulator publik menghitung HPP dan titik impas tanpa login', async ({
  page,
}) => {
  await page.goto('/kalkulator-hpp');
  await page.getByLabel('Total biaya bahan satu adonan (Rp)').fill('27800');
  await page.getByLabel('Biaya produksi lain satu adonan (Rp)').fill('3000');
  await page.getByLabel('Jumlah porsi yang dihasilkan').fill('16');
  await page.getByLabel('Biaya kemasan per porsi (Rp)').fill('1000');
  await page.getByRole('button', { name: 'Hitung sekarang' }).click();
  await expect(page.getByText('HPP per porsi: Rp 2.925')).toBeVisible();

  await page.goto('/bep');
  await page.getByLabel('Biaya tetap yang ingin ditutup (Rp)').fill('100000');
  await page.getByLabel('Biaya variabel per unit / HPP (Rp)').fill('3000');
  await page.getByLabel('Harga jual per unit (Rp)').fill('5000');
  await page.getByLabel('Komisi saluran jual (%)').fill('10');
  await page.getByRole('button', { name: 'Hitung sekarang' }).click();
  await expect(page.getByText('Titik impas: 67 unit')).toBeVisible();
});

test('halaman use-case menautkan pengunjung ke kalkulator HPP', async ({
  page,
}) => {
  await page.goto('/usaha/hpp-brownies');
  await expect(
    page.getByRole('heading', {
      name: 'Cara menghitung HPP brownies per potong',
    }),
  ).toBeVisible();
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    /\/usaha\/hpp-brownies$/,
  );
  await page.getByRole('link', { name: 'Buka kalkulator HPP' }).click();
  await expect(page).toHaveURL(/\/kalkulator-hpp$/);
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
  '/kalkulator-hpp',
  '/margin',
  '/bep',
  '/harga-jual',
  '/harga-ojol',
  '/usaha/hpp-brownies',
]) {
  test(`${path} lolos axe`, async ({ page }) => {
    await page.goto(path);
    await expectNoA11yViolations(page);
  });
}
