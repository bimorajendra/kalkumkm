import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('DATABASE_URL', 'pglite:memory://');
  vi.stubEnv('APP_URL', 'http://localhost:3100');
  vi.stubEnv('BETTER_AUTH_SECRET', 'test-only-secret-test-only-secret');
  vi.stubEnv('GOOGLE_CLIENT_ID', 'test');
  vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test');
  vi.stubEnv('IP_SALT', 'test-only-ip-salt');
});

afterEach(() => vi.unstubAllEnvs());

describe('konfigurasi opsional Docker', () => {
  it('menerima token Mayar kosong saat integrasi tidak dikonfigurasi', async () => {
    vi.stubEnv('MAYAR_WEBHOOK_TOKEN', '');
    const { getEnv } = await import('./env');
    expect(getEnv().MAYAR_WEBHOOK_TOKEN).toBeUndefined();
  });

  it('tetap menolak token pendek tanpa membocorkan nilainya', async () => {
    vi.stubEnv('MAYAR_WEBHOOK_TOKEN', 'too-short');
    const { getEnv } = await import('./env');
    expect(getEnv).toThrow(
      'Konfigurasi server belum lengkap: MAYAR_WEBHOOK_TOKEN',
    );
    expect(getEnv).not.toThrow('too-short');
  });
});
