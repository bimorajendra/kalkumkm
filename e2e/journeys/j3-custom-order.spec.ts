import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('J-3: pesanan custom dibatasi untuk pengguna Pro', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/penawaran');
  await expect(
    page.getByRole('dialog', { name: 'Fitur Takaran Pro' }),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    axe.violations.filter(
      ({ impact }) => impact === 'critical' || impact === 'serious',
    ),
  ).toEqual([]);
});
