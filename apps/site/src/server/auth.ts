import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { testUtils } from 'better-auth/plugins';
import { getDb, schema } from './db';
import { getEnv } from './env';

/*
 * Login hanya lewat Google. Tidak ada password yang disimpan, jadi tidak ada
 * reset password atau email verifikasi yang perlu dijaga.
 */
function options(env = getEnv()) {
  return {
    appName: 'Takaran',
    baseURL: env.APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.APP_URL],
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    advanced: {
      useSecureCookies: env.APP_URL.startsWith('https://'),
      defaultCookieAttributes: { sameSite: 'lax' as const, httpOnly: true },
    },
    rateLimit: { enabled: true, window: 60, max: 30 },
  };
}

let instance: ReturnType<typeof create> | undefined;

async function create() {
  const db = await getDb();
  return betterAuth({
    ...options(),
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    plugins: [nextCookies()],
  });
}

export function getAuth() {
  instance ??= create();
  return instance;
}

/**
 * Instans terpisah dengan helper pembuat sesi untuk uji E2E. Hanya boleh
 * dipakai bila E2E_TEST_AUTH=1 dan bukan produksi (dijaga di rute pemakainya).
 */
export async function getTestAuth() {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.E2E_TEST_AUTH !== '1'
  )
    throw new Error('Auth uji tidak tersedia.');
  const db = await getDb();
  return betterAuth({
    ...options(),
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    plugins: [testUtils()],
  });
}
