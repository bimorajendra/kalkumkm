import { Hono } from 'hono';
import { requireAccessJwt } from './middleware/access-jwt';
import { cors } from './middleware/cors';
import { adminRoutes } from './routes/admin';
import { checkoutRoutes } from './routes/checkout';
import { publicRoutes } from './routes/public';
import { mayarWebhookRoutes } from './routes/webhooks-mayar';
import type { AppEnv, Bindings } from './types';

export const app = new Hono<AppEnv>();
app.use('/v1/*', cors);
app.use('/admin', requireAccessJwt);
app.use('/admin/*', requireAccessJwt);

app.onError((error, context) => {
  if (error.name === 'HTTPException') {
    return context.json(
      { error: { code: 'REQUEST_FAILED', message: error.message } },
      400,
    );
  }
  return context.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi gangguan. Coba lagi nanti.',
      },
    },
    500,
  );
});

app.get('/v1/health', (context) => context.json({ data: { ok: true } }));
app.route('/v1', publicRoutes);
app.route('/v1', checkoutRoutes);
app.route('/v1', mayarWebhookRoutes);
app.route('/admin', adminRoutes);

export async function cleanupRetention(
  db: D1Database,
  now = new Date(),
): Promise<void> {
  const retentionCutoff = new Date(now);
  retentionCutoff.setUTCMonth(retentionCutoff.getUTCMonth() - 12);
  const abandonedCheckoutCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const rateLimitCutoff = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  await Promise.all([
    db
      .prepare(
        "DELETE FROM orders WHERE status = 'waitlist' AND created_at < ?",
      )
      .bind(retentionCutoff.toISOString())
      .run(),
    db
      .prepare(`
        UPDATE orders SET status = 'cancelled', terminal_at = ?
        WHERE status = 'checkout' AND created_at < ?
      `)
      .bind(
        abandonedCheckoutCutoff.toISOString(),
        abandonedCheckoutCutoff.toISOString(),
      )
      .run(),
    db
      .prepare(`
        UPDATE licenses SET license_code = NULL WHERE order_id IN (
          SELECT id FROM orders WHERE status IN ('licensed', 'refunded', 'cancelled')
            AND terminal_at < ?
        )
      `)
      .bind(retentionCutoff.toISOString())
      .run(),
    db
      .prepare(`
        UPDATE orders SET business_name = 'Dihapus', customer_name = NULL,
          email = NULL, whatsapp = '', product_type = NULL, claim_token_hash = NULL
        WHERE status IN ('licensed', 'refunded', 'cancelled') AND terminal_at < ?
      `)
      .bind(retentionCutoff.toISOString())
      .run(),
    db
      .prepare('DELETE FROM webhook_events WHERE received_at < ?')
      .bind(retentionCutoff.toISOString())
      .run(),
    db
      .prepare('DELETE FROM rate_limits WHERE window_start < ?')
      .bind(rateLimitCutoff.toISOString())
      .run(),
  ]);
}

export default {
  fetch: app.fetch,
  scheduled(
    _controller: ScheduledController,
    env: Bindings,
    context: ExecutionContext,
  ) {
    context.waitUntil(cleanupRetention(env.DB));
  },
};
