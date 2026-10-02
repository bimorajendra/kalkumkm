import { expect, test } from '@playwright/test';
import Big from 'big.js';
import { useCases } from '../apps/site/src/features/seo/use-cases';
import { hppFromCosts } from '../packages/calc/src/public-pricing';
import { formatRupiah } from '../packages/ui/src/format';
import { expectNoA11yViolations } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('takaran-analytics-consent-v2', 'denied'),
  );
});

test('contoh kelima kalkulator dapat dihitung dan ditautkan', async ({
  page,
}) => {
  for (const [path, expected] of [
    ['/kalkulator-hpp', 'HPP per porsi: Rp 2.925'],
    ['/margin', 'Margin aktual: 41,5%'],
    ['/harga-jual', 'Harga jual saran: Rp 5.000'],
    ['/harga-ojol', 'Harga jual saran: Rp 7.500'],
    ['/bep', 'Titik impas: 67 unit'],
  ]) {
    await page.goto(path);
    await page.getByRole('button', { name: 'Isi angka contoh' }).click();
    await page.getByRole('button', { name: 'Hitung sekarang' }).click();
    await expect(page.getByText(expected, { exact: true })).toBeVisible();
    await expect(
      page
        .getByRole('navigation', { name: 'Kalkulator terkait' })
        .getByRole('link'),
    ).toHaveCount(5);
    await expectNoA11yViolations(page);
  }
});

test('setiap halaman usaha menghitung contoh dan memiliki breadcrumb', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  for (const item of useCases) {
    expect(item.description.length).toBeLessThanOrEqual(155);
    await page.goto(`/usaha/${item.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await page.getByRole('button', { name: 'Isi angka contoh' }).click();
    await page.getByRole('button', { name: 'Hitung sekarang' }).click();
    const {
      material,
      production,
      packaging,
      yield: quantity,
    } = item.example.values;
    const hpp = formatRupiah(
      hppFromCosts(
        new Big(material),
        new Big(production),
        new Big(packaging),
        Number(quantity),
      ),
    );
    await expect(
      page.getByText(`HPP per porsi: ${hpp}`, { exact: true }),
    ).toBeVisible();
    expect(
      await page
        .locator('script[type="application/ld+json"]')
        .allTextContents(),
    ).toEqual(
      expect.arrayContaining([expect.stringContaining('BreadcrumbList')]),
    );
    const breadcrumbs = page.locator('nav[aria-label="Navigasi halaman"]');
    await expect(
      breadcrumbs.getByRole('link', { name: 'Beranda' }),
    ).toHaveAttribute('href', '/');
    await expect(
      breadcrumbs.getByRole('link', { name: 'Jenis usaha' }),
    ).toHaveAttribute('href', '/usaha');
    await expect(breadcrumbs.locator('[aria-current="page"]')).toHaveText(
      item.title,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      expect.stringContaining(`/usaha/${item.slug}`),
    );
    await expectNoA11yViolations(page);
  }
  await page.screenshot({
    path: testInfo.outputPath('use-case.png'),
    fullPage: true,
  });
});

test('hub usaha lolos axe dan menautkan setiap panduan', async ({ page }) => {
  await page.goto('/usaha');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  const links = page.locator('nav[aria-label^="Panduan "] a');
  await expect(links).toHaveCount(useCases.length);
  for (const item of useCases)
    await expect(links.filter({ hasText: item.title })).toHaveAttribute(
      'href',
      `/usaha/${item.slug}`,
    );
  expect(
    await page
      .locator('script[type="application/ld+json"]')
      .evaluate((script) => script.textContent),
  ).toContain('BreadcrumbList');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    expect.stringContaining('/usaha'),
  );
  const sitemap = await page.request.get('/sitemap.xml');
  expect(await sitemap.text()).toMatch(/<loc>[^<]+\/usaha<\/loc>/);
  await expectNoA11yViolations(page);
});

test('kalkulator menyediakan panduan dan FAQ yang bisa dibuka dengan Enter', async ({
  page,
}) => {
  for (const path of [
    '/kalkulator-hpp',
    '/harga-jual',
    '/margin',
    '/harga-ojol',
    '/bep',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: /Panduan/ })).toBeVisible();
    const details = page.locator('details');
    await expect(details).toHaveCount(path === '/kalkulator-hpp' ? 5 : 4);
    const summary = details.first().locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(details.first()).toHaveAttribute('open', '');
    await page.keyboard.press('Enter');
    await expect(details.first()).not.toHaveAttribute('open', '');
    await expectNoA11yViolations(page);
  }
});

test('berbagi, pembatalan, salin, dan fallback dapat dipakai tanpa mengirim query', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    const captured: string[] = [];
    Object.defineProperty(window, 'sharedResults', { value: captured });
    let shares = 0;
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        if (shares++) throw new DOMException('Dibatalkan', 'AbortError');
        captured.push(data.text ?? '');
      },
    });
    let copies = 0;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          if (copies++) throw new DOMException('Ditolak', 'NotAllowedError');
          captured.push(text);
        },
      },
    });
  });
  await page.goto('/margin?private=secret#private-input');
  await page.getByRole('button', { name: 'Isi angka contoh' }).click();
  await page.getByRole('button', { name: 'Hitung sekarang' }).click();
  const share = page.getByRole('button', { name: 'Bagikan hasil hitung' });
  await share.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Hasil hitung sudah dibagikan.')).toBeVisible();
  await share.click();
  await expect(page.getByText('Hasil hitung sudah dibagikan.')).toHaveCount(0);
  const copy = page.getByRole('button', { name: 'Salin hasil hitung' });
  await copy.click();
  await expect(
    page.getByText('Hasil hitung tersalin. Tempel ke pesanmu.'),
  ).toBeVisible();
  await copy.click();
  const fallback = page.getByLabel('Teks hasil untuk disalin');
  await expect(fallback).toHaveValue(/Dihitung dengan Takaran/);
  await fallback.focus();
  expect(
    await fallback.evaluate(
      (node: HTMLTextAreaElement) => node.selectionEnd - node.selectionStart,
    ),
  ).toBeGreaterThan(0);
  const captured = await page.evaluate(
    () => (window as typeof window & { sharedResults: string[] }).sharedResults,
  );
  expect(captured).toHaveLength(2);
  expect(captured[0]).toContain('Rp 2.925');
  expect(captured[0]).toContain(`${new URL(page.url()).origin}/margin`);
  expect(captured.join('')).not.toContain('private');
  await expectNoA11yViolations(page);
  await page.screenshot({
    path: testInfo.outputPath('share-fallback.png'),
    fullPage: true,
  });
  await page
    .getByRole('link', { name: 'Masuk untuk menyimpan resepmu' })
    .click();
  await expect(page).toHaveURL(/\/masuk$/);
});
