import { Hono } from 'hono';
import type { OrderRow, OrderStatus, PayMethod } from '../db/schema';
import type { AppEnv } from '../types';

const statuses: OrderStatus[] = [
  'waitlist',
  'preorder',
  'checkout',
  'paid',
  'licensed',
  'refunded',
  'cancelled',
];
const methods: PayMethod[] = ['transfer', 'qris'];

function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.get('/', async (context) => {
  const filter = context.req.query('status');
  const validFilter =
    filter && statuses.includes(filter as OrderStatus) ? filter : undefined;
  const query = validFilter
    ? context.env.DB.prepare(
        'SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC',
      ).bind(validFilter)
    : context.env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC');
  const { results = [] } = await query.all<OrderRow>();

  return context.html(
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pesanan Takaran</title>
        <style>
          {
            'body{font:16px system-ui,sans-serif;max-width:1100px;margin:32px auto;padding:0 16px;color:#2b1d14;background:#fbf6f1}a,button,select,input{font:inherit}button,a,select,input{min-height:44px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px;border-bottom:1px solid #e7d9cb}form{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.actions{display:grid;gap:8px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}:focus-visible{outline:2px solid #c85a0c;outline-offset:2px}'
          }
        </style>
      </head>
      <body>
        <header>
          <h1>Pesanan</h1>
          <a href="/admin/export.csv">Unduh CSV</a>
        </header>
        <form method="get" action="/admin">
          <label for="status">Filter status</label>
          <select id="status" name="status">
            <option value="">Semua</option>
            {statuses.map((status) => (
              <option value={status} selected={status === validFilter}>
                {status}
              </option>
            ))}
          </select>
          <button type="submit">Terapkan</button>
        </form>
        <table>
          <caption>Daftar pesanan terbaru</caption>
          <thead>
            <tr>
              <th>Usaha</th>
              <th>WhatsApp</th>
              <th>Jenis</th>
              <th>Status</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {results.map((order) => (
              <tr>
                <td>{order.business_name}</td>
                <td>{order.whatsapp}</td>
                <td>{order.product_type ?? 'Tidak dipilih'}</td>
                <td>{order.status}</td>
                <td>{order.created_at}</td>
                <td class="actions">
                  {order.status === 'waitlist' ||
                  order.status === 'preorder' ? (
                    <form
                      method="post"
                      action={`/admin/orders/${encodeURIComponent(order.id)}/paid`}
                    >
                      <label>
                        Nominal rupiah{' '}
                        <input
                          name="amount"
                          inputMode="numeric"
                          pattern="[0-9]+"
                          required
                        />
                      </label>
                      <label>
                        Metode{' '}
                        <select name="method">
                          {methods.map((method) => (
                            <option value={method}>{method}</option>
                          ))}
                        </select>
                      </label>
                      <button type="submit">Tandai lunas</button>
                    </form>
                  ) : null}
                  <form
                    method="post"
                    action={`/admin/orders/${encodeURIComponent(order.id)}/delete`}
                  >
                    <button type="submit">Hapus pesanan</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {results.length === 0 ? (
          <p>Belum ada pesanan untuk status ini.</p>
        ) : null}
      </body>
    </html>,
  );
});

adminRoutes.post('/orders/:id/paid', async (context) => {
  const body = await context.req.parseBody();
  const amountText = typeof body.amount === 'string' ? body.amount : '';
  const method = typeof body.method === 'string' ? body.method : '';
  if (
    !/^\d+$/.test(amountText) ||
    !Number.isSafeInteger(Number(amountText)) ||
    Number(amountText) <= 0 ||
    !methods.includes(method as PayMethod)
  ) {
    return context.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Nominal dan metode pembayaran tidak valid.',
        },
      },
      400,
    );
  }
  const now = new Date().toISOString();
  const result = await context.env.DB.prepare(`
    UPDATE orders SET status = 'paid', price_idr = ?, pay_method = ?, paid_at = ?
    WHERE id = ? AND status IN ('waitlist', 'preorder')
  `)
    .bind(Number(amountText), method, now, context.req.param('id'))
    .run();
  if (!result.meta.changes)
    return context.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Pesanan tidak ditemukan atau sudah diproses.',
        },
      },
      404,
    );
  return context.redirect('/admin?status=paid', 303);
});

adminRoutes.post('/orders/:id/delete', async (context) => {
  const id = context.req.param('id');
  const licenseDelete = context.env.DB.prepare(
    'DELETE FROM licenses WHERE order_id = ?',
  ).bind(id);
  const orderDelete = context.env.DB.prepare(
    'DELETE FROM orders WHERE id = ?',
  ).bind(id);
  const results = await context.env.DB.batch([licenseDelete, orderDelete]);
  if (!results[1]?.meta.changes)
    return context.json(
      { error: { code: 'NOT_FOUND', message: 'Pesanan tidak ditemukan.' } },
      404,
    );
  return context.redirect('/admin', 303);
});

adminRoutes.get('/export.csv', async (context) => {
  const { results = [] } = await context.env.DB.prepare(
    'SELECT * FROM orders ORDER BY created_at DESC',
  ).all<OrderRow>();
  const columns: Array<keyof OrderRow> = [
    'id',
    'business_name',
    'customer_name',
    'email',
    'whatsapp',
    'product_type',
    'status',
    'price_idr',
    'pay_method',
    'mayar_invoice_id',
    'claim_token_hash',
    'paid_at',
    'licensed_at',
    'terminal_at',
    'source',
    'consent_at',
    'created_at',
  ];
  const rows = [
    columns.map(csvCell).join(','),
    ...results.map((row) =>
      columns.map((column) => csvCell(row[column])).join(','),
    ),
  ];
  return context.body(rows.join('\r\n'), 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="pesanan-takaran.csv"',
    'Cache-Control': 'no-store',
  });
});
