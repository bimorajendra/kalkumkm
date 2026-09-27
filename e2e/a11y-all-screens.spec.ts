import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const screens = [
  {
    name: 'app-home',
    url: 'http://127.0.0.1:5173/',
    heading: 'Mulai dari satu resep.',
  },
  { name: 'app-bahan', url: 'http://127.0.0.1:5173/bahan', heading: 'Bahan' },
  {
    name: 'app-resep',
    url: 'http://127.0.0.1:5173/resep',
    heading: 'Belum ada resep.',
  },
  {
    name: 'app-pengaturan',
    url: 'http://127.0.0.1:5173/lainnya',
    heading: 'Pengaturan',
  },
  {
    name: 'landing',
    url: 'http://127.0.0.1:4321/',
    heading: 'Laris, tapi uangnya nggak kelihatan?',
  },
];

for (const screen of screens) {
  test(`${screen.name} bebas pelanggaran aksesibilitas serius dan overflow`, async ({
    page,
  }) => {
    await page.goto(screen.url);
    await expect(
      page.getByRole('heading', { name: screen.heading, exact: true }),
    ).toBeVisible();
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
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
}
