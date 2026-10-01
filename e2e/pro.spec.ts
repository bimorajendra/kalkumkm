import { expect, test } from '@playwright/test';
import { expectNoA11yViolations, login, seedBrownies } from './helpers';

test('paket gratis: resep keempat memunculkan batas dan tautan Pro', async ({
  page,
}) => {
  await login(page);
  await seedBrownies(page);
  await page.getByRole('button', { name: 'Duplikat' }).click();
  await expect(page.getByLabel('Nama resep')).toHaveValue('Brownies (salinan)');
  await page.getByRole('button', { name: 'Duplikat' }).click();
  await expect(page.getByLabel('Nama resep')).toHaveValue(
    'Brownies (salinan) (salinan)',
  );
  await page.getByRole('button', { name: 'Duplikat' }).click();
  const paywall = page.getByRole('dialog', { name: 'Fitur Takaran Pro' });
  await expect(paywall).toBeVisible();
  await expect(
    paywall.getByText(/Paket gratis dibatasi 3 resep/),
  ).toBeVisible();
});

test('penawaran adalah fitur Pro', async ({ page }) => {
  await login(page);
  await page.goto('/penawaran');
  await expect(
    page.getByRole('dialog', { name: 'Fitur Takaran Pro' }),
  ).toBeVisible();

  const pro = await login(page, { pro: true });
  expect(pro).toContain('@');
  await page.goto('/penawaran');
  await expect(
    page.getByRole('heading', { name: 'Buat penawaran pesanan' }),
  ).toBeVisible();
});

test('halaman Pro segera hadir tanpa formulir pembayaran', async ({
  page,
}, testInfo) => {
  await login(page);
  await page.goto('/beli');
  await expect(
    page.getByRole('heading', { name: 'Takaran Pro segera hadir' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Bayar dengan Mayar' }),
  ).toHaveCount(0);
  await expect(page.getByLabel('Nomor WhatsApp')).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expectNoA11yViolations(page);
  await page.screenshot({
    path: testInfo.outputPath('pro-coming-soon.png'),
    fullPage: true,
  });
  const back = page.getByRole('link', { name: 'Kembali ke resep' });
  await back.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(back).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/dashboard\/resep$/);
});

test('akun Pro melihat statusnya di halaman beli', async ({ page }) => {
  await login(page, { pro: true });
  await page.goto('/beli');
  await expect(
    page.getByRole('heading', { name: 'Takaran Pro aktif' }),
  ).toBeVisible();
});

test('hapus akun menghapus semua data lalu kembali ke landing', async ({
  page,
}) => {
  await login(page);
  await page.goto('/lainnya');
  await page.getByRole('button', { name: 'Hapus akun dan semua data' }).click();
  const dialog = page.getByRole('dialog', { name: 'Hapus akun?' });
  await dialog.getByLabel('Ketik hapus akun saya').fill('salah');
  await dialog.getByRole('button', { name: 'Hapus semua' }).click();
  await expect(
    dialog.getByText('Ketik “hapus akun saya” untuk melanjutkan.'),
  ).toBeVisible();
  await dialog.getByLabel('Ketik hapus akun saya').fill('hapus akun saya');
  await dialog.getByRole('button', { name: 'Hapus semua' }).click();
  await expect(page).toHaveURL(/\/\?akun=dihapus/);
  await expect(
    page.getByText('Akunmu dan semua datanya sudah dihapus.'),
  ).toBeVisible();
  await page.goto('/hitung');
  await expect(page).toHaveURL(/\/masuk$/);
});
