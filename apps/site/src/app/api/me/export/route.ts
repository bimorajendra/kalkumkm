import { getDb } from '@/server/db';
import { getSessionUser } from '@/server/session';
import { exportUserData } from '@/server/store';

/** Unduh seluruh data akun sebagai JSON. Hanya untuk pemilik akun. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return new Response('Masuk dulu.', { status: 401 });
  const data = await exportUserData(await getDb(), user.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="takaran-data.json"',
      'Cache-Control': 'no-store',
    },
  });
}
