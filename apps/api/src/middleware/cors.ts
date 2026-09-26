import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';

export const cors: MiddlewareHandler<AppEnv> = async (context, next) => {
  const origin = context.req.header('Origin');
  const allowed = context.env.ALLOWED_ORIGINS.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (origin && !allowed.includes(origin)) {
    return context.json(
      {
        error: {
          code: 'CORS_FORBIDDEN',
          message: 'Asal permintaan tidak diizinkan.',
        },
      },
      403,
    );
  }
  if (context.req.method === 'OPTIONS') {
    const response = new Response(null, { status: 204 });
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Vary', 'Origin');
      response.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      response.headers.set('Access-Control-Max-Age', '600');
    }
    return response;
  }
  await next();
  if (origin) {
    context.res.headers.set('Access-Control-Allow-Origin', origin);
    context.res.headers.set('Vary', 'Origin');
  }
};
