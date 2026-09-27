import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { Db } from './db';
import * as schema from './db/schema';

/** Postgres di dalam proses, dengan migrasi sungguhan. Hanya untuk test. */
export async function createTestDb(): Promise<Db> {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, {
    migrationsFolder: path.join(import.meta.dirname, '../../drizzle'),
  });
  return db as unknown as Db;
}

export async function createUser(
  db: Db,
  id: string,
  email = `${id}@contoh.id`,
) {
  await db.insert(schema.user).values({ id, name: id, email });
}

export async function makePro(db: Db, userId: string) {
  await db
    .insert(schema.entitlements)
    .values({ userId, plan: 'pro', source: 'admin' });
}
