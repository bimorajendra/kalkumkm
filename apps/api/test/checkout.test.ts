import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/index';
import { FakeD1 } from './fake-d1';

const db = new FakeD1();
const env = {
  DB: db as unknown as D1Database,
  TURNSTILE_SECRET: 'turnstile-secret',
  IP_SALT: 'test-salt',
  ALLOWED_ORIGINS: 'https://app.takaran.example',
  ACCESS_AUD: 'test-aud',
  ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com',
  LICENSE_PRIVATE_KEY: '',
  MAYAR_API_KEY: 'sandbox-key',
  MAYAR_BASE_URL: 'https://api.mayar.io/hl/v2',
  MAYAR_WEBHOOK_TOKEN: 'webhook-secret',
};
const checkoutBody = {
  name: 'Bimo',
  email: 'bimo@example.com',
  whatsapp: '081234567890',
  businessName: 'Dapur Bimo',
  consent: true,
  turnstileToken: 'valid-token',
};
const seed = Uint8Array.from({ length: 32 }, (_, index) => index + 1);

function base64Url(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function mockMayar(status = 'paid', amount = 49000) {
  const detailCalls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('siteverify')) return Response.json({ success: true });
      if (url.endsWith('/invoices/create')) {
        const body = JSON.parse(String(init?.body));
        expect(body.items[0].rate).toBeGreaterThan(0);
        return Response.json({
          statusCode: 200,
          messages: 'success',
          data: {
            id: 'invoice-1',
            link: 'https://testingmayar.myr.id/invoices/abc',
            expiredAt: Date.now() + 86_400_000,
          },
        });
      }
      if (url.endsWith('/invoices/invoice-1')) {
        detailCalls.push(url);
        return Response.json({
          statusCode: 200,
          messages: 'success',
          data: {
            id: 'invoice-1',
            amount,
            status,
            customer: { email: 'bimo@example.com' },
          },
        });
      }
      return Response.json(
        { statusCode: 404, messages: 'not found', data: {} },
        { status: 404 },
      );
    }),
  );
  return detailCalls;
}

async function createCheckout() {
  const response = await app.request(
    '/v1/checkout',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '192.0.2.20',
      },
      body: JSON.stringify(checkoutBody),
    },
    env,
  );
  return {
    response,
    result: (await response.json()) as {
      data: { orderId: string; claimToken: string; amountIdr: number };
    },
  };
}

beforeEach(() => {
  db.orders = [];
  db.licenses = [];
  db.webhookEvents = [];
  db.rates.clear();
  db.rateKeys = [];
});
afterEach(() => vi.unstubAllGlobals());

describe('checkout Mayar', () => {
  it('menolak token webhook yang salah', async () => {
    const response = await app.request(
      '/v1/webhooks/mayar?token=wrong-token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'payment.received', data: {} }),
      },
      env,
    );
    expect(response.status).toBe(404);
    expect(db.webhookEvents).toHaveLength(0);
  });

  it('memvalidasi Turnstile, mengambil harga pendiri dari server, dan menyimpan hash token saja', async () => {
    mockMayar('unpaid');
    const { response, result } = await createCheckout();
    expect(response.status).toBe(201);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(result.data.amountIdr).toBe(49000);
    expect(db.orders[0]).toMatchObject({
      status: 'checkout',
      pay_method: 'mayar',
      price_idr: 49000,
      email: 'bimo@example.com',
      mayar_invoice_id: 'invoice-1',
    });
    expect(db.orders[0]?.claim_token_hash).not.toBe(result.data.claimToken);
    expect(db.orders[0]?.claim_token_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('menolak body tambahan dan membatalkan pesanan jika invoice gagal dibuat', async () => {
    const invalid = await app.request(
      '/v1/checkout',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...checkoutBody, priceIdr: 1 }),
      },
      env,
    );
    expect(invalid.status).toBe(400);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).includes('siteverify')
          ? Response.json({ success: true })
          : Response.json(
              { statusCode: 503, messages: 'failed', data: {} },
              { status: 503 },
            ),
      ),
    );
    const failed = await createCheckout();
    expect(failed.response.status).toBe(503);
    expect(db.orders[0]?.status).toBe('cancelled');
  });

  it('menolak token klaim yang salah dan menerbitkan lisensi hanya setelah Mayar mengonfirmasi invoice', async () => {
    const details = mockMayar();
    env.LICENSE_PRIVATE_KEY = base64Url(seed);
    const { result } = await createCheckout();
    const wrongToken = await app.request(
      `/v1/checkout/${result.data.orderId}/license`,
      { headers: { 'X-Claim-Token': 'A'.repeat(43) } },
      env,
    );
    expect(wrongToken.status).toBe(404);
    expect(details).toHaveLength(0);

    const claim = await app.request(
      `/v1/checkout/${result.data.orderId}/license`,
      { headers: { 'X-Claim-Token': result.data.claimToken } },
      env,
    );
    expect(claim.status).toBe(200);
    expect(await claim.json()).toMatchObject({
      data: { status: 'licensed', code: expect.any(String) },
    });
    expect(db.orders[0]?.status).toBe('licensed');
    expect(db.licenses).toHaveLength(1);
    expect(db.licenses[0]?.license_code).toBeTruthy();
    expect(details).toHaveLength(1);
  });

  it('menahan klaim jika nominal tidak cocok dan membatasi cek invoice ke 30 detik', async () => {
    const details = mockMayar('paid', 79000);
    const { result } = await createCheckout();
    const first = await app.request(
      `/v1/checkout/${result.data.orderId}/license`,
      { headers: { 'X-Claim-Token': result.data.claimToken } },
      env,
    );
    expect(first.status).toBe(202);
    expect(db.orders[0]?.status).toBe('checkout');
    expect(db.licenses).toHaveLength(0);
    expect(details).toHaveLength(1);

    const second = await app.request(
      `/v1/checkout/${result.data.orderId}/license`,
      { headers: { 'X-Claim-Token': result.data.claimToken } },
      env,
    );
    expect(second.status).toBe(202);
    expect(details).toHaveLength(1);
  });

  it('membatalkan checkout saat invoice sudah kedaluwarsa', async () => {
    mockMayar('expired');
    const { result } = await createCheckout();
    const response = await app.request(
      `/v1/checkout/${result.data.orderId}/license`,
      { headers: { 'X-Claim-Token': result.data.claimToken } },
      env,
    );
    expect(response.status).toBe(202);
    expect(db.orders[0]?.status).toBe('cancelled');
    expect(db.licenses).toHaveLength(0);
  });

  it('menyimpan webhook sebelum merespons dan memproses ulang secara idempoten', async () => {
    const details = mockMayar();
    env.LICENSE_PRIVATE_KEY = base64Url(seed);
    await createCheckout();
    const body = {
      event: 'payment.received',
      data: {
        id: 'transaction-1',
        transactionId: 'transaction-1',
        productId: 'invoice-1',
        transactionStatus: 'paid',
        customerEmail: 'bimo@example.com',
        amount: 49000,
      },
    };
    const waitUntil = vi.fn((task: Promise<unknown>) => task);
    const ctx = { waitUntil } as unknown as ExecutionContext;
    const call = () =>
      app.request(
        '/v1/webhooks/mayar?token=webhook-secret',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        env,
        ctx,
      );
    const response = await call();
    expect(response.status).toBe(200);
    expect(db.webhookEvents).toHaveLength(1);
    await waitUntil.mock.results[0]?.value;
    expect(db.orders[0]?.status).toBe('licensed');
    await call();
    expect(waitUntil).toHaveBeenCalledOnce();
    expect(details).toHaveLength(1);
    expect(db.licenses).toHaveLength(1);
    expect(db.webhookEvents[0]?.payload_json).toContain('bimo@example.com');
  });
});
