import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('creates the brownie example and shows its HPP and accessible breakdown', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5173/resep');
  await page.getByRole('button', { name: 'Pakai contoh brownies' }).click();
  await expect(page).toHaveURL(/\/resep\/.+/);
  await expect(
    page.getByRole('heading', { name: 'Brownies', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('HPP Rp 2.925 per porsi')).toBeVisible();
  await expect(page.getByText('Bahan Rp 27.800')).toBeVisible();
  await expect(
    page.getByRole('img', { name: /Komposisi per porsi/ }),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    axe.violations.filter(
      ({ impact }) => impact === 'critical' || impact === 'serious',
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('creates a recipe and validates an empty name', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/resep');
  await page.getByRole('button', { name: 'Buat resep sendiri' }).click();
  const dialog = page.getByRole('dialog');
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    axe.violations.filter(
      ({ impact }) => impact === 'critical' || impact === 'serious',
    ),
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  const createRecipeButton = page.getByRole('button', {
    name: 'Buat resep sendiri',
  });
  await createRecipeButton.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Tutup' }).click();
  await expect(dialog).not.toBeVisible();
  await createRecipeButton.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Simpan resep' }).click();
  await expect(dialog.getByText('Nama resep wajib diisi.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Batal' }).click();
  await expect(dialog).not.toBeVisible();
  await createRecipeButton.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Nama resep').fill('Kue kukus');
  await dialog.getByLabel('Hasil per adonan (porsi)').fill('8');
  await dialog.getByRole('button', { name: 'Simpan resep' }).click();
  await expect(page).toHaveURL(/\/resep\/.+/);
  await expect(page.getByRole('heading', { name: 'Kue kukus' })).toBeVisible();
  await page.getByRole('link', { name: 'Kembali ke resep' }).click();
  await page.getByRole('button', { name: 'Buat resep', exact: true }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Tutup' }).click();
  await expect(dialog).not.toBeVisible();
});

test('deletes a recipe from its editor and returns to the empty state', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5173/resep');
  await page.getByRole('button', { name: 'Pakai contoh brownies' }).click();
  await expect(page).toHaveURL(/\/resep\/.+/);
  await page.getByRole('button', { name: 'Ubah resep' }).click();
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Hapus resep' }).click();
  await expect(page).toHaveURL(/\/resep$/);
  await expect(
    page.getByRole('heading', { name: 'Belum ada resep.' }),
  ).toBeVisible();
});

test('adds an ingredient to a new recipe and includes energy and packaging', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5173/bahan');
  await page.getByRole('button', { name: 'Tambah bahan' }).click();
  const ingredientForm = page.getByRole('dialog');
  await ingredientForm.getByLabel('Nama bahan').fill('Telur');
  await ingredientForm.getByLabel('Harga beli (rupiah)').fill('2000');
  await ingredientForm.getByLabel('Isi kemasan').fill('1');
  await ingredientForm
    .getByLabel('Satuan', { exact: true })
    .selectOption('butir');
  await ingredientForm.getByRole('button', { name: 'Simpan bahan' }).click();
  await expect(page.getByRole('button', { name: 'Telur' })).toBeVisible();

  await page.goto('http://127.0.0.1:5173/resep');
  await page.getByRole('button', { name: 'Buat resep sendiri' }).click();
  const recipeForm = page.getByRole('dialog');
  await recipeForm.getByLabel('Nama resep').fill('Telur kukus');
  await recipeForm
    .getByLabel('Tambah bahan ke resep')
    .selectOption({ label: 'Telur' });
  await recipeForm.getByRole('button', { name: 'Hapus' }).click();
  await expect(recipeForm.getByLabel('Takaran Telur')).not.toBeVisible();
  await recipeForm
    .getByLabel('Tambah bahan ke resep')
    .selectOption({ label: 'Telur' });
  await recipeForm.getByLabel('Takaran Telur').fill('2');
  await recipeForm.getByLabel('Hasil per adonan (porsi)').fill('4');
  await recipeForm.getByLabel('Kemasan per porsi (Rp)').fill('1000');
  await recipeForm.getByLabel('Energi per adonan (Rp)').fill('3000');
  await recipeForm.getByRole('button', { name: 'Simpan resep' }).click();
  await expect(page).toHaveURL(/\/resep\/.+/);
  await expect(page.getByText('HPP Rp 2.750 per porsi')).toBeVisible();
});

test('filters measurement units and recalculates HPP after changing a recipe amount', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5173/resep');
  await page.getByRole('button', { name: 'Pakai contoh brownies' }).click();
  await expect(page.getByText('HPP Rp 2.925 per porsi')).toBeVisible();
  await page.getByRole('button', { name: 'Ubah resep' }).click();
  const dialog = page.getByRole('dialog');
  const flourUnit = dialog.getByLabel('Satuan Tepung terigu');
  await expect(flourUnit.locator('option')).toHaveCount(2);
  await expect(flourUnit.locator('option')).toHaveText(['g', 'kg']);
  await dialog.getByLabel('Takaran Tepung terigu').fill('200');
  await dialog.getByRole('button', { name: 'Simpan resep' }).click();
  await expect(page.getByText('HPP Rp 2.969 per porsi')).toBeVisible();
});
