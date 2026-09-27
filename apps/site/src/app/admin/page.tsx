import { formatRupiah } from '@takaran/ui/format';
import { desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getDb } from '@/server/db';
import { orders, user, waitlist } from '@/server/db/schema';
import { requireAdmin } from '@/server/session';
import { checkMayarAction, grantProAction, refundAction } from './actions';

export const metadata: Metadata = { title: 'Admin', robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default async function AdminPage() {
  await requireAdmin();
  const db = await getDb();
  const [orderRows, waitlistRows] = await Promise.all([
    db
      .select({ order: orders, email: user.email })
      .from(orders)
      .innerJoin(user, eq(user.id, orders.userId))
      .orderBy(desc(orders.createdAt))
      .limit(200),
    db.select().from(waitlist).orderBy(desc(waitlist.createdAt)).limit(200),
  ]);

  return (
    <main className="mx-auto grid max-w-[1120px] gap-10 px-4 py-8 lg:px-8">
      <h1 className="text-[44px] leading-[48px]">Admin</h1>

      <section aria-labelledby="pesanan" className="grid gap-3">
        <h2 id="pesanan" className="text-xl font-semibold">
          Pesanan Pro
        </h2>
        <div className="min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Waktu</TableHead>
                <TableHead scope="col">Akun</TableHead>
                <TableHead scope="col">Usaha dan WhatsApp</TableHead>
                <TableHead scope="col">Nominal</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderRows.map(({ order, email }) => (
                <TableRow key={order.id}>
                  <TableCell>{dateFormat.format(order.createdAt)}</TableCell>
                  <TableCell>{email}</TableCell>
                  <TableCell>
                    {order.businessName}
                    <span className="block text-sm text-muted-foreground">
                      {order.whatsapp}
                    </span>
                  </TableCell>
                  <TableCell>{formatRupiah(order.priceIdr)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {order.status === 'pending' ? (
                        <form action={checkMayarAction}>
                          <input
                            type="hidden"
                            name="orderId"
                            value={order.id}
                          />
                          <Button type="submit" size="sm" variant="outline">
                            Cek Mayar
                          </Button>
                        </form>
                      ) : null}
                      {order.status === 'paid' ? (
                        <form action={refundAction}>
                          <input
                            type="hidden"
                            name="orderId"
                            value={order.id}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                          >
                            Tandai refund
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {orderRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    Belum ada pesanan.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
        <form
          action={grantProAction}
          className="flex flex-wrap items-end gap-2"
        >
          <div className="grid gap-1.5">
            <label htmlFor="grant-email" className="text-sm font-medium">
              Beri Pro manual (pembayaran di luar Mayar), email akun
            </label>
            <Input
              id="grant-email"
              name="email"
              type="email"
              required
              className="w-72"
            />
          </div>
          <Button type="submit">Beri Pro</Button>
        </form>
      </section>

      <section aria-labelledby="tunggu" className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="tunggu" className="text-xl font-semibold">
            Daftar tunggu ({waitlistRows.length})
          </h2>
          <Button asChild variant="outline" size="sm">
            <a href="/admin/export">Unduh CSV</a>
          </Button>
        </div>
        <div className="min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Waktu</TableHead>
                <TableHead scope="col">Usaha</TableHead>
                <TableHead scope="col">WhatsApp</TableHead>
                <TableHead scope="col">Jenis</TableHead>
                <TableHead scope="col">Sumber</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waitlistRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{dateFormat.format(row.createdAt)}</TableCell>
                  <TableCell>{row.businessName}</TableCell>
                  <TableCell>{row.whatsapp}</TableCell>
                  <TableCell>{row.productType}</TableCell>
                  <TableCell>{row.source ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
