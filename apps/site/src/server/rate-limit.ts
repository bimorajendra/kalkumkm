import { createHash } from 'node:crypto';
import { lt, sql } from 'drizzle-orm';
import type { Db } from './db';
import { rateLimits } from './db/schema';

/** Kunci dari nilai yang tidak boleh disimpan mentah, misalnya alamat IP. */
export function hashKey(salt: string, ...parts: string[]): string {
  return createHash('sha256')
    .update(`${salt}:${parts.join(':')}`)
    .digest('hex');
}

/**
 * Hitung permintaan per jendela waktu tetap di database, jadi tetap benar
 * setelah restart. Mengembalikan false bila batas terlewati.
 */
export async function consumeRateLimit(
  db: Db,
  key: string,
  limit: number,
  windowSeconds: number,
  now = new Date(),
): Promise<boolean> {
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const result = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
      setWhere: sql`${rateLimits.count} < ${limit}`,
    })
    .returning({ count: rateLimits.count });
  if (Math.random() < 0.01)
    await db
      .delete(rateLimits)
      .where(lt(rateLimits.windowStart, new Date(now.getTime() - 86_400_000)));
  return result.length > 0;
}

/** Alamat klien di belakang Caddy. Hanya percaya header dari proxy sendiri. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip') || 'unknown';
}
