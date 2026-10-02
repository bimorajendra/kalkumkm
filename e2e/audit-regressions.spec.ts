import { expect, test } from '@playwright/test';
import { expectNoA11yViolations, login, seedBrownies } from './helpers';

test('hasil publik dibatalkan saat isian berubah dan porsi menolak notasi non-desimal', async ({
  page,
}, testInfo) => {
  await page.goto('/kalkulator-hpp');
  await page.getByLabel('Total biaya bahan satu adonan (Rp)').fill('27800');
  await page.getByLabel('Biaya produksi lain satu adonan (Rp)').fill('3000');
  await page.getByLabel('Jumlah porsi yang dihasilkan').fill('16');
  await page.getByLabel('Biaya kemasan per porsi (Rp)').fill('1000');
  const submit = page.getByRole('button', { name: 'Hitung sekarang' });
  await submit.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('HPP per porsi: Rp 2.925')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('public-calculator.png'),
    fullPage: true,
  });
  await page.getByLabel('Jumlah porsi yang dihasilkan').fill('0x10');
  await expect(page.getByText('HPP per porsi: Rp 2.925')).toHaveCount(0);
  await submit.click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Jumlah porsi' }),
  ).toBeVisible();
  await expectNoA11yViolations(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('autosave lama tidak membatalkan perubahan slider terbaru', async ({
  page,
}) => {
  await login(page);
  await seedBrownies(page);
  await page.getByRole('link', { name: 'Hitung harga' }).click();
  const slider = page.getByRole('slider', { name: 'Target untung' });
  await expect(slider).toBeVisible({ timeout: 15000 });
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = () => {};
  const firstSaved = new Promise<void>((resolve) => {
    received = resolve;
  });
  let intercepted = false;
  await page.route('**/dashboard/hitung**', async (route) => {
    const body = route.request().postData() ?? '';
    if (intercepted || !body.includes('recipe.patch')) return route.continue();
    intercepted = true;
    const response = await route.fetch();
    received();
    await held;
    await route.fulfill({ response });
  });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await firstSaved;
  await page.keyboard.press('ArrowRight');
  release();
  await expect
    .poll(async () => {
      const response = await page.request.get('/api/me/export');
      const data = await response.json();
      return data.recipes[0]?.targetMarginBp;
    })
    .toBe(6000);
  await page.reload();
  await expect(slider).toHaveAttribute('aria-valuetext', '60 persen');
});
