import { Hono } from 'hono';
import { getMayarInvoice } from '../mayar';
import type { AppEnv } from '../types';
import { completeMayarPayment, findMayarOrder } from './checkout';

export const mayarWebhookRoutes = new Hono<AppEnv>();

function equalSecret(left: string, right: string): boolean {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1)
    difference |=
      (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  return difference === 0;
}

async function eventKey(body: unknown, raw: string): Promise<string> {
  const event = body as Record<string, unknown>;
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
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${String(event.event)}:${identity}`),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function processEvent(
  env: AppEnv['Bindings'],
  body: unknown,
  key: string,
) {
  const order = await findMayarOrder(env, body);
  if (!order?.mayar_invoice_id) return;
  const invoice = await getMayarInvoice(env, order.mayar_invoice_id);
  await completeMayarPayment(env, order, invoice);
  await env.DB.prepare(
    "UPDATE webhook_events SET processed_at = ?, result = 'checked' WHERE event_key = ?",
  )
    .bind(new Date().toISOString(), key)
    .run();
}

mayarWebhookRoutes.post('/webhooks/mayar', async (context) => {
  const providedToken = context.req.query('token') ?? '';
  const expectedToken = context.env.MAYAR_WEBHOOK_TOKEN ?? '';
  if (!expectedToken || !equalSecret(providedToken, expectedToken))
    return context.json(
      { error: { code: 'NOT_FOUND', message: 'Webhook tidak ditemukan.' } },
      404,
    );
  const contentLength = Number(context.req.header('Content-Length') ?? 0);
  if (contentLength > 64 * 1024)
    return context.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Data webhook terlalu besar.',
        },
      },
      413,
    );
  const text = await context.req.text();
  if (new TextEncoder().encode(text).byteLength > 64 * 1024)
    return context.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Data webhook terlalu besar.',
        },
      },
      413,
    );
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return context.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Data webhook tidak valid.',
        },
      },
      400,
    );
  }
  if (
    !body ||
    typeof body !== 'object' ||
    !('event' in body) ||
    typeof body.event !== 'string'
  )
    return context.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Data webhook tidak valid.',
        },
      },
      400,
    );
  if (body.event === 'payment.reminder') return context.body(null, 200);
  if (body.event !== 'payment.received') return context.body(null, 200);

  const key = await eventKey(body, text);
  const data =
    'data' in body && body.data && typeof body.data === 'object'
      ? (body.data as Record<string, unknown>)
      : {};
  const invoiceId =
    typeof data.id === 'string'
      ? data.id
      : typeof data.productId === 'string'
        ? data.productId
        : null;
  const inserted = await context.env.DB.prepare(`
    INSERT OR IGNORE INTO webhook_events
      (id, event_key, invoice_id, event_type, payload_json, received_at)
    VALUES (?, ?, ?, 'payment.received', ?, ?)
  `)
    .bind(crypto.randomUUID(), key, invoiceId, text, new Date().toISOString())
    .run();
  const shouldProcess = inserted.meta.changes
    ? true
    : Boolean(
        (
          await context.env.DB.prepare(
            "UPDATE webhook_events SET result = NULL WHERE event_key = ? AND result = 'retry'",
          )
            .bind(key)
            .run()
        ).meta.changes,
      );
  if (shouldProcess) {
    context.executionCtx.waitUntil(
      processEvent(context.env, body, key).catch(async () => {
        await context.env.DB.prepare(
          "UPDATE webhook_events SET processed_at = ?, result = 'retry' WHERE event_key = ?",
        )
          .bind(new Date().toISOString(), key)
          .run();
      }),
    );
  }
  return context.body(null, 200);
});
