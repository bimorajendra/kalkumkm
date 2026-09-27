import { randomUUID } from 'node:crypto';
import { PRICING } from '@takaran/schema';
import { and, count, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from './db';
import { entitlements, mayarEvents, orders, user } from './db/schema';
import {
  createMayarInvoice,
  getMayarInvoice,
  type MayarConfig,
  type MayarInvoice,
} from './mayar';

export type OrderRow = typeof orders.$inferSelect;

export class BillingError extends Error {
  constructor(
    readonly code: 'ALREADY_PRO' | 'UNAVAILABLE' | 'NOT_FOUND',
    message: string,
  ) {
    super(message);
    this.name = 'BillingError';
  }
}

/** Harga pendiri berlaku untuk 100 pembeli pertama. Harga hanya dari server. */
export async function currentPrice(db: Db): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(orders)
    .where(
      and(
        eq(orders.priceIdr, PRICING.pro.founderIdr),
        inArray(orders.status, ['paid', 'refunded']),
      ),
    );
  return (row?.total ?? 0) < PRICING.pro.founderLimit
    ? PRICING.pro.founderIdr
    : PRICING.pro.idr;
}

export async function isPro(db: Db, userId: string): Promise<boolean> {
  const rows = await db
    .select({ plan: entitlements.plan })
    .from(entitlements)
    .where(eq(entitlements.userId, userId));
  return rows.length > 0;
}

export async function createCheckout(
  db: Db,
  mayar: MayarConfig,
  account: { id: string; name: string; email: string },
  input: { whatsapp: string; businessName: string },
  now = new Date(),
): Promise<{ orderId: string; paymentUrl: string; amountIdr: number }> {
  if (await isPro(db, account.id))
    throw new BillingError('ALREADY_PRO', 'Akunmu sudah Pro.');
  const amount = await currentPrice(db);
  const orderId = randomUUID();
  await db.insert(orders).values({
    id: orderId,
    userId: account.id,
    status: 'pending',
    priceIdr: amount,
    whatsapp: input.whatsapp,
    businessName: input.businessName,
    consentAt: now,
    createdAt: now,
  });
  try {
    const invoice = await createMayarInvoice(mayar, {
      name: account.name,
      email: account.email,
      mobile: input.whatsapp,
      orderId,
      amount,
    });
    await db
      .update(orders)
      .set({ mayarInvoiceId: invoice.id, paymentUrl: invoice.link })
      .where(and(eq(orders.id, orderId), eq(orders.status, 'pending')));
    return { orderId, paymentUrl: invoice.link, amountIdr: amount };
  } catch {
    await db
      .update(orders)
      .set({ status: 'cancelled' })
      .where(and(eq(orders.id, orderId), eq(orders.status, 'pending')));
    throw new BillingError(
      'UNAVAILABLE',
      'Pembayaran belum bisa dibuat. Coba lagi nanti.',
    );
  }
}

/**
 * Menandai pesanan lunas dan membuka Pro hanya bila invoice di Mayar sudah
 * dibayar dengan nominal, id, dan email yang cocok dengan pesanan.
 */
export async function completePayment(
  db: Db,
  order: OrderRow,
  invoice: MayarInvoice,
  now = new Date(),
): Promise<boolean> {
  const [owner] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, order.userId));
  if (
    invoice.status.toLowerCase() !== 'paid' ||
    invoice.amount !== order.priceIdr ||
    invoice.id !== order.mayarInvoiceId ||
    !owner ||
    invoice.customer?.email?.toLowerCase() !== owner.email.toLowerCase()
  )
    return false;
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${order.userId}))`,
    );
    await tx
      .update(orders)
      .set({ status: 'paid', paidAt: now })
      .where(and(eq(orders.id, order.id), eq(orders.status, 'pending')));
    await tx
      .insert(entitlements)
      .values({
        userId: order.userId,
        plan: 'pro',
        source: 'mayar',
        orderId: order.id,
        grantedAt: now,
      })
      .onConflictDoNothing();
  });
  return true;
}

/** Cek ulang ke Mayar. Pesanan yang kedaluwarsa atau ditutup dibatalkan. */
export async function checkOrder(
  db: Db,
  mayar: MayarConfig,
  order: OrderRow,
): Promise<boolean> {
  if (!order.mayarInvoiceId) return false;
  const invoice = await getMayarInvoice(mayar, order.mayarInvoiceId);
  if (
    ['closed', 'expired', 'cancelled'].includes(invoice.status.toLowerCase())
  ) {
    await db
      .update(orders)
      .set({ status: 'cancelled' })
      .where(and(eq(orders.id, order.id), eq(orders.status, 'pending')));
    return false;
  }
  return completePayment(db, order, invoice);
}

/** Mencari pesanan dari isi webhook. Kecocokan ambigu tidak pernah menerbitkan Pro. */
export async function findOrderForEvent(
  db: Db,
  event: unknown,
): Promise<OrderRow | null> {
  if (!event || typeof event !== 'object') return null;
  const root = event as Record<string, unknown>;
  const data =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : {};
  const ids = [root.paymentLinkId, data.id, data.productId].filter(
    (value): value is string =>
      typeof value === 'string' && value.length <= 128,
  );
  for (const id of ids) {
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.mayarInvoiceId, id),
          inArray(orders.status, ['pending', 'paid']),
        ),
      );
    if (order) return order;
  }
  const extra = data.extraData;
  const orderId =
    extra && typeof extra === 'object' && 'orderId' in extra
      ? (extra as { orderId: unknown }).orderId
      : null;
  if (typeof orderId === 'string' && orderId.length <= 64) {
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, orderId),
          inArray(orders.status, ['pending', 'paid']),
        ),
      );
    if (order) return order;
  }
  return null;
}

export function eventKey(event: Record<string, unknown>, raw: string): string {
  const data =
    event.data && typeof event.data === 'object'
      ? (event.data as Record<string, unknown>)
      : {};
  const identity =
    typeof data.transactionId === 'string'
      ? data.transactionId
      : typeof data.id === 'string'
        ? data.id
        : typeof data.productId === 'string'
          ? data.productId
          : raw;
  return `${String(event.event)}:${identity}`;
}

/**
 * Memproses webhook secara idempoten. Mengembalikan false bila harus dicoba
 * ulang oleh Mayar (misalnya Mayar sedang tidak bisa dihubungi).
 */
export async function handleMayarEvent(
  db: Db,
  mayar: MayarConfig,
  event: Record<string, unknown>,
  raw: string,
): Promise<boolean> {
  const key = eventKey(event, raw);
  const data =
    event.data && typeof event.data === 'object'
      ? (event.data as Record<string, unknown>)
      : {};
  const invoiceId = typeof data.id === 'string' ? data.id : null;
  const inserted = await db
    .insert(mayarEvents)
    .values({ eventKey: key, invoiceId })
    .onConflictDoNothing()
    .returning({ key: mayarEvents.eventKey });
  if (inserted.length === 0) {
    const [existing] = await db
      .select({ result: mayarEvents.result })
      .from(mayarEvents)
      .where(eq(mayarEvents.eventKey, key));
    if (existing?.result === 'ok') return true;
  }
  try {
    const order = await findOrderForEvent(db, event);
    if (order?.mayarInvoiceId) {
      const invoice = await getMayarInvoice(mayar, order.mayarInvoiceId);
      await completePayment(db, order, invoice);
    }
    await db
      .update(mayarEvents)
      .set({ processedAt: new Date(), result: 'ok' })
      .where(eq(mayarEvents.eventKey, key));
    return true;
  } catch {
    await db
      .update(mayarEvents)
      .set({ processedAt: new Date(), result: 'retry' })
      .where(eq(mayarEvents.eventKey, key));
    return false;
  }
}

/** Admin: cabut Pro setelah refund manual di Mayar. */
export async function markRefunded(db: Db, orderId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));
    if (!order) throw new BillingError('NOT_FOUND', 'Pesanan tidak ditemukan.');
    await tx
      .update(orders)
      .set({ status: 'refunded' })
      .where(eq(orders.id, orderId));
    await tx
      .delete(entitlements)
      .where(
        and(
          eq(entitlements.userId, order.userId),
          eq(entitlements.orderId, orderId),
        ),
      );
  });
}

/** Admin: beri Pro langsung, misalnya untuk pembayaran manual. */
export async function grantPro(db: Db, userId: string): Promise<void> {
  await db
    .insert(entitlements)
    .values({ userId, plan: 'pro', source: 'admin' })
    .onConflictDoNothing();
}
