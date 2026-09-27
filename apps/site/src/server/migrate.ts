import path from 'node:path';
import { getDb } from './db';

/**
 * Menerapkan migrasi SQL di folder drizzle/ saat server menyala. Aman
 * dijalankan berulang: hanya migrasi yang belum tercatat yang dieksekusi.
 */
export async function runMigrations(): Promise<void> {
  const migrationsFolder = path.join(process.cwd(), 'drizzle');
  const db = await getDb();
  if (process.env.DATABASE_URL?.startsWith('pglite:')) {
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    await migrate(db as never, { migrationsFolder });
  } else {
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    await migrate(db as never, { migrationsFolder });
  }
}
