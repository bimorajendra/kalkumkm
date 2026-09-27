import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('paket gratis: resep keempat memunculkan batas dan tautan Pro', async ({
  page,
}) => {
  await login(page);
  for (const name of ['A', 'B', 'C', 'D']) {
    await page.goto('/resep');
    await page
      .getByRole('button', { name: /^(Buat resep|Buat resep sendiri)$/ })
      .first()
      .click();
    const dialog = page.getByRole('dialog', { name: 'Buat resep' });
    await dialog.getByLabel('Nama resep').fill(name);
    await dialog.getByRole('button', { name: 'Simpan resep' }).click();
    if (name === 'D') {
      await expect(
        dialog.getByText('Batas 3 resep di paket gratis sudah tercapai.'),
      ).toBeVisible();
      await expect(
        dialog.getByRole('link', { name: /Takaran Pro/ }),
      ).toBeVisible();
    } else {
      await expect(dialog).not.toBeVisible();
    }
  }
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

test('halaman beli menunjukkan harga pendiri dan memvalidasi isian', async ({
  page,
}) => {
  await login(page);
  await page.goto('/beli');
  await expect(page.getByText('Rp 49.000').first()).toBeVisible();
  await page.getByRole('button', { name: 'Bayar dengan Mayar' }).click();
  await expect(page.getByText('Nama usaha wajib diisi.')).toBeVisible();
  await expect(
    page.getByText('Masukkan nomor WhatsApp Indonesia.'),
  ).toBeVisible();
  await expect(
    page.getByText('Centang persetujuan untuk melanjutkan.'),
  ).toBeVisible();

  // Mayar belum dikonfigurasi di lingkungan uji: pesan jelas, bukan galat mentah.
  await page.getByLabel('Nama usaha').fill('Kue Bu Rina');
  await page
    .getByRole('textbox', { name: 'Nomor WhatsApp' })
    .fill('081234567890');
  await page.getByRole('checkbox').click();
  await page.getByRole('button', { name: 'Bayar dengan Mayar' }).click();
  await expect(
    page.getByText('Pembayaran belum dibuka. Coba lagi nanti.'),
  ).toBeVisible();
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
