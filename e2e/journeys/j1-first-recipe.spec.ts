import { expect, test } from '@playwright/test';

test('J-1: hitung HPP brownies tetap berjalan offline', async ({
  page,
  context,
}) => {
  await page.goto('http://127.0.0.1:5173/resep');
  await page.getByRole('button', { name: 'Pakai contoh brownies' }).click();
  await expect(page.getByText('HPP Rp 2.925 per porsi')).toBeVisible();
  await context.setOffline(true);
  await page.goto('http://127.0.0.1:5173/hitung');
  await expect(page.getByText('HPP Rp 2.925')).toBeVisible();
});
