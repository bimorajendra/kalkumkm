import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  { name: 'app', url: 'http://127.0.0.1:5173', heading: 'Takaran' },
  {
    name: 'landing',
    url: 'http://127.0.0.1:4321',
    heading: 'Laris, tapi uangnya nggak kelihatan?',
  },
];

for (const target of pages) {
  test(`${target.name} renders without serious accessibility issues`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto(target.url);
    await expect(
      page.getByRole('heading', { name: target.heading }),
    ).toBeVisible();

    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const seriousViolations = accessibility.violations
      .filter(({ impact }) => impact === 'critical' || impact === 'serious')
      .map(({ id, nodes }) => ({
        id,
        elements: nodes.map(({ target, failureSummary }) => ({
          target,
          failureSummary,
        })),
      }));
    expect(seriousViolations).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

test('app theme control works from the keyboard', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173');
  const themeButton = page.getByRole('button', { name: 'Ganti tema' });

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Takaran' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(themeButton).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(themeButton).toHaveText('Tema: Terang');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('takaran-theme')))
    .toBe('light');

  await page.keyboard.press('Enter');
  await expect(themeButton).toHaveText('Tema: Gelap');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('takaran-theme')))
    .toBe('dark');

  await page.keyboard.press('Enter');
  await expect(themeButton).toHaveText('Tema: Ikuti perangkat');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('takaran-theme')))
    .toBeNull();
});

test('app applies a saved theme before rendering', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('takaran-theme', 'dark'));
  await page.goto('http://127.0.0.1:5173');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Ganti tema' })).toHaveText(
    'Tema: Gelap',
  );
});

test('app uses the selected system color palette', async ({
  page,
}, testInfo) => {
  await page.goto('http://127.0.0.1:5173');
  const background = await page
    .locator('body')
    .evaluate((body) => getComputedStyle(body).backgroundColor);
  const expected =
    testInfo.project.use.colorScheme === 'dark'
      ? 'rgb(23, 17, 13)'
      : 'rgb(251, 246, 241)';

  expect(background).toBe(expected);
});
