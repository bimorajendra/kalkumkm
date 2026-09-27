import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('free account sees the quote paywall from the Lainnya screen', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5173/lainnya');
  await page.getByRole('link', { name: 'Buka penawaran' }).click();
  await expect(page).toHaveURL(/\/penawaran$/);
  const paywall = page.getByRole('dialog', { name: 'Fitur Takaran Pro' });
  await expect(paywall).toBeVisible();
  await expect(
    paywall.getByText('Buat penawaran pesanan custom dengan Takaran Pro.'),
  ).toBeVisible();

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
});
