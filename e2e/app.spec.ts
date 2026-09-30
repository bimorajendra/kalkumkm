import { expect, test } from '@playwright/test';
import { expectNoA11yViolations, login, seedBrownies } from './helpers';

test('halaman aplikasi mengarahkan tamu ke halaman masuk', async ({ page }) => {
  for (const path of ['/hitung', '/bahan', '/resep', '/lainnya', '/beli']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/masuk$/);
  }
});

test('J-1: resep contoh menghasilkan angka PRD di kartu hasil', async ({
  page,
}) => {
  await login(page);
  await seedBrownies(page);
  await page.getByRole('link', { name: 'Hitung harga' }).click();

  await expect(
    page.getByRole('heading', { name: 'Hitung harga brownies' }),
  ).toBeVisible();
  const mobile = (page.viewportSize()?.width ?? 1280) < 1024;
  if (mobile) await page.getByRole('button', { name: 'Detail' }).click();
  // Di HP kartu lengkap ada di dalam sheet; di desktop ada di panel kanan.
  const card = (mobile ? page.getByRole('dialog') : page)
    .locator('.takaran-result-card:not(.takaran-result-card--compact)')
    .first();
  await expect(card.getByText('Rp 5.000', { exact: true })).toBeVisible();
  await expect(card.getByText('41,5%', { exact: true })).toBeVisible();
  await expect(page.getByText(/Markup 70,9% di atas HPP/)).toBeVisible();
  await expect(card.getByText('Rp 22.133', { exact: true })).toBeVisible();
  await expect(page.getByText('Rp 2.925').first()).toBeVisible();
});

test('bahan: alarm margin muncul setelah harga bahan naik', async ({
  page,
}) => {
  await login(page);
  await seedBrownies(page);
  await page.goto('/bahan');

  const egg = page.getByRole('listitem').filter({ hasText: 'Telur' });
  await egg.getByRole('button', { name: 'Ubah harga' }).click();
  await egg.getByRole('textbox').fill('2600');
  await egg.getByRole('button', { name: 'Simpan harga' }).click();
  await expect(
    egg.getByRole('button', { name: 'Ubah harga Telur' }),
  ).toContainText('2.600');
  await expect(
    page.getByText('menu untungnya turun di bawah target'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Lihat menu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Menu di bawah target' });
  await expect(dialog.getByText('Brownies').first()).toBeVisible();
  await dialog.getByRole('button', { name: /^Pakai Rp/ }).click();
  await expect(
    page.getByText('menu untungnya turun di bawah target'),
  ).toHaveCount(0);
});

test('bahan: simulasi kenaikan harga menampilkan dampak tanpa menyimpan harga', async ({
  page,
}) => {
  await login(page);
  await seedBrownies(page);
  await page.goto('/bahan');
  const egg = page.getByRole('listitem').filter({ hasText: 'Telur' });
  await egg.getByRole('button', { name: 'Simulasikan dampak' }).click();
  const dialog = page.getByRole('dialog', { name: 'Dampak harga Telur' });
  await expect(dialog.getByText('Harga simulasi Rp 2.300.')).toBeVisible();
  await expect(dialog.getByText('1 resep terdampak')).toBeVisible();
  await expect(dialog.getByText(/HPP Rp 2.925 → Rp 3.000/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    egg.getByRole('button', { name: 'Ubah harga Telur' }),
  ).toContainText('2.000');
});

test('order resep menghitung total dan daftar belanja', async ({ page }) => {
  await login(page);
  await seedBrownies(page);
  const order = page.getByRole('region', {
    name: 'Hitung pesanan dan belanja',
  });
  await order.getByLabel('Jumlah porsi').fill('50');
  await order.getByLabel('Harga jual per porsi (Rp)').fill('5000');
  await order.getByLabel('Komisi saluran (%)').fill('0');
  await order.getByRole('button', { name: 'Hitung pesanan' }).click();
  await expect(order.getByText('Rp 146.250')).toBeVisible();
  await expect(order.getByText('Rp 250.000')).toBeVisible();
  await expect(order.getByText('Rp 103.750')).toBeVisible();
  await expect(order.getByText(/Tepung terigu: perlu 468.75 g/)).toBeVisible();
  await expect(order.getByText(/Telur: perlu 12.5 pcs/)).toBeVisible();
});

test('bahan: form memvalidasi isian dan menolak nama kembar', async ({
  page,
}) => {
  await login(page);
  await page.goto('/bahan');
  await page.getByRole('button', { name: 'Tambah bahan' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Tambah bahan' });
  await dialog.getByRole('button', { name: 'Simpan bahan' }).click();
  await expect(dialog.getByText('Nama bahan wajib diisi.')).toBeVisible();

  await dialog.getByLabel('Nama bahan').fill('Tepung terigu');
  await dialog.getByLabel('Harga beli (rupiah)').fill('14000');
  await dialog.getByRole('button', { name: 'Simpan bahan' }).click();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Tepung terigu' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Tambah bahan' }).first().click();
  const again = page.getByRole('dialog', { name: 'Tambah bahan' });
  await again.getByLabel('Nama bahan').fill('tepung TERIGU');
  await again.getByLabel('Harga beli (rupiah)').fill('1000');
  await again.getByRole('button', { name: 'Simpan bahan' }).click();
  await expect(again.getByText('Nama bahan ini sudah ada.')).toBeVisible();
});

test('resep: duplikat lalu hapus', async ({ page }) => {
  await login(page);
  await seedBrownies(page);
  await page.getByRole('button', { name: 'Duplikat' }).click();
  await expect(page.getByLabel('Nama resep')).toHaveValue('Brownies (salinan)');

  page.once('dialog', (confirm) => confirm.accept());
  await page.getByRole('button', { name: 'Hapus resep' }).click();
  await expect(page).toHaveURL(/\/dashboard\/resep$/);
  await expect(
    page.getByRole('link', { name: /Brownies \(salinan\)/ }),
  ).toHaveCount(0);
});

test('semua layar lolos axe dan bisa dipakai dengan keyboard', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await login(page, { pro: true });
  await seedBrownies(page);
  for (const path of [
    '/dashboard/hitung',
    '/dashboard/bahan',
    '/dashboard/resep',
    '/dashboard/lainnya',
    '/dashboard/beli',
    '/dashboard/penawaran',
    '/dashboard/bagikan',
  ]) {
    await page.goto(path);
    await expect(page.locator('main').first()).toBeVisible();
    await expectNoA11yViolations(page);
  }
  await page.goto('/dashboard/bahan');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Lewati ke isi halaman' }),
  ).toBeFocused();
});
