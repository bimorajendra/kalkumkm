'use server';

import {
  DomainError,
  type DomainErrorCode,
  type Snapshot,
} from '@/domain/types';
import { getDb } from '@/server/db';
import { consumeRateLimit } from '@/server/rate-limit';
import { getSessionUser } from '@/server/session';
import { runCommand } from '@/server/store';

export type ActionResult =
  | { ok: true; snapshot: Snapshot }
  | {
      ok: false;
      code: DomainErrorCode | 'UNAUTHENTICATED' | 'RATE_LIMITED' | 'SERVER';
      message: string;
      trigger?: 'recipe' | 'channel' | 'sub_recipe' | 'quote';
    };

/**
 * Satu pintu untuk semua perubahan data. Identitas selalu dari sesi di server,
 * tidak pernah dari isi permintaan.
 */
export async function dispatch(command: unknown): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user)
    return {
      ok: false,
      code: 'UNAUTHENTICATED',
      message: 'Sesimu berakhir. Masuk lagi untuk melanjutkan.',
    };
  try {
    const db = await getDb();
    if (!(await consumeRateLimit(db, `cmd:${user.id}`, 120, 60)))
      return {
        ok: false,
        code: 'RATE_LIMITED',
        message: 'Terlalu banyak perubahan sekaligus. Tunggu sebentar.',
      };
    return { ok: true, snapshot: await runCommand(db, user.id, command) };
  } catch (error) {
    if (error instanceof DomainError)
      return {
        ok: false,
        code: error.code,
        message: error.message,
        ...(error.trigger ? { trigger: error.trigger } : {}),
      };
    // Jangan mencatat isi perintah: bisa memuat nama bahan atau harga.
    console.error('dispatch gagal', error instanceof Error ? error.name : '');
    return {
      ok: false,
      code: 'SERVER',
      message: 'Terjadi masalah di server. Coba lagi sebentar lagi.',
    };
  }
}
