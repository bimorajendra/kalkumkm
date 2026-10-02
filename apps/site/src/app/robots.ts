import type { MetadataRoute } from 'next';

// Baca APP_URL saat permintaan, bukan saat build: image yang dibuat tanpa
// build arg APP_URL tetap menghasilkan URL domain produksi.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const origin = new URL(process.env.APP_URL || 'http://localhost:3000');
  const apiPaths = ['/api/'];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: apiPaths },
      { userAgent: 'Googlebot', allow: '/', disallow: apiPaths },
      { userAgent: 'Bingbot', allow: '/', disallow: apiPaths },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: apiPaths },
      // OAI-SearchBot controls search discovery; GPTBot is a separate training crawler.
      { userAgent: 'GPTBot', disallow: '/' },
    ],
    sitemap: new URL('/sitemap.xml', origin).href,
  };
}
