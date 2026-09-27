import { createHash, timingSafeEqual } from 'node:crypto';
import { handleMayarEvent } from '@/server/billing';
import { getDb } from '@/server/db';
import { getEnv, mayarConfig } from '@/server/env';

const MAX_BYTES = 64 * 1024;

function sameSecret(candidate: string, expected: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(candidate), digest(expected));
}

const json = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

/**
 * Webhook Mayar. Token di URL hanya membuktikan pengirim; status bayar tetap
 * dikonfirmasi ke API Mayar sebelum Pro dibuka. Membalas 5xx bila konfirmasi
 * gagal supaya Mayar mengirim ulang.
 */
export async function POST(request: Request) {
  const expected = getEnv().MAYAR_WEBHOOK_TOKEN;
  const provided = new URL(request.url).searchParams.get('token') ?? '';
  const mayar = mayarConfig();
  if (!expected || !mayar || !sameSecret(provided, expected))
    return json(404, 'NOT_FOUND', 'Webhook tidak ditemukan.');

  const text = await request.text();
  if (Buffer.byteLength(text) > MAX_BYTES)
    return json(413, 'TOO_LARGE', 'Data webhook terlalu besar.');
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json(400, 'INVALID', 'Data webhook tidak valid.');
  }
  if (
    !body ||
    typeof body !== 'object' ||
    !('event' in body) ||
    typeof body.event !== 'string'
  )
    return json(400, 'INVALID', 'Data webhook tidak valid.');
  if (body.event !== 'payment.received')
    return new Response(null, { status: 200 });

  const ok = await handleMayarEvent(
    await getDb(),
    mayar,
    body as Record<string, unknown>,
    text,
  );
  return ok
    ? new Response(null, { status: 200 })
    : json(503, 'RETRY', 'Coba lagi.');
}
