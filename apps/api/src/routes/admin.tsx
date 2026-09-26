import { Hono } from 'hono';
import type { OrderRow, OrderStatus, PayMethod } from '../db/schema';
import { issueLicense } from '../license';
import type { AppEnv } from '../types';
import { checkMayarOrder } from './checkout';

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
              <th>Invoice</th>
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
                <td>{order.mayar_invoice_id ?? '—'}</td>
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
                  {order.status === 'paid' ? (
                    <form
                      method="post"
                      action={`/admin/orders/${encodeURIComponent(order.id)}/license`}
                    >
                      <button type="submit">Terbitkan kode Pro</button>
                    </form>
                  ) : null}
                  {order.status === 'checkout' ? (
                    <form
                      method="post"
                      action={`/admin/orders/${encodeURIComponent(order.id)}/check-mayar`}
                    >
                      <button type="submit">Cek ulang status di Mayar</button>
                    </form>
                  ) : null}
                  {order.status === 'licensed' ? (
                    <>
                      <form
                        method="post"
                        action={`/admin/orders/${encodeURIComponent(order.id)}/resend`}
                      >
                        <button type="submit">
                          Tampilkan ulang tautan aktivasi
                        </button>
                      </form>
                      <form
                        method="post"
                        action={`/admin/orders/${encodeURIComponent(order.id)}/refund`}
                      >
                        <button type="submit">Tandai refund manual</button>
                      </form>
                    </>
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

adminRoutes.post('/orders/:id/license', async (context) => {
  const id = context.req.param('id');
  const row = await context.env.DB.prepare(
    "SELECT id, business_name, whatsapp FROM orders WHERE id = ? AND status = 'paid'",
  )
    .bind(id)
    .first<{ id: string; business_name: string; whatsapp: string }>();
  if (!row)
    return context.json(
      {
        error: {
          code: 'NOT_PAID',
          message: 'Pesanan harus berstatus lunas sebelum kode diterbitkan.',
        },
      },
      409,
    );
  if (!context.env.LICENSE_PRIVATE_KEY)
    return context.json(
      {
        error: {
          code: 'LICENSE_UNAVAILABLE',
          message: 'Kunci penerbitan belum disiapkan.',
        },
      },
      503,
    );
  const appUrl =
    context.env.APP_URL ?? context.env.ALLOWED_ORIGINS.split(',')[0]?.trim();
  let activationPath: URL;
  try {
    activationPath = new URL('/aktivasi', appUrl ?? '');
  } catch {
    return context.json(
      {
        error: {
          code: 'APP_URL_MISSING',
          message: 'Alamat aplikasi belum disiapkan.',
        },
      },
      503,
    );
  }
  try {
    const { payload, code } = await issueLicense(
      row.business_name,
      context.env.LICENSE_PRIVATE_KEY,
    );
    const now = new Date().toISOString();
    const results = await context.env.DB.batch([
      context.env.DB.prepare(
        "INSERT INTO licenses (id, order_id, plan, issued_at, license_code) SELECT ?, ?, 'pro', ?, ? WHERE EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = 'paid')",
      ).bind(payload.id, id, now, code, id),
      context.env.DB.prepare(
        "UPDATE orders SET status = 'licensed', licensed_at = ?, terminal_at = ? WHERE id = ? AND status = 'paid'",
      ).bind(now, now, id),
    ]);
    if (!results[1]?.meta.changes)
      return context.json(
        { error: { code: 'NOT_PAID', message: 'Pesanan sudah diproses.' } },
        409,
      );
    const link = `${activationPath.toString()}#${code}`;
    const message = encodeURIComponent(
      `Ini tautan aktivasi Takaran Pro untuk ${row.business_name}: ${link}`,
    );
    return context.html(
      <main
        lang="id"
        style="font-family:system-ui,sans-serif;max-width:680px;margin:48px auto;padding:0 20px"
      >
        <h1>Kode Pro terbit</h1>
        <p>
          Pesanan {row.business_name} sudah berstatus berlisensi. Kirim tautan
          ini lewat WhatsApp.
        </p>
        <p>
          <a href={link}>Buka tautan aktivasi</a>
        </p>
        <textarea
          aria-label="Tautan aktivasi"
          readOnly
          rows={4}
          style="width:100%"
        >
          {link}
        </textarea>
        <p>
          <a
            href={`https://wa.me/${row.whatsapp.replace(/\D/g, '')}?text=${message}`}
          >
            Kirim lewat WhatsApp
          </a>
        </p>
        <p>
          <a href="/admin?status=licensed">Kembali ke pesanan</a>
        </p>
      </main>,
    );
  } catch {
    return context.json(
      {
        error: {
          code: 'LICENSE_ISSUE_FAILED',
          message: 'Kode belum berhasil diterbitkan. Coba lagi.',
        },
      },
      500,
    );
  }
});

adminRoutes.post('/orders/:id/refund', async (context) => {
  const now = new Date().toISOString();
  const result = await context.env.DB.prepare(
    "UPDATE orders SET status = 'refunded', terminal_at = ? WHERE id = ? AND status IN ('paid', 'licensed')",
  )
    .bind(now, context.req.param('id'))
    .run();
  if (!result.meta.changes)
    return context.json(
      { error: { code: 'NOT_FOUND', message: 'Pesanan tidak ditemukan.' } },
      404,
    );
  return context.redirect('/admin?status=refunded', 303);
});

adminRoutes.post('/orders/:id/check-mayar', async (context) => {
  const order = await context.env.DB.prepare(
    "SELECT * FROM orders WHERE id = ? AND status IN ('checkout', 'paid')",
  )
    .bind(context.req.param('id'))
    .first<OrderRow>();
  if (!order)
    return context.json(
      { error: { code: 'NOT_FOUND', message: 'Pesanan tidak ditemukan.' } },
      404,
    );
  try {
    await checkMayarOrder(context.env, order);
    const updated = await context.env.DB.prepare(
      'SELECT status FROM orders WHERE id = ?',
    )
      .bind(order.id)
      .first<{ status: OrderStatus }>();
    return context.redirect(
      `/admin?status=${encodeURIComponent(updated?.status ?? order.status)}`,
      303,
    );
  } catch {
    return context.json(
      {
        error: {
          code: 'MAYAR_UNAVAILABLE',
          message: 'Status belum bisa diperiksa. Coba lagi.',
        },
      },
      503,
    );
  }
});

adminRoutes.post('/orders/:id/resend', async (context) => {
  const row = await context.env.DB.prepare(`
    SELECT orders.business_name, orders.whatsapp, licenses.license_code
    FROM orders JOIN licenses ON licenses.order_id = orders.id
    WHERE orders.id = ? AND orders.status = 'licensed'
  `)
    .bind(context.req.param('id'))
    .first<{
      business_name: string;
      whatsapp: string;
      license_code: string | null;
    }>();
  if (!row?.license_code)
    return context.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Tautan aktivasi tidak ditemukan.',
        },
      },
      404,
    );
  let activationUrl: URL;
  try {
    const appUrl =
      context.env.APP_URL ?? context.env.ALLOWED_ORIGINS.split(',')[0]?.trim();
    activationUrl = new URL('/aktivasi', appUrl);
  } catch {
    return context.json(
      {
        error: {
          code: 'APP_URL_MISSING',
          message: 'Alamat aplikasi belum disiapkan.',
        },
      },
      503,
    );
  }
  activationUrl.hash = row.license_code;
  const message = encodeURIComponent(
    `Ini tautan aktivasi Takaran Pro untuk ${row.business_name}: ${activationUrl}`,
  );
  return context.html(
    <main
      lang="id"
      style="font-family:system-ui,sans-serif;max-width:680px;margin:48px auto;padding:0 20px"
    >
      <h1>Tautan aktivasi siap dikirim</h1>
      <p>Kirim tautan ini ke pemilik {row.business_name}.</p>
      <textarea
        aria-label="Tautan aktivasi"
        readOnly
        rows={4}
        style="width:100%"
      >
        {activationUrl.toString()}
      </textarea>
      <p>
        <a
          href={`https://wa.me/${row.whatsapp.replace(/\D/g, '')}?text=${message}`}
        >
          Kirim lewat WhatsApp
        </a>
      </p>
      <p>
        <a href="/admin?status=licensed">Kembali ke pesanan</a>
      </p>
    </main>,
  );
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
