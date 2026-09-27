import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('builds and downloads a price list image', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto('http://127.0.0.1:5173/resep');
  await page.getByRole('button', { name: 'Pakai contoh brownies' }).click();
  await page.goto('http://127.0.0.1:5173/');
  await page.getByRole('link', { name: 'Buat gambar daftar harga' }).click();
  await expect(page).toHaveURL(/\/bagikan\?recipe=/);

  const image = page.getByRole('img', { name: /Daftar harga/ });
  await expect(image).toHaveAttribute('viewBox', '0 0 1080 1920');
  await expect(image).toContainText('dihitung dengan Takaran');
  await expect(page.getByLabel('Brownies')).toBeChecked();

  await page.getByLabel('Feed · 1080 × 1080').check();
  await expect(image).toHaveAttribute('viewBox', '0 0 1080 1080');

  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    accessibility.violations.filter(
      ({ impact }) => impact === 'critical' || impact === 'serious',
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.getByRole('button', { name: 'Buat gambar daftar harga' }).click();
  const nameDialog = page.getByRole('dialog', { name: 'Nama usaha' });
  await nameDialog.getByLabel('Nama usaha').fill('Usaha Bimo');
  await nameDialog.getByRole('button', { name: 'Simpan nama' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Buat gambar daftar harga' }).click();
  expect((await download).suggestedFilename()).toBe('daftar-harga-square.png');
  await expect(page.getByRole('link', { name: /\?ref=share/ })).toBeVisible();
});
