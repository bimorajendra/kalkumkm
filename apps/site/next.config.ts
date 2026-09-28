import path from 'node:path';
import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  transpilePackages: ['@takaran/calc', '@takaran/schema', '@takaran/ui'],
  serverExternalPackages: ['pg', '@electric-sql/pglite'],
  poweredByHeader: false,
  agentRules: false,
  // CSP style-src pakai nonce ketat (lihat proxy.ts); overlay dev tools Next.js
  // menyuntik <style> sendiri tanpa nonce itu, jadi kena blok dan tampil kosong.
  // Overlay ini cuma alat bantu dev, tidak ada di build produksi.
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default config;
