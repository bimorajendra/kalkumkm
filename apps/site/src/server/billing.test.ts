import { PRICING } from '@takaran/schema';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  BillingError,
  checkOrder,
  completePayment,
  createCheckout,
  currentPrice,
  handleMayarEvent,
  isPro,
  markRefunded,
} from './billing';
import type { Db } from './db';
import { mayarEvents, orders } from './db/schema';
import type { MayarConfig } from './mayar';
import { createTestDb, createUser } from './test-db';

let db: Db;

beforeAll(async () => {
  db = await createTestDb();
  for (const id of ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'])
    await createUser(db, id);
}, 30_000);

interface FakeInvoice {
  status: string;
  amount: number;
  email: string;
}

let counter = 0;

/** Mayar palsu: menyimpan invoice yang dibuat dan status yang bisa diatur test. */
function fakeMayar(options: { fail?: boolean } = {}) {
  const invoices = new Map<string, FakeInvoice>();
  const fakeFetch: typeof fetch = async (input, init) => {
    if (options.fail) return new Response('gagal', { status: 500 });
    const url = String(input);
    if (url.endsWith('/invoices/create')) {
      const body = JSON.parse(String(init?.body));
      counter += 1;
      const id = `inv-${counter}`;
      invoices.set(id, {
        status: 'unpaid',
        amount: body.items[0].rate,
        email: body.email,
      });
      return Response.json({
        statusCode: 200,
        data: {
          id,
          link: `https://takaran.myr.id/invoices/${id}`,
          expiredAt: Date.now() + 1000,
        },
      });
    }
    const id = decodeURIComponent(url.split('/invoices/')[1] ?? '');
    const invoice = invoices.get(id);
    if (!invoice) return new Response('tidak ada', { status: 404 });
    return Response.json({
      statusCode: 200,
      data: {
        id,
        amount: invoice.amount,
        status: invoice.status,
        customer: { email: invoice.email },
      },
    });
  };
  const config: MayarConfig = {
    apiKey: 'kunci',
    baseUrl: 'https://api.mayar.io/hl/v2',
    fetch: fakeFetch,
  };
  return { config, invoices };
}

const account = (id: string) => ({
  id,
  name: id,
  email: `${id}@contoh.id`,
});
const input = { whatsapp: '628123456789', businessName: 'Kue Bu Rina' };

async function order(id: string) {
  const [row] = await db.select().from(orders).where(eq(orders.id, id));
  if (!row) throw new Error('pesanan tidak ada');
  return row;
}

describe('checkout', () => {
  it('membuat pesanan dengan harga pendiri dari server', async () => {
    const mayar = fakeMayar();
    const result = await createCheckout(db, mayar.config, account('u1'), input);
    expect(result.amountIdr).toBe(PRICING.pro.founderIdr);
    expect(result.paymentUrl).toContain('myr.id');
    expect(await order(result.orderId)).toMatchObject({
      status: 'pending',
      priceIdr: PRICING.pro.founderIdr,
    });
  });

  it('membatalkan pesanan bila Mayar gagal', async () => {
    const mayar = fakeMayar({ fail: true });
    await expect(
      createCheckout(db, mayar.config, account('u2'), input),
    ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    const rows = await db.select().from(orders).where(eq(orders.userId, 'u2'));
    expect(rows.map((row) => row.status)).toEqual(['cancelled']);
    expect(await isPro(db, 'u2')).toBe(false);
  });

  it('memakai harga normal setelah 100 pembeli pertama', async () => {
    const founder = PRICING.pro.founderIdr;
    for (let index = 0; index < PRICING.pro.founderLimit; index += 1)
      await db.insert(orders).values({
        id: `f-${index}`,
        userId: 'u6',
        status: 'paid',
        priceIdr: founder,
        whatsapp: '628',
        businessName: 'x',
        consentAt: new Date(),
      });
    expect(await currentPrice(db)).toBe(PRICING.pro.idr);
    await db.delete(orders).where(eq(orders.userId, 'u6'));
    expect(await currentPrice(db)).toBe(founder);
  });
});

describe('verifikasi pembayaran', () => {
  it('belum dibayar: tidak membuka Pro', async () => {
    const mayar = fakeMayar();
    const { orderId } = await createCheckout(
      db,
      mayar.config,
      account('u3'),
      input,
    );
    expect(await checkOrder(db, mayar.config, await order(orderId))).toBe(
      false,
    );
    expect(await isPro(db, 'u3')).toBe(false);
  });

  it('dibayar dengan nominal dan email cocok: membuka Pro sekali', async () => {
    const mayar = fakeMayar();
    const { orderId } = await createCheckout(
      db,
      mayar.config,
      account('u4'),
      input,
    );
    for (const invoice of mayar.invoices.values()) invoice.status = 'paid';
    expect(await checkOrder(db, mayar.config, await order(orderId))).toBe(true);
    expect(await checkOrder(db, mayar.config, await order(orderId))).toBe(true);
    expect(await isPro(db, 'u4')).toBe(true);
    expect((await order(orderId)).status).toBe('paid');
  });

  it('nominal tidak cocok atau email berbeda: tidak membuka Pro', async () => {
    const mayar = fakeMayar();
    const { orderId } = await createCheckout(
      db,
      mayar.config,
      account('u5'),
      input,
    );
    const invoice = [...mayar.invoices.values()][0];
    if (!invoice) throw new Error('invoice tidak ada');
    invoice.status = 'paid';
    invoice.amount = 1;
    expect(await checkOrder(db, mayar.config, await order(orderId))).toBe(
      false,
    );
    invoice.amount = PRICING.pro.founderIdr;
    invoice.email = 'orang-lain@contoh.id';
    expect(await checkOrder(db, mayar.config, await order(orderId))).toBe(
      false,
    );
    expect(await isPro(db, 'u5')).toBe(false);
  });

  it('invoice kedaluwarsa membatalkan pesanan', async () => {
    const mayar = fakeMayar();
    const other = await createCheckout(db, mayar.config, account('u3'), input);
    for (const invoice of mayar.invoices.values()) invoice.status = 'expired';
    expect(await checkOrder(db, mayar.config, await order(other.orderId))).toBe(
      false,
    );
    expect((await order(other.orderId)).status).toBe('cancelled');
  });

  it('tidak membuka Pro bila pesanan berubah sebelum konfirmasi selesai', async () => {
    const mayar = fakeMayar();
    const { orderId } = await createCheckout(
      db,
      mayar.config,
      account('u3'),
      input,
    );
    const staleOrder = await order(orderId);
    const invoice = [...mayar.invoices.values()][0];
    if (!invoice) throw new Error('invoice tidak ada');
    invoice.status = 'paid';
    await db
      .update(orders)
      .set({ status: 'cancelled' })
      .where(eq(orders.id, orderId));

    expect(
      await completePayment(db, staleOrder, {
        id: staleOrder.mayarInvoiceId ?? '',
        amount: staleOrder.priceIdr,
        status: invoice.status,
        customer: { email: invoice.email },
      }),
    ).toBe(false);
    expect(await isPro(db, 'u3')).toBe(false);
    expect((await order(orderId)).status).toBe('cancelled');
  });
});

describe('webhook', () => {
  it('idempoten dan hanya percaya hasil konfirmasi ke Mayar', async () => {
    const mayar = fakeMayar();
    await db.delete(orders).where(eq(orders.userId, 'u1'));
    const { orderId } = await createCheckout(
      db,
      mayar.config,
      account('u1'),
      input,
    );
    const invoiceId = (await order(orderId)).mayarInvoiceId;
    const event = {
      event: 'payment.received',
      data: { id: invoiceId, transactionId: 'trx-1' },
    };
    // Webhook datang, tetapi Mayar bilang belum dibayar.
    expect(
      await handleMayarEvent(db, mayar.config, event, JSON.stringify(event)),
    ).toBe(true);
    expect(await isPro(db, 'u1')).toBe(false);

    for (const invoice of mayar.invoices.values()) invoice.status = 'paid';
    const paidEvent = {
      ...event,
      data: { ...event.data, transactionId: 'trx-2' },
    };
    expect(
      await handleMayarEvent(
        db,
        mayar.config,
        paidEvent,
        JSON.stringify(paidEvent),
      ),
    ).toBe(true);
    expect(
      await handleMayarEvent(
        db,
        mayar.config,
        paidEvent,
        JSON.stringify(paidEvent),
      ),
    ).toBe(true);
    expect(await isPro(db, 'u1')).toBe(true);
    const events = await db.select().from(mayarEvents);
    expect(events.filter((row) => row.eventKey.endsWith('trx-2'))).toHaveLength(
      1,
    );
  });

  it('meminta Mayar mengirim ulang bila konfirmasi gagal', async () => {
    const mayar = fakeMayar();
    const { orderId } = await createCheckout(
      db,
      mayar.config,
      account('u2'),
      input,
    );
    const invoiceId = (await order(orderId)).mayarInvoiceId;
    const event = {
      event: 'payment.received',
      data: { id: invoiceId, transactionId: 'trx-9' },
    };
    const broken = fakeMayar({ fail: true });
    expect(
      await handleMayarEvent(db, broken.config, event, JSON.stringify(event)),
    ).toBe(false);
    for (const invoice of mayar.invoices.values()) invoice.status = 'paid';
    expect(
      await handleMayarEvent(db, mayar.config, event, JSON.stringify(event)),
    ).toBe(true);
    expect(await isPro(db, 'u2')).toBe(true);
  });

  it('mengabaikan event untuk pesanan yang tidak dikenal', async () => {
    const mayar = fakeMayar();
    const event = {
      event: 'payment.received',
      data: { id: 'tidak-ada', transactionId: 't' },
    };
    expect(
      await handleMayarEvent(db, mayar.config, event, JSON.stringify(event)),
    ).toBe(true);
  });
});

describe('akun sudah Pro dan refund', () => {
  it('menolak checkout kedua', async () => {
    const mayar = fakeMayar();
    await expect(
      createCheckout(db, mayar.config, account('u4'), input),
    ).rejects.toBeInstanceOf(BillingError);
  });

  it('refund mencabut Pro', async () => {
    const [paid] = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, 'u4'));
    await markRefunded(db, paid?.id ?? '');
    expect(await isPro(db, 'u4')).toBe(false);
  });
});
