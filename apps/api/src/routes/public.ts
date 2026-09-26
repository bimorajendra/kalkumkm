import { preorderSchema } from '@takaran/schema';
import { Hono } from 'hono';
import { normalizeWhatsApp } from '../lib/phone';
import { consumePreorderRateLimit } from '../lib/rate-limit';
import { verifyTurnstile } from '../lib/turnstile';
import type { AppEnv } from '../types';

export const publicRoutes = new Hono<AppEnv>();

publicRoutes.post('/preorders', async (context) => {
  const length = Number(context.req.header('Content-Length') ?? 0);
  if (length > 8192)
    return context.json(
      { error: { code: 'VALIDATION_FAILED', message: 'Isian terlalu besar.' } },
      413,
    );
  let body: unknown;
  try {
    body = await context.req.json();
  } catch {
    return context.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Format permintaan tidak valid.',
        },
      },
      400,
    );
  }
  const parsed = preorderSchema.safeParse(body);
  if (!parsed.success)
    return context.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Periksa lagi isian daftar tunggu.',
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
          message:
            'Masukkan nomor WhatsApp Indonesia, seperti 0812… atau +62 812… .',
        },
      },
      400,
    );

  const remoteIp = context.req.header('CF-Connecting-IP') ?? 'unknown';
  const allowed = await consumePreorderRateLimit(
    context.env.DB,
    remoteIp,
    context.env.IP_SALT,
  );
  if (!allowed)
    return context.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Batas daftar tunggu tercapai. Coba lagi satu jam lagi.',
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
  ) {
    return context.json(
      {
        error: {
          code: 'TURNSTILE_FAILED',
          message: 'Pemeriksaan keamanan gagal. Muat ulang lalu coba lagi.',
        },
      },
      400,
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await context.env.DB.prepare(`
    INSERT INTO orders (id, business_name, whatsapp, product_type, status, source, consent_at, created_at)
    VALUES (?, ?, ?, ?, 'waitlist', ?, ?, ?)
  `)
    .bind(
      id,
      parsed.data.businessName,
      whatsapp,
      parsed.data.productType,
      parsed.data.source ?? null,
      now,
      now,
    )
    .run();
  return context.json({ data: { id } }, 201);
});
