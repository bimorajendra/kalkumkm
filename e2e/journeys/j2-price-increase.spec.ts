import { expect, test } from '@playwright/test';

test('J-2: perubahan harga bahan tersimpan dan terbaca offline', async ({
  page,
  context,
}) => {
  await page.goto('http://127.0.0.1:5173/resep');
  await page.getByRole('button', { name: 'Pakai contoh brownies' }).click();
  await expect(page.getByText('HPP Rp 2.925 per porsi')).toBeVisible();
  await page.goto('http://127.0.0.1:5173/bahan');
  await page.getByRole('button', { name: 'Ubah harga' }).nth(2).click();
  const eggPrice = page.getByRole('textbox', {
    name: 'Telur, Harga beli (rupiah)',
  });
  await eggPrice.fill('2600');
  await eggPrice.press('Enter');
  await expect(page.getByText('Rp 2.600')).toBeVisible();
  await context.setOffline(true);
  await page.goto('http://127.0.0.1:5173/resep');
  await expect(page.getByText('HPP Rp 3.075 per porsi')).toBeVisible();
});
