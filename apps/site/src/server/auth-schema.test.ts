import { getAuthTables } from 'better-auth/db';
import { getTableColumns } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import * as schema from './db/schema';

/**
 * Better Auth menulis ke tabel lewat nama field. Bila versinya menambah field
 * wajib dan skema kita tertinggal, login gagal saat runtime; test ini
 * memindahkan kegagalan itu ke CI.
 */
describe('skema autentikasi', () => {
  const tables = getAuthTables({
    socialProviders: { google: { clientId: 'x', clientSecret: 'y' } },
  });

  it('mencakup semua tabel yang dipakai Better Auth', () => {
    for (const [key, table] of Object.entries(tables)) {
      expect(
        (schema as Record<string, unknown>)[table.modelName],
        `tabel ${key} (${table.modelName})`,
      ).toBeDefined();
    }
  });

  it('memiliki semua field yang dibutuhkan', () => {
    for (const table of Object.values(tables)) {
      const columns = Object.keys(
        getTableColumns(
          (schema as unknown as Record<string, PgTable>)[
            table.modelName
          ] as PgTable,
        ),
      );
      for (const field of Object.keys(table.fields))
        expect(columns, `${table.modelName}.${field}`).toContain(field);
    }
  });
});
