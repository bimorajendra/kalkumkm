'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { checkOrder, grantPro, markRefunded } from '@/server/billing';
import { getDb } from '@/server/db';
import { orders, user } from '@/server/db/schema';
import { mayarConfig } from '@/server/env';
import { requireAdmin } from '@/server/session';

/*
 * Setiap aksi memeriksa admin sendiri: aksi server adalah endpoint publik
 * yang bisa dipanggil tanpa membuka halamannya.
 */

export async function checkMayarAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('orderId') ?? '');
  const mayar = mayarConfig();
  if (!mayar) return;
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (order) await checkOrder(db, mayar, order).catch(() => false);
  revalidatePath('/admin');
}

export async function grantProAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  if (!email) return;
  const db = await getDb();
  const [target] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email));
  if (target) await grantPro(db, target.id);
  revalidatePath('/admin');
}

export async function refundAction(formData: FormData) {
  await requireAdmin();
  await markRefunded(await getDb(), String(formData.get('orderId') ?? ''));
  revalidatePath('/admin');
}
