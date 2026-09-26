import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('adds, searches, edits a price with keyboard, and keeps the form accessible', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(
        `${message.text()} ${JSON.stringify(message.location())}`,
      );
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      consoleErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('requestfailed', (request) => {
    consoleErrors.push(`${request.url()} ${request.failure()?.errorText}`);
  });
  await page.goto('http://127.0.0.1:5173/bahan');
  await expect(
    page.getByRole('heading', { name: 'Rak bahanmu masih kosong.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Tambah bahan' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const dialogAccessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    dialogAccessibility.violations.filter(
      ({ impact }) => impact === 'critical' || impact === 'serious',
    ),
  ).toEqual([]);
  await dialog.getByRole('button', { name: 'Simpan bahan' }).click();
  await expect(dialog.getByText('Nama bahan wajib diisi.')).toBeVisible();
  await dialog.getByLabel('Nama bahan').fill('Tepung terigu');
  await dialog.getByLabel('Harga beli (rupiah)').fill('14000');
  await dialog.getByLabel('Isi kemasan').fill('1');
  await dialog.getByLabel('Satuan', { exact: true }).selectOption('kg');
  await dialog.getByRole('button', { name: 'Simpan bahan' }).click();
  await expect(page.getByText('Rp 14/gram')).toBeVisible();

  await page.getByLabel('Cari bahan').fill('gula');
  await expect(page.getByText('Bahan tidak ditemukan.')).toBeVisible();
  await page.getByLabel('Cari bahan').fill('TERIGU');
  await expect(
    page.getByRole('button', { name: 'Tepung terigu' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ubah harga' }).tap();
  const priceInput = page.getByRole('textbox', {
    name: 'Tepung terigu, Harga beli (rupiah)',
  });
  await priceInput.fill('15000');
  await priceInput.press('Enter');
  await expect(page.getByText('Rp 15/gram')).toBeVisible();
  await page.getByRole('button', { name: 'Ubah harga' }).click();
  await page
    .getByRole('textbox', { name: 'Tepung terigu, Harga beli (rupiah)' })
    .fill('16000');
  await page.keyboard.press('Escape');
  await expect(page.getByText('Rp 15.000')).toBeVisible();
  await page.getByRole('button', { name: 'Ubah harga' }).click();
  await page
    .getByRole('textbox', { name: 'Tepung terigu, Harga beli (rupiah)' })
    .fill('16000');
  await page.getByRole('button', { name: 'Batal' }).click();
  await expect(page.getByText('Rp 15.000')).toBeVisible();
  await page.getByRole('button', { name: 'Ubah harga' }).click();
  await page
    .getByRole('textbox', { name: 'Tepung terigu, Harga beli (rupiah)' })
    .fill('16000');
  await page.getByRole('button', { name: 'Simpan harga' }).click();
  await expect(page.getByText('Rp 16/gram')).toBeVisible();

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
  expect(consoleErrors, consoleErrors.join('; ')).toEqual([]);
});

test('adds a custom bungkus size and refuses duplicate names', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5173/bahan');
  await page.getByRole('button', { name: 'Tambah bahan' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nama bahan').fill('Cokelat');
  await dialog.getByLabel('Harga beli (rupiah)').fill('12500');
  await dialog.getByLabel('Isi kemasan').fill('1');
  await dialog.getByLabel('Satuan', { exact: true }).selectOption('bungkus');
  await dialog.getByLabel('Isi dalam satuan dasar').fill('250');
  await dialog.getByRole('button', { name: 'Simpan bahan' }).click();
  await expect(page.getByText('Rp 50/gram')).toBeVisible();

  await page.getByRole('button', { name: 'Tambah bahan' }).first().click();
  const duplicateDialog = page.getByRole('dialog');
  await duplicateDialog.getByLabel('Nama bahan').fill('Cokelat');
  await duplicateDialog.getByLabel('Harga beli (rupiah)').fill('12500');
  await duplicateDialog.getByLabel('Isi kemasan').fill('1');
  await duplicateDialog.getByLabel('Satuan', { exact: true }).selectOption('g');
  await duplicateDialog.getByRole('button', { name: 'Simpan bahan' }).click();
  await expect(
    duplicateDialog.getByText('Nama bahan ini sudah ada.'),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(duplicateDialog).not.toBeVisible();
  await page.getByRole('button', { name: 'Tambah bahan' }).first().click();
  const closeDialog = page.getByRole('dialog');
  await closeDialog.getByRole('button', { name: 'Tutup' }).click();
  await expect(closeDialog).not.toBeVisible();
});

test('shows recipe usage after a price change and blocks deleting a used ingredient', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5173/bahan');
  await page.getByRole('button', { name: 'Tambah bahan' }).first().click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Nama bahan').fill('Tepung');
  await form.getByLabel('Harga beli (rupiah)').fill('14000');
  await form.getByLabel('Isi kemasan').fill('1');
  await form.getByLabel('Satuan', { exact: true }).selectOption('kg');
  await form.getByRole('button', { name: 'Simpan bahan' }).click();

  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('takaran');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const ingredients = await new Promise<{ id: string }[]>(
      (resolve, reject) => {
        const request = database
          .transaction('ingredients')
          .objectStore('ingredients')
          .getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );
    const ingredient = ingredients[0];
    if (!ingredient) throw new Error('Ingredient row was not saved.');
    const transaction = database.transaction('recipes', 'readwrite');
    transaction.objectStore('recipes').add({
      id: 'recipe-e2e',
      name: 'Brownies',
      yieldPortions: 1,
      items: [
        {
          refType: 'ingredient',
          refId: ingredient.id,
          quantity: 100,
          unit: 'g',
        },
      ],
      packagingPerPortion: 0,
      energyPerBatch: 0,
      laborMinutesPerBatch: 0,
      laborRatePerHour: null,
      targetMarginBp: 4000,
      currentPrice: null,
      isSubRecipe: false,
      subRecipeYield: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
  await page.reload();
  await page.getByRole('button', { name: 'Ubah harga' }).click();
  const price = page.getByRole('textbox', {
    name: 'Tepung, Harga beli (rupiah)',
  });
  await price.fill('15000');
  await price.press('Enter');
  await expect(
    page.getByRole('link', { name: 'Dipakai di 1 resep' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Tepung' }).click();
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Hapus bahan' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Bahan ini dipakai di 1 resep. Hapus dari resepnya dulu.',
  );
});
