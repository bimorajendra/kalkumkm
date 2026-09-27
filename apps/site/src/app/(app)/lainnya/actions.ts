'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/server/auth';
import { getDb } from '@/server/db';
import { user } from '@/server/db/schema';
import { getSessionUser } from '@/server/session';

/**
 * Hapus akun dan semua datanya. Baris di tabel lain ikut terhapus lewat
 * ON DELETE CASCADE. Frasa konfirmasi dicek di server, bukan hanya di layar.
 */
export async function deleteAccount(
  confirmation: string,
): Promise<{ ok: false; message: string } | never> {
  const current = await getSessionUser();
  if (!current) redirect('/masuk');
  if (confirmation.trim().toLowerCase() !== 'hapus akun saya')
    return { ok: false, message: 'Ketik “hapus akun saya” untuk melanjutkan.' };
  const db = await getDb();
  await db.delete(user).where(eq(user.id, current.id));
  try {
    await (await getAuth()).api.signOut({ headers: await headers() });
  } catch {
    // Sesi ikut terhapus bersama akun.
  }
  redirect('/?akun=dihapus');
}
