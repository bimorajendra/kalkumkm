import { expect, test } from '@playwright/test';

test('J-4: checkout offline mempertahankan isian pengguna', async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'turnstile', {
      configurable: true,
      value: {
        render: (
          _container: HTMLElement,
          options: { callback: (token: string) => void },
        ) => {
          window.setTimeout(() => options.callback('token-uji'), 0);
          return 'widget-uji';
        },
        remove: () => undefined,
        reset: () => undefined,
      },
    });
  });
  await page.goto('http://127.0.0.1:5173/beli');
  const name = page.getByLabel('Nama', { exact: true });
  await name.fill('Usaha Uji');
  await page.getByLabel('Email').fill('uji@example.test');
  await page.getByLabel('Nomor WhatsApp').fill('081234567890');
  await page.getByLabel('Nama usaha').fill('Brownies Rumahan');
  await page.getByLabel(/Saya setuju data kontak/).check();
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Bayar dengan Mayar' }).click();
  await expect(
    page.getByText(/Pembayaran belum dibuat|Pemeriksaan keamanan gagal dimuat/),
  ).toBeVisible();
  await expect(name).toHaveValue('Usaha Uji');
  await expect(page.getByLabel('Nama usaha')).toHaveValue('Brownies Rumahan');
});
