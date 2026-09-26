import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('landing dan demo brownies bekerja di semua ukuran dan tema', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as typeof window & {
      umami: { track: (event: string, props?: Record<string, string>) => void };
      __umamiEvents: Array<{ event: string; props?: Record<string, string> }>;
    };
    w.__umamiEvents = [];
    w.umami = {
      track: (event, props) => w.__umamiEvents.push({ event, props }),
    };
  });
  await page.route(
    'https://challenges.cloudflare.com/turnstile/v0/api.js*',
    (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `window.turnstile={render:function(_element,options){window.__turnstileCallback=options.callback;options.callback('test-turnstile-token');return 'test-widget';},reset:function(){window.__turnstileCallback('test-turnstile-token-new');},remove:function(){}};`,
      }),
  );
  let submissions = 0;
  await page.route('**/v1/preorders', (route) => {
    submissions += 1;
    if (submissions === 1) {
      return route.fulfill({
        status: 429,
        json: {
          error: {
            code: 'RATE_LIMITED',
            message: 'Batas daftar tunggu tercapai.',
          },
        },
      });
    }
    return route.fulfill({ status: 201, json: { data: { id: 'test-order' } } });
  });
  await page.goto('http://127.0.0.1:4321/?ref=share');
  await expect(
    page.getByRole('heading', { name: 'Laris, tapi uangnya nggak kelihatan?' }),
  ).toBeVisible();

  const brokenAnchors = await page
    .locator('nav a[href^="#"]')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute('href'))
        .filter((href) => !href || !document.querySelector(href)),
    );
  expect(brokenAnchors).toEqual([]);
  await expect(
    page.getByRole('columnheader', { name: 'HPP per potong' }),
  ).toBeVisible();
  await expect(page.getByText('Rp 3.075')).toBeVisible();
  const axe = await new AxeBuilder({ page }).analyze();
  expect(
    axe.violations.filter((item) =>
      ['critical', 'serious'].includes(item.impact ?? ''),
    ),
  ).toEqual([]);

  const slider = page.getByRole('slider', { name: 'Target untung' });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuetext', '50% target untung');
  await page
    .getByRole('spinbutton', { name: 'Harga telur per butir' })
    .fill('2600');
  await expect(
    page.locator('.hero-demo .takaran-result-card__value'),
  ).toHaveText('Rp 6.500');
  await expect(page.getByText('38,5% · di bawah target 40%')).toBeVisible();

  const businessName = page.getByRole('textbox', { name: 'Nama usaha' });
  await businessName.fill('Dapur Sari');
  await page
    .getByRole('textbox', { name: 'Nomor WhatsApp' })
    .fill('081234567890');
  await page.getByLabel('Jenis jualan').selectOption('kue');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Daftar gratis' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Batas daftar tunggu tercapai.',
  );
  await expect(businessName).toHaveValue('Dapur Sari');

  await page.getByRole('button', { name: 'Daftar gratis' }).click();
  await expect(page.getByRole('status')).toContainText('Terima kasih.');
  const events = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __umamiEvents: Array<{
            event: string;
            props?: Record<string, string>;
          }>;
        }
      ).__umamiEvents,
  );
  expect(events).toContainEqual({
    event: 'preorder_submitted',
    props: { source: 'share' },
  });

  await page.context().setOffline(true);
  await page.getByRole('button', { name: 'Daftar gratis' }).click();
  await expect(page.getByRole('status')).toContainText('Kamu sedang offline.');
  await page.context().setOffline(false);
});
