'use server';

import { and, desc, eq } from 'drizzle-orm';
import { checkOrder, currentPrice, isPro } from '@/server/billing';
import { getDb } from '@/server/db';
import { orders } from '@/server/db/schema';
import { mayarConfig } from '@/server/env';
import { consumeRateLimit } from '@/server/rate-limit';
import { getSessionUser } from '@/server/session';

export type CheckoutResult =
  | { ok: true; paymentUrl: string }
  | { ok: false; message: string };

export async function startCheckout(_raw: unknown): Promise<CheckoutResult> {
  return {
    ok: false,
    message: 'Takaran Pro segera hadir. Pembelian belum dibuka.',
  };
}

export interface BillingStatus {
  pro: boolean;
  price: number;
  pendingUrl: string | null;
}

/**
 * Status Pro untuk halaman beli. Bila ada pesanan menunggu, Mayar dicek ulang
 * paling sering sekali per 30 detik, sebagai cadangan bila webhook terlambat.
 */
export async function billingStatus(): Promise<BillingStatus | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const db = await getDb();
  const price = await currentPrice(db);
  if (await isPro(db, user.id)) return { pro: true, price, pendingUrl: null };
  const [pending] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, user.id), eq(orders.status, 'pending')))
    .orderBy(desc(orders.createdAt))
    .limit(1);
  if (!pending) return { pro: false, price, pendingUrl: null };
  const mayar = mayarConfig();
  if (mayar && (await consumeRateLimit(db, `check:${pending.id}`, 1, 30))) {
    try {
      if (await checkOrder(db, mayar, pending))
        return { pro: true, price, pendingUrl: null };
    } catch {
      // Webhook atau pengecekan berikutnya akan mencoba lagi.
    }
  }
  return { pro: false, price, pendingUrl: pending.paymentUrl };
}
