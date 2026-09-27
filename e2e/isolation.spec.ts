import { expect, test } from '@playwright/test';
import { login, randomIp, seedBrownies } from './helpers';

test('data satu akun tidak terlihat di akun lain', async ({ browser }) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const pageA = await a.newPage();
  const pageB = await b.newPage();

  await login(pageA);
  await seedBrownies(pageA);
  await pageA.goto('/bahan');
  await expect(
    pageA.getByRole('listitem').filter({ hasText: 'Cokelat masak' }),
  ).toBeVisible();

  await login(pageB);
  await pageB.goto('/bahan');
  await expect(pageB.getByText('Rak bahanmu masih kosong.')).toBeVisible();
  await pageB.goto('/resep');
  await expect(pageB.getByText('Belum ada resep.')).toBeVisible();

  // Alamat resep milik A tidak menampilkan apa pun di akun B.
  await pageA.goto('/resep');
  const href = await pageA
    .getByRole('link', { name: /Brownies/ })
    .getAttribute('href');
  await pageB.goto(href ?? '/resep');
  await expect(
    pageB.getByRole('heading', { name: 'Resep tidak ditemukan.' }),
  ).toBeVisible();

  await a.close();
  await b.close();
});

test('unduh data hanya memuat data akun sendiri dan menolak tamu', async ({
  page,
  playwright,
}) => {
  await login(page);
  await seedBrownies(page);
  const response = await page.request.get('/api/me/export');
  expect(response.ok()).toBe(true);
  const data = await response.json();
  expect(data.recipes).toHaveLength(1);
  expect(data.ingredients).toHaveLength(5);

  const guest = await playwright.request.newContext({
    baseURL: 'http://localhost:3100',
  });
  expect((await guest.get('/api/me/export')).status()).toBe(401);
  await guest.dispose();
});

test('rute admin tidak terlihat oleh non-admin', async ({ page }) => {
  await login(page);
  const response = await page.goto('/admin');
  expect(response?.status()).toBe(404);
  const csv = await page.request.get('/admin/export');
  expect(csv.status()).toBe(404);
});

test('admin melihat pesanan dan daftar tunggu, dan bisa mengunduh CSV', async ({
  page,
}) => {
  // Kirim satu pendaftar supaya daftar tunggu tidak kosong.
  const created = await page.request.post('/api/waitlist', {
    headers: { 'x-forwarded-for': randomIp() },
    data: {
      businessName: '=Kue Uji',
      whatsapp: '081234567890',
      productType: 'kue',
      consent: true,
    },
  });
  expect(created.status()).toBe(201);

  await login(page, { email: 'admin@contoh.id' });
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Pesanan Pro' }),
  ).toBeVisible();
  await expect(page.getByText('Daftar tunggu (')).toBeVisible();

  const csv = await page.request.get('/admin/export');
  expect(csv.status()).toBe(200);
  const text = await csv.text();
  expect(text).toContain('waktu,usaha,whatsapp,jenis,sumber');
  // Sel yang diawali "=" tidak boleh dieksekusi sebagai rumus di Excel.
  expect(text).toContain(`"'=Kue Uji"`);
});
