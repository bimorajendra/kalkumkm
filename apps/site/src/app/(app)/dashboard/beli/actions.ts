'use server';

import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { normalizeWhatsApp } from '@/lib/phone';
import {
  BillingError,
  checkOrder,
  createCheckout,
  currentPrice,
  isPro,
} from '@/server/billing';
import { getDb } from '@/server/db';
import { orders } from '@/server/db/schema';
import { mayarConfig } from '@/server/env';
import { consumeRateLimit } from '@/server/rate-limit';
import { getSessionUser } from '@/server/session';

const checkoutSchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  whatsapp: z.string().trim().min(8).max(32),
  consent: z.literal(true),
});

export type CheckoutResult =
  | { ok: true; paymentUrl: string }
  | { ok: false; message: string };

export async function startCheckout(raw: unknown): Promise<CheckoutResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: 'Masuk dulu untuk membeli Pro.' };
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      message: 'Periksa lagi isian dan centang persetujuan.',
    };
  const whatsapp = normalizeWhatsApp(parsed.data.whatsapp);
  if (!whatsapp)
    return { ok: false, message: 'Masukkan nomor WhatsApp Indonesia.' };
  const mayar = mayarConfig();
  if (!mayar)
    return { ok: false, message: 'Pembayaran belum dibuka. Coba lagi nanti.' };
  const db = await getDb();
  if (!(await consumeRateLimit(db, `checkout:${user.id}`, 5, 3600)))
    return {
      ok: false,
      message: 'Batas checkout tercapai. Coba lagi satu jam lagi.',
    };
  try {
    const result = await createCheckout(db, mayar, user, {
      whatsapp,
      businessName: parsed.data.businessName,
    });
    return { ok: true, paymentUrl: result.paymentUrl };
  } catch (error) {
    if (error instanceof BillingError)
      return { ok: false, message: error.message };
    console.error('checkout gagal');
    return {
      ok: false,
      message: 'Pembayaran belum bisa dibuat. Coba lagi nanti.',
    };
  }
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
