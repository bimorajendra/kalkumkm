import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { normalizeWhatsApp } from '@/lib/phone';
import { getDb } from '@/server/db';
import { waitlist } from '@/server/db/schema';
import { getEnv } from '@/server/env';
import { clientIp, consumeRateLimit, hashKey } from '@/server/rate-limit';
import { readLimitedText } from '@/server/request-body';

const schema = z
  .object({
    businessName: z.string().trim().min(1).max(120),
    whatsapp: z.string().trim().min(8).max(32),
    productType: z.enum(['kue', 'frozen', 'katering', 'lainnya']),
    consent: z.literal(true),
    // Kolom jebakan untuk bot: manusia tidak melihat dan tidak mengisinya.
    website: z.string().max(0).optional(),
    source: z
      .string()
      .trim()
      .max(64)
      .regex(/^[\p{L}\p{N}_-]*$/u)
      .optional(),
  })
  .strict();

const fail = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

export async function POST(request: Request) {
  const bodyText = await readLimitedText(request, 8192);
  if (!bodyText.ok && bodyText.reason === 'too_large')
    return fail(413, 'VALIDATION_FAILED', 'Isian terlalu besar.');
  if (!bodyText.ok)
    return fail(400, 'VALIDATION_FAILED', 'Format permintaan tidak valid.');
  const { text } = bodyText;
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return fail(400, 'VALIDATION_FAILED', 'Format permintaan tidak valid.');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return fail(400, 'VALIDATION_FAILED', 'Periksa lagi isian daftar tunggu.');
  const whatsapp = normalizeWhatsApp(parsed.data.whatsapp);
  if (!whatsapp)
    return fail(
      400,
      'VALIDATION_FAILED',
      'Masukkan nomor WhatsApp Indonesia, seperti 0812… atau +62 812… .',
    );

  const db = await getDb();
  const key = hashKey(getEnv().IP_SALT, 'waitlist', clientIp(request.headers));
  if (!(await consumeRateLimit(db, key, 5, 3600)))
    return fail(
      429,
      'RATE_LIMITED',
      'Batas daftar tunggu tercapai. Coba lagi satu jam lagi.',
    );

  const id = randomUUID();
  await db.insert(waitlist).values({
    id,
    businessName: parsed.data.businessName,
    whatsapp,
    productType: parsed.data.productType,
    source: parsed.data.source ?? null,
    consentAt: new Date(),
  });
  return Response.json({ data: { id } }, { status: 201 });
}
