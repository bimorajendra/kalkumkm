import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from './helpers';

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

test('enam halaman usaha berisi contoh kontekstual dan breadcrumb', async ({
  page,
}, testInfo) => {
  for (const [slug, hpp] of [
    ['brownies', '2.925'],
    ['katering', '11.600'],
    ['frozen-food', '7.500'],
    ['rice-bowl', '18.000'],
    ['minuman', '6.000'],
    ['hampers', '70.000'],
  ]) {
    await page.goto(`/usaha/hpp-${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await page.getByRole('button', { name: 'Isi angka contoh' }).click();
    await page.getByRole('button', { name: 'Hitung sekarang' }).click();
    await expect(
      page.getByText(`HPP per porsi: Rp ${hpp}`, { exact: true }),
    ).toBeVisible();
    expect(
      await page
        .locator('script[type="application/ld+json"]')
        .allTextContents(),
    ).toEqual(
      expect.arrayContaining([expect.stringContaining('BreadcrumbList')]),
    );
    await expectNoA11yViolations(page);
  }
  await page.screenshot({
    path: testInfo.outputPath('use-case.png'),
    fullPage: true,
  });
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
  expect(captured[0]).toContain('http://localhost:3100/margin');
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
