import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

let counter = 0;

/** Email unik per pemanggilan supaya tes tidak saling berbagi data. */
export function uniqueEmail(prefix = 'penguji') {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}-${Math.floor(Math.random() * 1e6)}@contoh.id`;
}

/** Alamat IP acak per tes, supaya batas percobaan per IP tidak saling mengganggu. */
export function randomIp() {
  const octet = () => Math.floor(Math.random() * 250) + 1;
  return `10.${octet()}.${octet()}.${octet()}`;
}

/** Masuk tanpa Google lewat rute uji (hanya ada saat E2E_TEST_AUTH=1). */
export async function login(
  page: Page,
  options: { email?: string; pro?: boolean } = {},
) {
  const email = options.email ?? uniqueEmail();
  const response = await page.request.post('/api/e2e/login', {
    data: { email, pro: options.pro ?? false },
  });
  expect(response.ok()).toBe(true);
  return email;
}

export async function expectNoA11yViolations(page: Page) {
  // Tunggu transisi warna (opacity tombol) selesai agar kontras dibaca stabil.
  await page.waitForTimeout(400);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  // Ringkas: satu baris per pelanggaran supaya galat mudah dibaca.
  const summary = results.violations.flatMap((violation) =>
    violation.nodes.map(
      (node) =>
        `${page.url()} ${violation.id}: ${node.target.join(' ')} :: ${(node.failureSummary ?? '').replace(/\s+/g, ' ').trim()}`,
    ),
  );
  expect(summary).toEqual([]);
}

/** Buka resep contoh brownies dari halaman Resep. */
export async function seedBrownies(page: Page) {
  await page.goto('/resep');
  await page.getByRole('button', { name: 'Pakai contoh brownies' }).click();
  await expect(page).toHaveURL(/\/dashboard\/resep\/.+/, { timeout: 15000 });
}
