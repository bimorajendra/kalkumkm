import { expect, test } from '@playwright/test';

test('data resep dan harga tidak ikut permintaan jaringan', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    requests.push(`${request.url()} ${request.postData() ?? ''}`.toLowerCase());
  });

  await page.goto('http://127.0.0.1:5173/resep');
  await page.getByRole('button', { name: 'Pakai contoh brownies' }).click();
  await expect(page.getByText('HPP Rp 2.925 per porsi')).toBeVisible();
  await page.goto('http://127.0.0.1:5173/bahan');
  await page.getByRole('button', { name: 'Ubah harga' }).nth(2).click();
  await page
    .getByRole('textbox', { name: 'Telur, Harga beli (rupiah)' })
    .fill('2600');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Rp 2.600')).toBeVisible();

  for (const request of requests) {
    expect(request).not.toMatch(/brownies|tepung terigu|telur|cokelat masak/);
    expect(request).not.toMatch(/\b27800\b|\b2925\b|\b2600\b/);
    expect(request).not.toMatch(/\b150\b|\b200\b|\b3000\b|\b1000\b/);
  }
});
