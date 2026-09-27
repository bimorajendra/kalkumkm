import { desc } from 'drizzle-orm';
import { getDb } from '@/server/db';
import { waitlist } from '@/server/db/schema';
import { getSessionUser, isAdmin } from '@/server/session';

/** Sel yang diawali tanda rumus diberi awalan agar tidak dijalankan Excel. */
function cell(value: string | null): string {
  const text = (value ?? '').replace(/"/g, '""');
  return /^[=+\-@]/.test(text) ? `"'${text}"` : `"${text}"`;
}

export async function GET() {
  const current = await getSessionUser();
  if (!current || !isAdmin(current))
    return new Response('Tidak ditemukan.', { status: 404 });
  const rows = await (await getDb())
    .select()
    .from(waitlist)
    .orderBy(desc(waitlist.createdAt));
  const csv = [
    'waktu,usaha,whatsapp,jenis,sumber',
    ...rows.map((row) =>
      [
        row.createdAt.toISOString(),
        row.businessName,
        row.whatsapp,
        row.productType,
        row.source,
      ]
        .map(cell)
        .join(','),
    ),
  ].join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="daftar-tunggu.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
