import { Hono } from 'hono';
import { requireAccessJwt } from './middleware/access-jwt';
import { cors } from './middleware/cors';
import { adminRoutes } from './routes/admin';
import { publicRoutes } from './routes/public';
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
app.route('/admin', adminRoutes);

export async function cleanupRetention(
  db: D1Database,
  now = new Date(),
): Promise<void> {
  const waitlistCutoff = new Date(now);
  waitlistCutoff.setUTCMonth(waitlistCutoff.getUTCMonth() - 12);
  const rateLimitCutoff = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  await Promise.all([
    db
      .prepare(
        "DELETE FROM orders WHERE status = 'waitlist' AND created_at < ?",
      )
      .bind(waitlistCutoff.toISOString())
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
