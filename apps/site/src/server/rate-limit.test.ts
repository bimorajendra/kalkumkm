import { describe, expect, it } from 'vitest';
import { rateLimits } from './db/schema';
import { clientIp, consumeRateLimit, hashKey } from './rate-limit';
import { createTestDb } from './test-db';

describe('batas percobaan OAuth berdasarkan IP', () => {
  it('menolak percobaan ke-31 dan tidak menyimpan alamat IP mentah', async () => {
    const db = await createTestDb();
    const ip = '203.0.113.42';
    const headers = new Headers({ 'x-forwarded-for': ip });
    const key = hashKey(
      'salt-untuk-pengujian',
      'google-sign-in',
      clientIp(headers),
    );
    const now = new Date('2026-10-01T05:00:00.000Z');

    for (let attempt = 1; attempt <= 30; attempt += 1)
      expect(await consumeRateLimit(db, `auth:${key}`, 30, 60, now)).toBe(true);
    expect(await consumeRateLimit(db, `auth:${key}`, 30, 60, now)).toBe(false);

    const rows = await db.select().from(rateLimits);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.key).toBe(`auth:${key}`);
    expect(rows[0]?.key).not.toContain(ip);
    expect(
      await consumeRateLimit(
        db,
        `auth:${key}`,
        30,
        60,
        new Date(now.getTime() + 60_000),
      ),
    ).toBe(true);
  }, 30_000);

  it('memisahkan batas untuk alamat IP yang berbeda', async () => {
    const db = await createTestDb();
    const now = new Date('2026-10-01T05:00:00.000Z');
    const keyFor = (ip: string) =>
      hashKey(
        'salt-untuk-pengujian',
        'google-sign-in',
        clientIp(new Headers({ 'x-forwarded-for': ip })),
      );

    for (let attempt = 0; attempt < 30; attempt += 1)
      expect(
        await consumeRateLimit(
          db,
          `auth:${keyFor('203.0.113.42')}`,
          30,
          60,
          now,
        ),
      ).toBe(true);
    expect(
      await consumeRateLimit(db, `auth:${keyFor('203.0.113.43')}`, 30, 60, now),
    ).toBe(true);
  }, 30_000);
});
