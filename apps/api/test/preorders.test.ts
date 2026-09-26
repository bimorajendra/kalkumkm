import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/index';
import { FakeD1 } from './fake-d1';

const allowedOrigin = 'https://takaran.example';
const env = (db = new FakeD1()) => ({
  DB: db as unknown as D1Database,
  TURNSTILE_SECRET: 'test-secret',
  IP_SALT: 'test-salt',
  ALLOWED_ORIGINS: allowedOrigin,
  ACCESS_AUD: 'admin-aud',
  ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com',
});
const body = (overrides: Record<string, unknown> = {}) => ({
  businessName: 'Dapur Sari',
  whatsapp: '081234567890',
  productType: 'kue',
  consent: true,
  turnstileToken: 'valid-token',
  source: 'instagram',
  ...overrides,
});

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ success: true })),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe('POST /v1/preorders', () => {
  it('memvalidasi, memverifikasi Turnstile, dan menormalkan nomor ke format 62', async () => {
    const db = new FakeD1();
    const response = await app.request(
      '/v1/preorders',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: allowedOrigin,
          'CF-Connecting-IP': '192.0.2.10',
        },
        body: JSON.stringify(body()),
      },
      env(db),
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      data: { id: expect.any(String) },
    });
    expect(db.orders[0]).toMatchObject({
      business_name: 'Dapur Sari',
      whatsapp: '6281234567890',
      status: 'waitlist',
      source: 'instagram',
    });
    expect(vi.mocked(fetch)).toHaveBeenCalledOnce();
  });

  it('menolak persetujuan, jenis jualan, dan nomor yang tidak valid', async () => {
    const database = env();
    const invalidConsent = await app.request(
      '/v1/preorders',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body({ consent: false })),
      },
      database,
    );
    const invalidType = await app.request(
      '/v1/preorders',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body({ productType: 'lain' })),
      },
      database,
    );
    const invalidPhone = await app.request(
      '/v1/preorders',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body({ whatsapp: '+1 212 555 0111' })),
      },
      database,
    );
    expect(invalidConsent.status).toBe(400);
    expect(invalidType.status).toBe(400);
    expect(invalidPhone.status).toBe(400);
  });

  it('mengembalikan TURNSTILE_FAILED tanpa mencatat data pesanan', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ success: false })),
    );
    const db = new FakeD1();
    const response = await app.request(
      '/v1/preorders',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '192.0.2.11',
        },
        body: JSON.stringify(body()),
      },
      env(db),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: 'TURNSTILE_FAILED' },
    });
    expect(db.orders).toHaveLength(0);
  });

  it('membatasi kiriman keenam per IP per jam dan hanya menyimpan hash IP', async () => {
    const db = new FakeD1();
    const responses = [];
    for (let index = 0; index < 6; index += 1) {
      responses.push(
        await app.request(
          '/v1/preorders',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'CF-Connecting-IP': '192.0.2.12',
            },
            body: JSON.stringify(body()),
          },
          env(db),
        ),
      );
    }
    expect(
      responses.slice(0, 5).every((response) => response.status === 201),
    ).toBe(true);
    expect(responses[5]?.status).toBe(429);
    expect(await responses[5]?.json()).toMatchObject({
      error: { code: 'RATE_LIMITED' },
    });
    expect(db.orders).toHaveLength(5);
    expect(db.rateKeys.every((key) => /^[a-f0-9]{64}$/.test(key))).toBe(true);
    expect(db.rateKeys).not.toContain('192.0.2.12');
  });

  it('menolak origin yang tidak diizinkan dengan bentuk error bersama', async () => {
    const response = await app.request(
      '/v1/preorders',
      {
        method: 'POST',
        headers: { Origin: 'https://other.example' },
        body: '{}',
      },
      env(),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: 'CORS_FORBIDDEN' },
    });
  });
});
