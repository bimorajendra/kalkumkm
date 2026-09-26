import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { app } from '../src/index';
import { FakeD1 } from './fake-d1';

const teamDomain = `test-${crypto.randomUUID()}.cloudflareaccess.com`;
const audience = 'admin-aud';
let privateKey: CryptoKey;
let publicJwk: JsonWebKey & { kid: string };
const database = new FakeD1();
const env = {
  DB: database as unknown as D1Database,
  TURNSTILE_SECRET: 'test-secret',
  IP_SALT: 'test-salt',
  ALLOWED_ORIGINS: 'https://takaran.example',
  ACCESS_AUD: audience,
  ACCESS_TEAM_DOMAIN: teamDomain,
};

function base64Url(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function accessToken(): Promise<string> {
  const header = base64Url(
    new TextEncoder().encode(
      JSON.stringify({ alg: 'RS256', kid: publicJwk.kid }),
    ),
  );
  const payload = base64Url(
    new TextEncoder().encode(
      JSON.stringify({
        iss: `https://${teamDomain}`,
        aud: [audience],
        exp: Math.floor(Date.now() / 1000) + 300,
        nbf: Math.floor(Date.now() / 1000) - 5,
      }),
    ),
  );
  const input = new TextEncoder().encode(`${header}.${payload}`);
  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, input),
  );
  return `${header}.${payload}.${base64Url(signature)}`;
}

function order(id: string, businessName = 'Dapur Sari') {
  return {
    id,
    business_name: businessName,
    customer_name: null,
    email: null,
    whatsapp: '6281234567890',
    product_type: 'kue',
    status: 'waitlist' as const,
    price_idr: null,
    pay_method: null,
    mayar_invoice_id: null,
    claim_token_hash: null,
    paid_at: null,
    licensed_at: null,
    terminal_at: null,
    source: null,
    consent_at: '2026-01-01T00:00:00.000Z',
    created_at: '2026-01-01T00:00:00.000Z',
  };
}

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  privateKey = pair.privateKey;
  publicJwk = {
    ...(await crypto.subtle.exportKey('jwk', pair.publicKey)),
    kid: 'test-kid',
  };
});
beforeEach(() => {
  database.orders = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ keys: [publicJwk] })),
  );
});
afterEach(() => vi.unstubAllGlobals());

async function authorizedRequest(path: string, init: RequestInit = {}) {
  const token = await accessToken();
  const headers = new Headers(init.headers);
  headers.set('Cf-Access-Jwt-Assertion', token);
  return app.request(path, { ...init, headers }, env);
}

describe('admin pesanan di balik Cloudflare Access', () => {
  it('menolak permintaan tanpa JWT valid dengan 401', async () => {
    const response = await app.request('/admin', {}, env);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('memfilter daftar pesanan dan menandai pembayaran manual', async () => {
    database.orders.push(order('order-1'));
    const list = await authorizedRequest('/admin?status=waitlist');
    expect(list.status).toBe(200);
    expect(await list.text()).toContain('Dapur Sari');
    const response = await authorizedRequest('/admin/orders/order-1/paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'amount=49000&method=qris',
    });
    expect(response.status).toBe(303);
    expect(database.orders[0]).toMatchObject({
      status: 'paid',
      price_idr: 49000,
      pay_method: 'qris',
    });
  });

  it('menolak nominal tidak bulat atau metode yang tidak didukung', async () => {
    database.orders.push(order('order-2'));
    const response = await authorizedRequest('/admin/orders/order-2/paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'amount=49.50&method=crypto',
    });
    expect(response.status).toBe(400);
    expect(database.orders[0]?.status).toBe('waitlist');
  });

  it('mengekspor CSV yang aman dibuka dan menghapus data pesanan', async () => {
    database.orders.push(order('order-3', '=HYPERLINK("https://example.com")'));
    const csv = await authorizedRequest('/admin/export.csv');
    expect(csv.headers.get('Content-Type')).toContain('text/csv');
    expect(await csv.text()).toContain('\'=HYPERLINK(""https://example.com"")');
    const deleted = await authorizedRequest('/admin/orders/order-3/delete', {
      method: 'POST',
    });
    expect(deleted.status).toBe(303);
    expect(database.orders).toHaveLength(0);
  });
});
