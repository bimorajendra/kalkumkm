import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getTestAuth } from '@/server/auth';
import { grantPro } from '@/server/billing';
import { getDb } from '@/server/db';
import { user } from '@/server/db/schema';

const body = z.object({
  email: z.email(),
  name: z.string().min(1).default('Penguji'),
  pro: z.boolean().default(false),
});

/**
 * Hanya untuk uji E2E: membuat akun dan sesi tanpa Google. Ditolak di produksi
 * dan bila E2E_TEST_AUTH bukan "1", jadi rute ini tidak ada di server sungguhan.
 */
export async function POST(request: Request) {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.E2E_TEST_AUTH !== '1'
  )
    return new Response('Tidak ditemukan.', { status: 404 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return new Response('Isian tidak valid.', { status: 400 });

  const db = await getDb();
  const auth = await getTestAuth();
  const { test } = await auth.$context;
  const email = parsed.data.email.toLowerCase();
  const [existing] = await db.select().from(user).where(eq(user.email, email));
  const account =
    existing ??
    (await test.saveUser(test.createUser({ email, name: parsed.data.name })));
  if (parsed.data.pro) await grantPro(db, account.id);

  const { cookies } = await test.login({ userId: account.id });
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const cookie of cookies)
    headers.append(
      'Set-Cookie',
      `${cookie.name}=${cookie.value}; Path=${cookie.path}; HttpOnly; SameSite=Lax`,
    );
  return new Response(JSON.stringify({ id: account.id }), { headers });
}
