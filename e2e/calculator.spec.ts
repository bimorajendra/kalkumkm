import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('shows the brownie price, margin, hourly profit, and usable controls', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5173/resep');
  await page.getByRole('button', { name: 'Pakai contoh brownies' }).click();
  await expect(page).toHaveURL(/\/resep\/.+/);
  await page.goto('http://127.0.0.1:5173/');

  await expect(
    page.getByRole('heading', { name: 'Hitung untung brownies' }),
  ).toBeVisible();
  const mobile = (page.viewportSize()?.width ?? 1280) < 640;
  if (mobile) await page.getByRole('button', { name: 'Detail' }).click();
  const resultCard = mobile
    ? page.getByRole('dialog', { name: 'Hasil lengkap' })
    : page.locator('.calculator-result-desktop');
  await expect(resultCard.getByText('Rp 5.000', { exact: true })).toBeVisible();
  await expect(
    resultCard.getByText('Margin 41,5% · markup 70,9%'),
  ).toBeVisible();
  await expect(
    resultCard.getByText('Rp 22.133', { exact: true }),
  ).toBeVisible();
  const savePrice = resultCard.getByRole('button', {
    name: 'Simpan harga ini',
  });
  await savePrice.click();
  await expect(
    resultCard.getByRole('button', { name: 'Harga disimpan' }),
  ).toBeVisible();
  if (mobile) await page.keyboard.press('Escape');

  const recipePicker = page.getByRole('button', { name: /Brownies/ });
  await recipePicker.focus();
  await page.keyboard.press('Enter');
  const recipeDialog = page.getByRole('dialog', { name: 'Pilih resep' });
  await expect(recipeDialog).toBeVisible();
  await recipeDialog.getByRole('button', { name: /Brownies/ }).click();
  await expect(recipeDialog).not.toBeVisible();

  const price = page.getByLabel('Harga yang kamu pakai sekarang');
  await price.fill('4200');
  await price.press('Tab');
  await expect(
    page.getByText(/Rugi Rp 1.275 per potong|Di bawah target 40%/),
  ).toBeVisible();

  const marginSlider = page.getByRole('slider', { name: 'Target untung' });
  await expect(page.getByRole('slider')).toHaveCount(2);
  await expect(
    page.getByRole('button', { name: 'Buat gambar daftar harga' }),
  ).toHaveCount(0);
  await marginSlider.focus();
  await page.keyboard.press('Home');
  await expect(marginSlider).toHaveAttribute('aria-valuetext', /10 persen/);
  await page.keyboard.press('End');
  await expect(marginSlider).toHaveAttribute('aria-valuetext', /70 persen/);

  const laborSlider = page.getByRole('slider', {
    name: 'Jam kerja per adonan',
  });
  await laborSlider.focus();
  await page.keyboard.press('Home');
  await expect(laborSlider).toHaveAttribute('aria-valuetext', /0,5 jam/);
  await page.keyboard.press('End');
  await expect(laborSlider).toHaveAttribute('aria-valuetext', /4 jam/);

  const marginGroup = page.getByRole('group', { name: 'Target untung' });
  await marginGroup.getByRole('button', { name: 'Ketik angka' }).click();
  await marginGroup.getByLabel('Angka khusus').fill('35');
  await expect(marginSlider).toHaveAttribute('aria-valuetext', /35 persen/);
  await page.waitForTimeout(600);
  await page.reload();
  const savedMargin = page.getByRole('slider', { name: 'Target untung' });
  await expect(savedMargin).toHaveAttribute('aria-valuetext', /35 persen/);

  const laborGroup = page.getByRole('group', { name: 'Jam kerja per adonan' });
  await laborGroup.getByRole('button', { name: 'Ketik angka' }).click();
  const laborInput = laborGroup.getByLabel('Angka khusus');
  await laborInput.fill('0.5');
  await expect(laborInput).toHaveAttribute('aria-invalid', 'true');
  await laborInput.fill('0');
  await expect(laborInput).toHaveAttribute('aria-invalid', 'false');
  await expect(page.getByText(/untungmu setelah/)).toHaveCount(0);

  if (mobile) {
    await page.getByRole('button', { name: 'Detail' }).click();
    const details = page.getByRole('dialog', { name: 'Hasil lengkap' });
    await expect(details).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(details).not.toBeVisible();
    await page.getByRole('button', { name: 'Detail' }).click();
    await details
      .locator('.calculator-details__heading')
      .evaluate((element) => {
        const start = new Touch({
          identifier: 1,
          target: element,
          clientX: 24,
          clientY: 50,
        });
        const end = new Touch({
          identifier: 1,
          target: element,
          clientX: 24,
          clientY: 160,
        });
        element.dispatchEvent(
          new TouchEvent('touchstart', { bubbles: true, touches: [start] }),
        );
        element.dispatchEvent(
          new TouchEvent('touchend', { bubbles: true, changedTouches: [end] }),
        );
      });
    await expect(details).not.toBeVisible();
  }

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

test('shows the first-recipe empty state and its working links', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5173/');
  await expect(
    page.getByRole('heading', { name: 'Mulai dari satu resep.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Lihat resep' }).click();
  await expect(page).toHaveURL(/\/resep$/);
});
