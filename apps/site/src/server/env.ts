import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  ADMIN_EMAILS: z.string().default(''),
  IP_SALT: z.string().min(16),
  MAYAR_API_KEY: z.string().optional(),
  MAYAR_BASE_URL: z
    .enum(['https://api.mayar.io/hl/v2', 'https://api.mayar.id/hl/v2'])
    .default('https://api.mayar.io/hl/v2'),
  MAYAR_WEBHOOK_TOKEN: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(16).optional(),
  ),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Membaca env sekali dan gagal jelas bila ada yang kurang. Hanya di server. */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join('.'));
    throw new Error(`Konfigurasi server belum lengkap: ${missing.join(', ')}`);
  }
  cached = parsed.data;
  return cached;
}

export function adminEmails(): string[] {
  return getEnv()
    .ADMIN_EMAILS.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function mayarConfig() {
  const env = getEnv();
  if (!env.MAYAR_API_KEY) return null;
  return { apiKey: env.MAYAR_API_KEY, baseUrl: env.MAYAR_BASE_URL };
}
