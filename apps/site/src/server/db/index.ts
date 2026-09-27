import { mkdirSync } from 'node:fs';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import * as schema from './schema';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
export { schema };

const globalForDb = globalThis as unknown as { takaranDb?: Db };

/**
 * DATABASE_URL berbentuk postgres://... untuk server sungguhan. Untuk
 * pengembangan tanpa Postgres, `pglite:./.data/dev` menjalankan Postgres
 * di dalam proses (hanya untuk lokal, ditolak di produksi).
 */
async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL belum diatur.');
  if (url.startsWith('pglite:')) {
    if (process.env.NODE_ENV === 'production')
      throw new Error('PGlite tidak boleh dipakai di produksi.');
    const { PGlite } = await import('@electric-sql/pglite');
    const { drizzle } = await import('drizzle-orm/pglite');
    const dir = url.slice('pglite:'.length);
    mkdirSync(dir, { recursive: true });
    const client = new PGlite(dir);
    return drizzle(client, { schema }) as unknown as Db;
  }
  const pool = new Pool({ connectionString: url, max: 10 });
  return drizzlePg(pool, { schema }) as unknown as Db;
}

let pending: Promise<Db> | undefined;

export function getDb(): Promise<Db> {
  if (globalForDb.takaranDb) return Promise.resolve(globalForDb.takaranDb);
  pending ??= connect().then((db) => {
    globalForDb.takaranDb = db;
    return db;
  });
  return pending;
}
