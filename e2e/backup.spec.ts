import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function clearAppData(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('takaran');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tables = Array.from(database.objectStoreNames);
    const transaction = database.transaction(tables, 'readwrite');
    for (const name of tables) transaction.objectStore(name).clear();
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  });
}

async function setLastBackupAt(
  page: import('@playwright/test').Page,
  value: string,
) {
  await page.evaluate(async (lastBackupAt) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('takaran');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction('settings', 'readwrite');
    transaction
      .objectStore('settings')
      .put({ key: 'lastBackupAt', value: lastBackupAt });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, value);
}

test('exports a file and restores its data after confirmation', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5173/resep');
  await page.getByRole('button', { name: 'Pakai contoh brownies' }).click();
  await page.goto('http://127.0.0.1:5173/lainnya');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Simpan file cadangan' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^takaran-cadangan-\d{4}-\d{2}-\d{2}\.json$/,
  );
  const path = await download.path();
  if (!path) throw new Error('File cadangan tidak tersedia untuk dibaca.');
  const backup = JSON.parse(await readFile(path, 'utf8'));
  expect(Object.keys(backup.data).sort()).toEqual([
    'channels',
    'ingredients',
    'priceHistory',
    'quoteOptions',
    'recipes',
    'settings',
  ]);

  await clearAppData(page);
  await page.getByLabel('Pilih file cadangan Takaran').setInputFiles({
    name: download.suggestedFilename(),
    mimeType: 'application/json',
    buffer: await readFile(path),
  });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('5 bahan, 1 resep, 0 saluran');
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    accessibility.violations.filter(
      ({ impact }) => impact === 'critical' || impact === 'serious',
    ),
  ).toEqual([]);
  await dialog.getByRole('button', { name: 'Pulihkan data' }).click();
  await page.goto('http://127.0.0.1:5173/resep');
  await expect(page.getByRole('link', { name: /Brownies/ })).toBeVisible();
});

test('shows the reminder after 14 days and snoozes it for 7 days', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-09-26T12:00:00.000Z') });
  await page.goto('http://127.0.0.1:5173/resep');
  await page.getByRole('button', { name: 'Pakai contoh brownies' }).click();
  await setLastBackupAt(page, '2026-09-01T12:00:00.000Z');
  await page.goto('http://127.0.0.1:5173/');
  await expect(
    page.getByText('Sudah lama belum membuat cadangan data.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Tutup pengingat cadangan' }).click();
  await expect(
    page.getByText('Sudah lama belum membuat cadangan data.'),
  ).toBeHidden();

  await page.clock.fastForward(6 * 24 * 60 * 60 * 1000);
  await page.reload();
  await expect(
    page.getByText('Sudah lama belum membuat cadangan data.'),
  ).toBeHidden();
  await page.clock.fastForward(2 * 24 * 60 * 60 * 1000);
  await page.reload();
  await expect(
    page.getByText('Sudah lama belum membuat cadangan data.'),
  ).toBeVisible();
});
