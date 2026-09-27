import { expect, test } from '@playwright/test';
import { expectNoA11yViolations, randomIp } from './helpers';

test('landing: demo memakai mesin hitung, tanpa scroll horizontal', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Laris, tapi uangnya nggak kelihatan?' }),
  ).toBeVisible();
  const demo = page.locator('#demo');
  await expect(demo.getByText('Rp 5.000', { exact: true })).toBeVisible();
  await demo.getByLabel('Harga telur per butir').first().fill('2600');
  // HPP naik Rp 150 per potong, saran harga naik ke kelipatan Rp 500 berikutnya.
  await expect(demo.getByText('Rp 5.500', { exact: true })).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('landing: tabel harga telur naik memuat angka contoh PRD', async ({
  page,
}) => {
  await page.goto('/');
  const table = page.getByRole('table');
  await expect(table.getByText('Rp 2.925')).toBeVisible();
  await expect(table.getByText('41,5%')).toBeVisible();
});

test('landing: formulir daftar tunggu memvalidasi dan mengirim', async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': randomIp() });
  await page.goto('/#daftar-tunggu');
  const form = page.locator('form').filter({ hasText: 'Daftar gratis' });
  await form.getByRole('button', { name: 'Daftar gratis' }).click();
  await expect(form.getByText('Nama usaha wajib diisi.')).toBeVisible();

  await form.getByLabel('Nama usaha').fill('Kue Bu Rina');
  await form
    .getByRole('textbox', { name: 'Nomor WhatsApp' })
    .fill('081234567890');
  await form.getByRole('combobox', { name: 'Jenis jualan' }).click();
  await page.getByRole('option', { name: 'Kue', exact: true }).click();
  await form.getByRole('checkbox').click();
  await form.getByRole('button', { name: 'Daftar gratis' }).click();
  await expect(
    page.getByText('Terima kasih. Kami akan mengabari'),
  ).toBeVisible();
});

test('landing: tautan masuk mengarah ke halaman masuk', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Coba hitung resepmu' }).click();
  await expect(page).toHaveURL(/\/masuk$/);
  await expect(
    page.getByRole('button', { name: 'Masuk dengan Google' }),
  ).toBeVisible();
});

test('landing dan halaman masuk lolos axe', async ({ page }) => {
  await page.goto('/');
  await expectNoA11yViolations(page);
  await page.goto('/masuk');
  await expectNoA11yViolations(page);
  await page.goto('/kebijakan-privasi');
  await expectNoA11yViolations(page);
});
