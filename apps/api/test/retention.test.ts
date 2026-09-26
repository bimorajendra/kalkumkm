import { describe, expect, it } from 'vitest';
import { cleanupRetention } from '../src/index';
import { FakeD1 } from './fake-d1';

function order(id: string, status: 'waitlist' | 'paid', created: string) {
  return {
    id,
    business_name: 'Dapur Sari',
    customer_name: null,
    email: null,
    whatsapp: '6281234567890',
    product_type: 'kue',
    status,
    price_idr: null,
    pay_method: null,
    mayar_invoice_id: null,
    claim_token_hash: null,
    mayar_checked_at: null,
    paid_at: null,
    licensed_at: null,
    terminal_at: null,
    source: null,
    consent_at: created,
    created_at: created,
  };
}

describe('retensi daftar tunggu', () => {
  it('menghapus waitlist lebih dari 12 bulan dan rate limit lebih dari 2 hari', async () => {
    const db = new FakeD1();
    const now = new Date('2026-09-26T00:00:00.000Z');
    const old = new Date(now);
    old.setUTCMonth(old.getUTCMonth() - 13);
    const recent = new Date(now);
    recent.setUTCMonth(recent.getUTCMonth() - 11);
    db.orders.push(order('old-waitlist', 'waitlist', old.toISOString()));
    db.orders.push(order('recent-waitlist', 'waitlist', recent.toISOString()));
    db.orders.push(order('old-paid', 'paid', old.toISOString()));
    await cleanupRetention(db as unknown as D1Database, now);
    expect(db.orders.map((item) => item.id)).toEqual([
      'recent-waitlist',
      'old-paid',
    ]);
    expect(db.rateLimitDeletes).toBe(1);
  });
});
