import { checkoutSchema, PRICING } from '@takaran/schema';
import { Hono } from 'hono';
import type { OrderRow } from '../db/schema';
import { normalizeWhatsApp } from '../lib/phone';
import { consumePreorderRateLimit } from '../lib/rate-limit';
import { verifyTurnstile } from '../lib/turnstile';
import { issueLicense } from '../license';
import { getMayarInvoice, type MayarInvoice } from '../mayar';
import type { AppEnv } from '../types';

export const checkoutRoutes = new Hono<AppEnv>();

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function token(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function matchesToken(candidate: string, expectedHex: string) {
  const actual = await sha256(candidate);
  let difference = actual.length ^ expectedHex.length;
  const length = Math.max(actual.length, expectedHex.length);
  for (let index = 0; index < length; index += 1)
    difference |=
      (actual.charCodeAt(index) || 0) ^ (expectedHex.charCodeAt(index) || 0);
  return difference === 0;
}

export async function completeMayarPayment(
  env: AppEnv['Bindings'],
  order: OrderRow,
  invoice: MayarInvoice,
): Promise<boolean> {
  if (
    invoice.status.toLowerCase() !== 'paid' ||
    invoice.amount !== order.price_idr ||
    invoice.id !== order.mayar_invoice_id ||
    !invoice.customer?.email ||
    invoice.customer.email.toLowerCase() !== order.email?.toLowerCase()
  )
    return false;
  if (!env.LICENSE_PRIVATE_KEY || !order.price_idr) return false;

  const { payload, code } = await issueLicense(
    order.business_name,
    env.LICENSE_PRIVATE_KEY,
  );
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE orders SET status = 'paid', pay_method = 'mayar', paid_at = COALESCE(paid_at, ?)
      WHERE id = ? AND status = 'checkout' AND price_idr = ?
    `).bind(now, order.id, invoice.amount),
    env.DB.prepare(`
      INSERT INTO licenses (id, order_id, plan, issued_at, license_code)
      SELECT ?, ?, 'pro', ?, ? WHERE EXISTS (
        SELECT 1 FROM orders WHERE id = ? AND status = 'paid' AND price_idr = ?
      ) AND NOT EXISTS (SELECT 1 FROM licenses WHERE order_id = ?)
    `).bind(
      payload.id,
      order.id,
      now,
      code,
      order.id,
      invoice.amount,
      order.id,
    ),
    env.DB.prepare(`
      UPDATE orders SET status = 'licensed', licensed_at = COALESCE(licensed_at, ?),
        terminal_at = COALESCE(terminal_at, ?)
      WHERE id = ? AND status = 'paid' AND EXISTS (
        SELECT 1 FROM licenses WHERE order_id = ?
      )
    `).bind(now, now, order.id, order.id),
  ]);
  return true;
}

export async function findMayarOrder(
  env: AppEnv['Bindings'],
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
    const order = await env.DB.prepare(`
      SELECT * FROM orders WHERE mayar_invoice_id = ?
        AND status IN ('checkout', 'paid') LIMIT 1
    `)
      .bind(id)
      .first<OrderRow>();
    if (order) return order;
  }
  const orderId =
    data.extraData &&
    typeof data.extraData === 'object' &&
    'orderId' in data.extraData &&
    typeof data.extraData.orderId === 'string'
      ? data.extraData.orderId
      : null;
  if (orderId) {
    const order = await env.DB.prepare(`
      SELECT * FROM orders WHERE id = ? AND status IN ('checkout', 'paid')
    `)
      .bind(orderId)
      .first<OrderRow>();
    if (order) return order;
  }
  const email = data.customerEmail;
  if (typeof email !== 'string' || !email.includes('@')) return null;
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { results = [] } = await env.DB.prepare(`
    SELECT * FROM orders WHERE lower(email) = lower(?) AND status IN ('checkout', 'paid')
      AND created_at >= ? ORDER BY created_at DESC LIMIT 2
  `)
    .bind(email, cutoff)
    .all<OrderRow>();
  return results.length === 1 ? (results[0] ?? null) : null;
}

export async function checkMayarOrder(
  env: AppEnv['Bindings'],
  order: OrderRow,
): Promise<boolean> {
  if (!order.mayar_invoice_id) return false;
  const invoice = await getMayarInvoice(env, order.mayar_invoice_id);
  if (
    ['closed', 'expired', 'cancelled'].includes(invoice.status.toLowerCase())
  ) {
    const now = new Date().toISOString();
    await env.DB.prepare(`
      UPDATE orders SET status = 'cancelled', terminal_at = ?
      WHERE id = ? AND status = 'checkout'
    `)
      .bind(now, order.id)
      .run();
    return false;
  }
  return completeMayarPayment(env, order, invoice);
}

checkoutRoutes.post('/checkout', async (context) => {
  context.header('Cache-Control', 'no-store');
  const length = Number(context.req.header('Content-Length') ?? 0);
  if (length > 8192)
    return context.json(
      { error: { code: 'VALIDATION_FAILED', message: 'Isian terlalu besar.' } },
      413,
    );
  let body: unknown;
  try {
    const raw = await context.req.text();
    if (new TextEncoder().encode(raw).byteLength > 8192)
      return context.json(
        {
          error: { code: 'VALIDATION_FAILED', message: 'Isian terlalu besar.' },
        },
        413,
      );
    body = JSON.parse(raw);
  } catch {
    return context.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Format isian tidak valid.',
        },
      },
      400,
    );
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success)
    return context.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Periksa lagi isian checkout.',
        },
      },
      400,
    );
  const whatsapp = normalizeWhatsApp(parsed.data.whatsapp);
  if (!whatsapp)
    return context.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Masukkan nomor WhatsApp Indonesia.',
        },
      },
      400,
    );

  const remoteIp = context.req.header('CF-Connecting-IP') ?? 'unknown';
  if (
    !(await consumePreorderRateLimit(
      context.env.DB,
      remoteIp,
      context.env.IP_SALT,
    ))
  )
    return context.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Batas checkout tercapai. Coba lagi satu jam lagi.',
        },
      },
      429,
    );
  if (
    !context.env.TURNSTILE_SECRET ||
    !(await verifyTurnstile(
      parsed.data.turnstileToken,
      context.env.TURNSTILE_SECRET,
      remoteIp,
    ))
  )
    return context.json(
      {
        error: {
          code: 'TURNSTILE_FAILED',
          message: 'Pemeriksaan keamanan gagal. Coba lagi.',
        },
      },
      400,
    );

  const founderCount = await context.env.DB.prepare(`
    SELECT COUNT(*) AS count FROM orders
    WHERE price_idr = ? AND status IN ('paid', 'licensed', 'refunded')
  `)
    .bind(PRICING.pro.founderIdr)
    .first<{ count: number }>();
  const amount =
    (founderCount?.count ?? 0) < PRICING.pro.founderLimit
      ? PRICING.pro.founderIdr
      : PRICING.pro.idr;
  const orderId = crypto.randomUUID();
  const claimToken = token();
  const claimTokenHash = await sha256(claimToken);
  const now = new Date().toISOString();
  await context.env.DB.prepare(`
    INSERT INTO orders (id, business_name, customer_name, email, whatsapp, status,
      price_idr, pay_method, claim_token_hash, consent_at, created_at)
    VALUES (?, ?, ?, ?, ?, 'checkout', ?, 'mayar', ?, ?, ?)
  `)
    .bind(
      orderId,
      parsed.data.businessName,
      parsed.data.name,
      parsed.data.email.toLowerCase(),
      whatsapp,
      amount,
      claimTokenHash,
      now,
      now,
    )
    .run();

  try {
    const invoice = await createInvoice(context, {
      ...parsed.data,
      whatsapp,
      orderId,
      amount,
    });
    await context.env.DB.prepare(
      "UPDATE orders SET mayar_invoice_id = ? WHERE id = ? AND status = 'checkout'",
    )
      .bind(invoice.id, orderId)
      .run();
    return context.json(
      {
        data: {
          orderId,
          paymentUrl: invoice.link,
          claimToken,
          amountIdr: amount,
        },
      },
      201,
    );
  } catch {
    await context.env.DB.prepare(
      "UPDATE orders SET status = 'cancelled', terminal_at = ? WHERE id = ? AND status = 'checkout'",
    )
      .bind(new Date().toISOString(), orderId)
      .run();
    return context.json(
      {
        error: {
          code: 'CHECKOUT_UNAVAILABLE',
          message: 'Pembayaran belum bisa dibuat. Coba lagi nanti.',
        },
      },
      503,
    );
  }
});

import type { Context } from 'hono';
import { createMayarInvoice } from '../mayar';

async function createInvoice(
  context: Context<AppEnv>,
  input: {
    name: string;
    email: string;
    whatsapp: string;
    businessName: string;
    orderId: string;
    amount: number;
  },
) {
  return createMayarInvoice(context.env, {
    name: input.name,
    email: input.email,
    mobile: input.whatsapp,
    businessName: input.businessName,
    orderId: input.orderId,
    amount: input.amount,
  });
}

checkoutRoutes.get('/checkout/:orderId/license', async (context) => {
  context.header('Cache-Control', 'no-store');
  const orderId = context.req.param('orderId');
  const claimToken = context.req.header('X-Claim-Token') ?? '';
  if (
    !/^[0-9a-f-]{36}$/i.test(orderId) ||
    !/^[A-Za-z0-9_-]{43}$/.test(claimToken)
  )
    return context.json(
      { error: { code: 'NOT_FOUND', message: 'Pesanan tidak ditemukan.' } },
      404,
    );
  const order = await context.env.DB.prepare(
    'SELECT * FROM orders WHERE id = ?',
  )
    .bind(orderId)
    .first<OrderRow>();
  if (
    !order?.claim_token_hash ||
    !(await matchesToken(claimToken, order.claim_token_hash))
  )
    return context.json(
      { error: { code: 'NOT_FOUND', message: 'Pesanan tidak ditemukan.' } },
      404,
    );
  const licensed = await context.env.DB.prepare(
    'SELECT license_code FROM licenses WHERE order_id = ?',
  )
    .bind(order.id)
    .first<{ license_code: string | null }>();
  if (licensed?.license_code)
    return context.json({
      data: { status: 'licensed', code: licensed.license_code },
    });
  if (order.status !== 'checkout' || !order.mayar_invoice_id)
    return context.json({ data: { status: order.status } }, 202);

  const now = new Date();
  const cutoff = new Date(now.getTime() - 30_000).toISOString();
  const reserved = await context.env.DB.prepare(`
    UPDATE orders SET mayar_checked_at = ? WHERE id = ? AND status = 'checkout'
      AND (mayar_checked_at IS NULL OR mayar_checked_at <= ?)
  `)
    .bind(now.toISOString(), order.id, cutoff)
    .run();
  if (reserved.meta.changes) {
    try {
      await checkMayarOrder(context.env, order);
    } catch {
      // A later poll or the webhook can safely retry invoice verification.
    }
  }
  const result = await context.env.DB.prepare(
    'SELECT license_code FROM licenses WHERE order_id = ?',
  )
    .bind(order.id)
    .first<{ license_code: string | null }>();
  if (result?.license_code)
    return context.json({
      data: { status: 'licensed', code: result.license_code },
    });
  return context.json({ data: { status: 'pending' } }, 202);
});
