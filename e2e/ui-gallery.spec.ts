import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('galeri komponen dapat diakses dan dioperasikan', async ({
  page,
}, testInfo) => {
  await page.goto('http://127.0.0.1:5173/dev-ui');
  await expect(
    page.getByRole('heading', { name: 'Komponen bersama' }),
  ).toBeVisible();

  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
  if (
    ['320-light', '320-dark', '1280-light', '1280-dark'].includes(
      testInfo.project.name,
    )
  ) {
    await page.screenshot({
      path: `test-results/ui-${testInfo.project.name}.png`,
      fullPage: true,
    });
  }

  const axe = new AxeBuilder({ page });
  const results = await axe.analyze();
  expect(
    results.violations.filter((violation) =>
      ['critical', 'serious'].includes(violation.impact ?? ''),
    ),
  ).toEqual([]);

  expect(page.getByRole('img', { name: /Komposisi per porsi/ })).toHaveCount(2);
  expect(
    page.getByRole('img', { name: /Rugi Rp 1.200 per porsi/ }),
  ).toHaveCount(1);

  const slider = page.getByRole('slider', { name: 'Lama simpan' });
  const sliderTrack = page.locator('.takaran-slider__track');
  const sliderBox = await sliderTrack.boundingBox();
  if (!sliderBox) throw new Error('Slider tidak terlihat.');
  await page.touchscreen.tap(
    sliderBox.x + sliderBox.width * 0.3,
    sliderBox.y + sliderBox.height / 2,
  );
  await expect(slider).toHaveAttribute('aria-valuetext', '3 bulan');
  await page.mouse.click(
    sliderBox.x + sliderBox.width * 0.99,
    sliderBox.y + sliderBox.height / 2,
  );
  await expect(slider).toHaveAttribute('aria-valuetext', '12 bulan');
  await slider.focus();
  await page.keyboard.press('Home');
  await expect(slider).toHaveAttribute('aria-valuetext', '1 bulan');
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuetext', '3 bulan');
  await page.keyboard.press('End');
  await expect(slider).toHaveAttribute('aria-valuetext', '12 bulan');

  await page.getByRole('button', { name: 'Ketik angka' }).click();
  const customInput = page.getByRole('spinbutton', { name: 'Angka khusus' });
  await customInput.fill('5');
  await expect(page.getByText('Pilihan: 5 bulan')).toBeVisible();
  await customInput.fill('99');
  await expect(customInput).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Pilihan: 5 bulan')).toBeVisible();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Ubah nilai' }).click();
  await expect(page.getByRole('status', { name: 'Nilai animasi' })).toHaveText(
    'Rp 15.000',
  );

  await page.getByRole('button', { name: 'Tutup pemberitahuan' }).focus();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('status').filter({ hasText: 'Pemberitahuan ditutup.' }),
  ).toBeVisible();
});
